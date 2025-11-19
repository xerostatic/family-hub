'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { Plus, Trash2, Check, TrendingUp, TrendingDown, DollarSign, Edit2, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, addMonths } from 'date-fns'
import { FamilyMember, BudgetItem } from '@/types'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DebtSnowballView from './DebtSnowballView'
import DebtImpactAnalysis from './DebtImpactAnalysis'
import RefinancingCalculator from './RefinancingCalculator'

type BudgetItemInsert = Database['public']['Tables']['budget_items']['Insert']

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function BudgetSection({ familyMembers }: { familyMembers: FamilyMember[] }) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'charts' | 'projections' | 'debt' | 'debt-impact' | 'refinance'>('charts')
  const [formData, setFormData] = useState({
    category: 'Bills',
    description: '',
    amount: '',
    due_date: '',
    is_income: false,
    recurrence: 'none',
    payday_date: '',
    pay_frequency: 'monthly',
    is_debt: false,
    outstanding_balance: '',
    include_in_snowball: false,
    interest_rate: '',
    payment_term_months: ''
  })

  useEffect(() => {
    loadBudgetItems()
  }, [])


  const loadBudgetItems = async () => {
    const { data, error } = await supabase
      .from('budget_items')
      .select('*')
      .order('due_date')
    
    if (error) {
      console.error('Error loading budget items:', error)
      return
    }
    
    if (data) setBudgetItems(data)
  }

  const handleEdit = (item: BudgetItem) => {
    setEditingId(item.id)
    setFormData({
      category: item.category,
      description: item.description,
      amount: item.amount.toString(),
      due_date: item.due_date,
      is_income: item.is_income,
      recurrence: item.recurrence || 'none',
      payday_date: item.payday_date || '',
      pay_frequency: item.pay_frequency || 'monthly',
      is_debt: item.is_debt,
      outstanding_balance: item.outstanding_balance ? item.outstanding_balance.toString() : '',
      include_in_snowball: item.include_in_snowball || false,
      interest_rate: item.interest_rate ? item.interest_rate.toString() : '',
      payment_term_months: item.payment_term_months ? item.payment_term_months.toString() : ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      category: 'Bills',
      description: '',
      amount: '',
      due_date: '',
      is_income: false,
      recurrence: 'none',
      payday_date: '',
      pay_frequency: 'monthly',
      is_debt: false,
      outstanding_balance: '',
      include_in_snowball: false,
      interest_rate: '',
      payment_term_months: ''
    })
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const updateData = {
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      family_member_id: null,
      is_income: formData.is_income,
      recurrence: formData.is_income 
        ? (formData.pay_frequency === 'biweekly' ? 'biweekly' : 
           formData.pay_frequency === 'monthly' ? 'monthly' : 
           formData.pay_frequency === 'yearly' ? 'yearly' : null)
        : (formData.recurrence === 'none' ? null : formData.recurrence),
      payday_date: formData.is_income && formData.payday_date ? formData.payday_date : null,
      pay_frequency: formData.is_income && formData.pay_frequency ? formData.pay_frequency : null,
      is_debt: !formData.is_income && formData.is_debt,
      outstanding_balance: formData.is_debt && formData.outstanding_balance ? parseFloat(formData.outstanding_balance) : null,
      include_in_snowball: formData.is_debt && formData.include_in_snowball,
      interest_rate: formData.is_debt && formData.interest_rate ? parseFloat(formData.interest_rate) : null,
      payment_term_months: formData.is_debt && formData.payment_term_months ? parseInt(formData.payment_term_months) : null,
    }

    if (editingId) {
      // Update existing item
      const { error } = await supabase
        .from('budget_items')
        // @ts-expect-error - Supabase type inference issue
        .update(updateData)
        .eq('id', editingId)
      
      if (error) {
        console.error('Error updating budget item:', error)
        alert('Failed to update budget item. Please try again.')
        return
      }
    } else {
      // Create new item
      const { error } = await supabase
        .from('budget_items')
        // @ts-expect-error - Supabase type inference issue
        .insert([updateData])
      
      if (error) {
        console.error('Error creating budget item:', error)
        alert(`Failed to create budget item: ${error.message || 'Unknown error'}. Make sure you've run the database migration!`)
        return
      }
    }
    
    resetForm()
    loadBudgetItems()
  }

  const togglePaid = async (id: string, paid: boolean) => {
    const { error } = await supabase
      .from('budget_items')
      // @ts-expect-error - Supabase type inference issue with Database generic
      .update({ paid: !paid })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating budget item:', error)
      return
    }
    
    loadBudgetItems()
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting budget item:', error)
      alert('Failed to delete budget item. Please try again.')
      return
    }
    
    loadBudgetItems()
  }

  // Calculate totals
  const expenses = budgetItems.filter(item => !item.is_income)
  const income = budgetItems.filter(item => item.is_income)
  const debtItems = expenses.filter(item => item.is_debt)
  
  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
  const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
  const totalDebt = debtItems.reduce((sum, item) => sum + (item.outstanding_balance ? parseFloat(item.outstanding_balance.toString()) : 0), 0)
  const netAmount = totalIncome - totalExpenses
  
  const paidExpenses = expenses.filter(item => item.paid).reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
  const unpaidExpenses = totalExpenses - paidExpenses

  // Monthly data for charts
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfMonth(new Date()),
      end: addMonths(startOfMonth(new Date()), 5)
    })

    return months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const monthKey = format(month, 'MMM yyyy')

      // Get items for this month
      const monthExpenses = expenses.filter(item => {
        const itemDate = parseISO(item.due_date)
        return itemDate >= monthStart && itemDate <= monthEnd
      })

      const monthIncome = income.filter(item => {
        const itemDate = parseISO(item.due_date)
        return itemDate >= monthStart && itemDate <= monthEnd
      })

      // Calculate recurring items
      const recurringExpenses = expenses.filter(item => item.recurrence === 'monthly')
      const recurringIncome = income.filter(item => item.recurrence === 'monthly' || item.recurrence === 'biweekly')
      
      // Calculate bi-weekly income for this month
      const biweeklyIncome = income.filter(item => item.recurrence === 'biweekly' || item.pay_frequency === 'biweekly')
      let biweeklyIncomeTotal = 0
      biweeklyIncome.forEach(item => {
        if (item.payday_date) {
          const paydayDate = parseISO(item.payday_date)
          // Calculate paydays in this month (every 2 weeks)
          let currentPayday = new Date(paydayDate)
          let paydaysInMonth = 0
          while (currentPayday <= monthEnd) {
            if (currentPayday >= monthStart && currentPayday <= monthEnd) {
              paydaysInMonth++
            }
            currentPayday = new Date(currentPayday.getTime() + 14 * 24 * 60 * 60 * 1000) // Add 14 days
          }
          biweeklyIncomeTotal += parseFloat(item.amount.toString()) * paydaysInMonth
        }
      })

      const recurringExpenseTotal = recurringExpenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
      const recurringIncomeTotal = recurringIncome.filter(item => item.recurrence === 'monthly').reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) + biweeklyIncomeTotal

      return {
        month: monthKey,
        expenses: monthExpenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) + recurringExpenseTotal,
        income: monthIncome.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) + recurringIncomeTotal,
        net: (monthIncome.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) + recurringIncomeTotal) - 
             (monthExpenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) + recurringExpenseTotal)
      }
    })
  }, [budgetItems, expenses, income])

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    expenses.forEach(item => {
      const current = categoryMap.get(item.category) || 0
      categoryMap.set(item.category, current + parseFloat(item.amount.toString()))
    })
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
  }, [expenses])

  // Current month recap
  const currentMonth = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const monthExpenses = expenses.filter(item => {
      const itemDate = parseISO(item.due_date)
      return itemDate >= monthStart && itemDate <= monthEnd
    })

    const monthIncome = income.filter(item => {
      const itemDate = parseISO(item.due_date)
      return itemDate >= monthStart && itemDate <= monthEnd
    })

    const recurringExpenses = expenses.filter(item => item.recurrence === 'monthly')
    const recurringIncome = income.filter(item => item.recurrence === 'monthly' || item.recurrence === 'biweekly')
    
    // Calculate bi-weekly income for current month
    const biweeklyIncome = income.filter(item => item.recurrence === 'biweekly' || item.pay_frequency === 'biweekly')
    let biweeklyIncomeTotal = 0
    biweeklyIncome.forEach(item => {
      if (item.payday_date) {
        const paydayDate = parseISO(item.payday_date)
        let currentPayday = new Date(paydayDate)
        let paydaysInMonth = 0
        while (currentPayday <= monthEnd) {
          if (currentPayday >= monthStart && currentPayday <= monthEnd) {
            paydaysInMonth++
          }
          currentPayday = new Date(currentPayday.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
        biweeklyIncomeTotal += parseFloat(item.amount.toString()) * paydaysInMonth
      }
    })

    return {
      expenses: monthExpenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) + 
                recurringExpenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0),
      income: monthIncome.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) + 
              recurringIncome.filter(item => item.recurrence === 'monthly').reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) +
              biweeklyIncomeTotal,
      paid: monthExpenses.filter(item => item.paid).reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) +
            recurringExpenses.filter(item => item.paid).reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
    }
  }, [budgetItems, expenses, income])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Budget Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">
            {format(new Date(), 'MMMM yyyy')} Recap & Projections
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('charts')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'charts' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Charts
            </button>
            <button
              onClick={() => setViewMode('projections')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'projections' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Projections
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('debt')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'debt' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Debt Snowball
            </button>
            <button
              onClick={() => setViewMode('debt-impact')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'debt-impact' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Debt Impact
            </button>
            <button
              onClick={() => setViewMode('refinance')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'refinance' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Refinance
            </button>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            Total Income
          </div>
          <div className="text-2xl font-bold text-green-700">${totalIncome.toFixed(2)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
            <TrendingDown className="w-4 h-4" />
            Total Expenses
          </div>
          <div className="text-2xl font-bold text-red-700">${totalExpenses.toFixed(2)}</div>
        </div>
        {totalDebt > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 text-sm text-orange-600 mb-1">
              <DollarSign className="w-4 h-4" />
              Total Debt
            </div>
            <div className="text-2xl font-bold text-orange-700">${totalDebt.toFixed(2)}</div>
          </div>
        )}
        <div className={`p-4 rounded-lg border ${
          netAmount >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className={`flex items-center gap-2 text-sm mb-1 ${
            netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
          }`}>
            <DollarSign className="w-4 h-4" />
            Net
          </div>
          <div className={`text-2xl font-bold ${
            netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            ${netAmount.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-2xl font-bold text-gray-700">
            ${(currentMonth.income - currentMonth.expenses).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentMonth.paid.toFixed(2)} paid
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_income}
                  onChange={(e) => setFormData({ ...formData, is_income: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">This is income</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option>Bills</option>
                <option>Groceries</option>
                <option>Gas</option>
                <option>Entertainment</option>
                <option>Healthcare</option>
                <option>Charitable Givings</option>
                <option>Salary</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Electric bill, salary, etc."
                required
              />
            </div>
            {!formData.is_income && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}
            {formData.is_income && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}
            {!formData.is_income && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">One-time</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_debt}
                      onChange={(e) => setFormData({ ...formData, is_debt: e.target.checked, outstanding_balance: e.target.checked ? formData.outstanding_balance : '' })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">This is debt (credit card, loan, etc.)</span>
                  </label>
                </div>
                {formData.is_debt && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Outstanding Balance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.outstanding_balance}
                        onChange={(e) => setFormData({ ...formData, outstanding_balance: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        required={formData.is_debt}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.interest_rate}
                        onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Term (Months)</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.payment_term_months}
                        onChange={(e) => setFormData({ ...formData, payment_term_months: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="60"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.include_in_snowball}
                          onChange={(e) => setFormData({ ...formData, include_in_snowball: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Include in Debt Snowball Calculation</span>
                      </label>
                    </div>
                  </>
                )}
              </>
            )}
            {formData.is_income && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payday Date</label>
                  <input
                    type="date"
                    value={formData.payday_date}
                    onChange={(e) => setFormData({ ...formData, payday_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Frequency</label>
                  <select
                    value={formData.pay_frequency}
                    onChange={(e) => {
                      const frequency = e.target.value
                      // Map pay_frequency to valid recurrence values
                      let recurrence = 'none'
                      if (frequency === 'biweekly') {
                        recurrence = 'biweekly'
                      } else if (frequency === 'monthly') {
                        recurrence = 'monthly'
                      } else if (frequency === 'yearly') {
                        recurrence = 'yearly'
                      }
                      // For weekly, keep recurrence as 'none' since it's not in the constraint
                      setFormData({ ...formData, pay_frequency: frequency, recurrence })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses Line Chart */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenses (6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Net Bar Chart */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Net (Income - Expenses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="net" fill="#3B82F6" name="Net Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Projections View */}
      {viewMode === 'projections' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">6-Month Projections</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">Month</th>
                    <th className="text-right py-2 px-4 font-semibold text-green-600">Income</th>
                    <th className="text-right py-2 px-4 font-semibold text-red-600">Expenses</th>
                    <th className="text-right py-2 px-4 font-semibold text-gray-700">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{month.month}</td>
                      <td className="text-right py-2 px-4 text-green-600">${month.income.toFixed(2)}</td>
                      <td className="text-right py-2 px-4 text-red-600">${month.expenses.toFixed(2)}</td>
                      <td className={`text-right py-2 px-4 font-semibold ${
                        month.net >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${month.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Current Month Recap */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {format(new Date(), 'MMMM yyyy')} Recap
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Income</div>
                <div className="text-2xl font-bold text-green-600">${currentMonth.income.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Expenses</div>
                <div className="text-2xl font-bold text-red-600">${currentMonth.expenses.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Net</div>
                <div className={`text-2xl font-bold ${
                  (currentMonth.income - currentMonth.expenses) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${(currentMonth.income - currentMonth.expenses).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {budgetItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No budget items yet. Click "Add Item" to get started!
            </div>
          ) : (
            <>
              {/* Income Items */}
              {income.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-600 mb-3">Income</h3>
                  <div className="space-y-3">
                    {income.map(item => {
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-lg border-2 border-green-200 bg-green-50"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{item.description}</span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {item.category}
                                </span>
                                {item.recurrence && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {item.recurrence}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {format(new Date(item.due_date), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <div className="text-xl font-bold text-green-600">
                              +${parseFloat(item.amount.toString()).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Edit item"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Expense Items */}
              {expenses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Expenses</h3>
                  <div className="space-y-3">
                    {expenses.map(item => {
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                            item.paid
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <button
                              onClick={() => togglePaid(item.id, item.paid)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                item.paid
                                  ? 'bg-green-500 text-white'
                                  : 'border-2 border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {item.paid && <Check className="w-4 h-4" />}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${item.paid ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {item.description}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {item.category}
                                </span>
                                {item.is_debt && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-semibold">
                                    DEBT
                                  </span>
                                )}
                                {item.recurrence && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    {item.recurrence}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                                {item.is_debt && item.outstanding_balance && (
                                  <>
                                    <span className="ml-2 text-red-600 font-semibold">
                                      • Balance: ${parseFloat(item.outstanding_balance.toString()).toFixed(2)}
                                    </span>
                                    {item.interest_rate && (
                                      <span className="ml-2 text-orange-600">
                                        • Interest: {item.interest_rate}%
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              {item.is_debt && (
                                <div className="mt-2">
                                  <label className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={item.include_in_snowball || false}
                                      onChange={async (e) => {
                                        const { error } = await supabase
                                          .from('budget_items')
                                          // @ts-expect-error - Supabase type inference issue
                                          .update({ include_in_snowball: e.target.checked })
                                          .eq('id', item.id)
                                        if (error) {
                                          console.error('Error updating snowball inclusion:', error)
                                          return
                                        }
                                        loadBudgetItems()
                                      }}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-gray-600">Include in Debt Snowball</span>
                                  </label>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`text-xl font-bold ${item.paid ? 'text-gray-500' : 'text-gray-800'}`}>
                                ${parseFloat(item.amount.toString()).toFixed(2)}
                              </div>
                              {item.is_debt && item.outstanding_balance && (
                                <div className="text-sm text-red-600 font-semibold">
                                  Owed: ${parseFloat(item.outstanding_balance.toString()).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Edit item"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Debt Snowball View */}
      {viewMode === 'debt' && (
        <DebtSnowballView budgetItems={budgetItems} />
      )}
    </div>
  )
}
