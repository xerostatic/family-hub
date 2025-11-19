'use client'

import { useState, useEffect } from 'react'
import { supabase, Database } from '@/lib/supabase'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { FamilyMember, BudgetItem } from '@/types'

type BudgetItemInsert = Database['public']['Tables']['budget_items']['Insert']

export default function BudgetSection({ familyMembers }: { familyMembers: FamilyMember[] }) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category: 'Bills',
    description: '',
    amount: '',
    due_date: '',
    family_member_id: familyMembers[0]?.id || ''
  })

  useEffect(() => {
    loadBudgetItems()
  }, [])

  useEffect(() => {
    if (familyMembers.length > 0 && !formData.family_member_id) {
      setFormData(prev => ({ ...prev, family_member_id: familyMembers[0].id }))
    }
  }, [familyMembers])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const insertData: BudgetItemInsert = {
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      family_member_id: String(formData.family_member_id),
    }

    const { error } = await supabase
      .from('budget_items')
      // @ts-expect-error - Supabase type inference issue with Database generic
      .insert([insertData])
    
    if (error) {
      console.error('Error creating budget item:', error)
      alert('Failed to create budget item. Please try again.')
      return
    }
    
    setFormData({
      category: 'Bills',
      description: '',
      amount: '',
      due_date: '',
      family_member_id: familyMembers[0]?.id || ''
    })
    setShowForm(false)
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

  const totalAmount = budgetItems.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
  const paidAmount = budgetItems.filter(item => item.paid).reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
  const unpaidAmount = totalAmount - paidAmount

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Budget Tracker</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-blue-700">${totalAmount.toFixed(2)}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-700">${paidAmount.toFixed(2)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600 mb-1">Unpaid</div>
          <div className="text-2xl font-bold text-red-700">${unpaidAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Add Item Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Electric bill, groceries, etc."
                required
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.family_member_id}
                onChange={(e) => setFormData({ ...formData, family_member_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Item
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Budget Items List */}
      <div className="space-y-3">
        {budgetItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No budget items yet. Click "Add Item" to get started!
          </div>
        ) : (
          budgetItems.map(item => {
            const member = familyMembers.find(m => m.id === item.family_member_id)
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
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Due: {format(new Date(item.due_date), 'MMM d, yyyy')} • Assigned to: {member?.name}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${item.paid ? 'text-gray-500' : 'text-gray-800'}`}>
                    ${parseFloat(item.amount.toString()).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
