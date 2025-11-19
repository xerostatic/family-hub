'use client'

import { useState, useMemo } from 'react'
import { TrendingDown, Calendar, DollarSign, Target, Zap } from 'lucide-react'
import { format, addMonths, differenceInMonths } from 'date-fns'
import { BudgetItem } from '@/types'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type DebtItem = {
  id: string
  name: string
  balance: number
  minPayment: number
  interestRate?: number
}

type PayoffScenario = {
  months: number
  totalPaid: number
  totalInterest: number
  payoffDate: Date
  timeline: Array<{
    month: number
    balance: number
    payment: number
  }>
}

export default function DebtSnowballView({ budgetItems }: { budgetItems: BudgetItem[] }) {
  const [extraPayment, setExtraPayment] = useState<string>('0')
  const [scenarioType, setScenarioType] = useState<'monthly' | 'yearly'>('monthly')

  // Extract debt items
  const debtItems: DebtItem[] = useMemo(() => {
    return budgetItems
      .filter(item => item.is_debt && item.outstanding_balance && item.outstanding_balance > 0)
      .map(item => ({
        id: item.id,
        name: item.description || item.category,
        balance: parseFloat(item.outstanding_balance!.toString()),
        minPayment: parseFloat(item.amount.toString()),
        interestRate: 0 // We don't track interest rate, but could add it later
      }))
      .sort((a, b) => a.balance - b.balance) // Snowball method: smallest first
  }, [budgetItems])

  const totalDebt = useMemo(() => 
    debtItems.reduce((sum, debt) => sum + debt.balance, 0),
    [debtItems]
  )

  const totalMinPayments = useMemo(() => 
    debtItems.reduce((sum, debt) => sum + debt.minPayment, 0),
    [debtItems]
  )

  // Calculate payoff scenario
  const payoffScenario: PayoffScenario | null = useMemo(() => {
    if (debtItems.length === 0) return null

    const extra = parseFloat(extraPayment) || 0
    const extraPerMonth = scenarioType === 'yearly' ? extra / 12 : extra
    
    const debts = debtItems.map(d => ({ ...d })) // Clone for calculation
    const timeline: Array<{ month: number; balance: number; payment: number }> = []
    let month = 0
    let totalPaid = 0
    let totalInterest = 0

    while (debts.some(d => d.balance > 0.01)) {
      month++
      let availablePayment = totalMinPayments + extraPerMonth
      let monthBalance = 0
      let monthPayment = 0

      // Pay off debts in order (snowball method)
      for (const debt of debts) {
        if (debt.balance <= 0) continue

        const payment = Math.min(availablePayment, debt.balance)
        debt.balance = Math.max(0, debt.balance - payment)
        availablePayment -= payment
        totalPaid += payment
        monthPayment += payment
        monthBalance += debt.balance

        if (debt.balance <= 0.01) {
          debt.balance = 0
        }
      }

      timeline.push({
        month,
        balance: monthBalance,
        payment: monthPayment
      })

      // Safety check to prevent infinite loops
      if (month > 600) break // 50 years max
    }

    return {
      months: month,
      totalPaid,
      totalInterest,
      payoffDate: addMonths(new Date(), month),
      timeline
    }
  }, [debtItems, extraPayment, scenarioType, totalMinPayments])

  // Calculate baseline (minimum payments only)
  const baselineScenario: PayoffScenario | null = useMemo(() => {
    if (debtItems.length === 0) return null

    const debts = debtItems.map(d => ({ ...d }))
    let month = 0
    let totalPaid = 0

    while (debts.some(d => d.balance > 0.01)) {
      month++
      let availablePayment = totalMinPayments

      for (const debt of debts) {
        if (debt.balance <= 0) continue

        const payment = Math.min(availablePayment, debt.balance)
        debt.balance = Math.max(0, debt.balance - payment)
        availablePayment -= payment
        totalPaid += payment

        if (debt.balance <= 0.01) {
          debt.balance = 0
        }
      }

      if (month > 600) break
    }

    return {
      months: month,
      totalPaid,
      totalInterest: 0,
      payoffDate: addMonths(new Date(), month),
      timeline: []
    }
  }, [debtItems, totalMinPayments])

  const monthsSaved = baselineScenario && payoffScenario 
    ? baselineScenario.months - payoffScenario.months 
    : 0

  const moneySaved = baselineScenario && payoffScenario
    ? baselineScenario.totalPaid - payoffScenario.totalPaid
    : 0

  if (debtItems.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 text-center border-2 border-green-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
            <Target className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">No Debt! 🎉</h3>
            <p className="text-green-700">You're debt-free! Keep up the great work!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" />
            <div>
              <div className="text-sm opacity-90">Total Debt</div>
              <div className="text-3xl font-bold">${totalDebt.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8" />
            <div>
              <div className="text-sm opacity-90">Min. Payments</div>
              <div className="text-3xl font-bold">${totalMinPayments.toFixed(2)}/mo</div>
            </div>
          </div>
        </div>
        {payoffScenario && (
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8" />
              <div>
                <div className="text-sm opacity-90">Payoff Time</div>
                <div className="text-3xl font-bold">
                  {payoffScenario.months} {payoffScenario.months === 1 ? 'month' : 'months'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Controls */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Payment Scenario Calculator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra Payment {scenarioType === 'yearly' ? 'Per Year' : 'Per Month'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="0.00"
              />
              <select
                value={scenarioType}
                onChange={(e) => setScenarioType(e.target.value as 'monthly' | 'yearly')}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          {payoffScenario && baselineScenario && (
            <div className="flex flex-col justify-center">
              <div className="text-sm text-gray-600 mb-1">Compared to minimum payments:</div>
              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-gray-500">Time Saved</div>
                  <div className="text-2xl font-bold text-green-600">
                    {monthsSaved} {monthsSaved === 1 ? 'month' : 'months'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Money Saved</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${Math.abs(moneySaved).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debt List with Progress */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Debt Breakdown (Snowball Method)</h3>
        <div className="space-y-4">
          {debtItems.map((debt, index) => {
            const percentage = (debt.balance / totalDebt) * 100
            return (
              <div key={debt.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{debt.name}</div>
                      <div className="text-sm text-gray-600">Min. Payment: ${debt.minPayment.toFixed(2)}/mo</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">${debt.balance.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payoff Timeline Chart */}
      {payoffScenario && payoffScenario.timeline.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-green-500" />
            Payoff Timeline
          </h3>
          <div className="mb-4 text-center">
            <div className="text-sm text-gray-600">Projected Payoff Date</div>
            <div className="text-2xl font-bold text-green-600">
              {format(payoffScenario.payoffDate, 'MMMM d, yyyy')}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={payoffScenario.timeline.slice(0, 60)}> {/* Show first 5 years */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#EF4444" 
                strokeWidth={3}
                name="Remaining Balance"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Payment Chart */}
      {payoffScenario && payoffScenario.timeline.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Payments Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payoffScenario.timeline.slice(0, 24)}> {/* Show first 2 years */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Payment ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="payment" 
                fill="#3B82F6" 
                name="Monthly Payment"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

