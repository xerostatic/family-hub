'use client'

import { useMemo } from 'react'
import { AlertTriangle, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { BudgetItem } from '@/types'

export default function DebtImpactAnalysis({ budgetItems }: { budgetItems: BudgetItem[] }) {
  const debtAnalysis = useMemo(() => {
    const expenses = budgetItems.filter(item => !item.is_income)
    const income = budgetItems.filter(item => item.is_income)
    const debtItems = expenses.filter(item => item.is_debt && item.outstanding_balance && item.outstanding_balance > 0)
    
    const totalIncome = income.reduce((sum, item) => {
      const monthly = item.recurrence === 'monthly' ? parseFloat(item.amount.toString()) :
                     item.recurrence === 'biweekly' ? parseFloat(item.amount.toString()) * 2.17 :
                     item.recurrence === 'yearly' ? parseFloat(item.amount.toString()) / 12 :
                     parseFloat(item.amount.toString())
      return sum + monthly
    }, 0)
    
    const totalDebtPayments = debtItems.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
    const totalDebtBalance = debtItems.reduce((sum, item) => sum + (item.outstanding_balance ? parseFloat(item.outstanding_balance.toString()) : 0), 0)
    
    const monthlyInterest = debtItems.reduce((sum, item) => {
      if (item.interest_rate && item.outstanding_balance) {
        return sum + (parseFloat(item.outstanding_balance.toString()) * parseFloat(item.interest_rate.toString()) / 100 / 12)
      }
      return sum
    }, 0)
    
    const debtToIncomeRatio = totalIncome > 0 ? (totalDebtPayments / totalIncome) * 100 : 0
    const interestPercentage = totalDebtBalance > 0 ? (monthlyInterest / totalDebtBalance) * 100 : 0
    
    // Calculate annual interest cost
    const annualInterest = monthlyInterest * 12
    
    // Calculate how much debt is costing per month
    const debtCostPerMonth = totalDebtPayments + monthlyInterest
    
    return {
      totalDebtBalance,
      totalDebtPayments,
      monthlyInterest,
      annualInterest,
      debtCostPerMonth,
      debtToIncomeRatio,
      interestPercentage,
      debtCount: debtItems.length,
      totalIncome
    }
  }, [budgetItems])

  const getSeverity = (ratio: number) => {
    if (ratio >= 40) return { level: 'Critical', color: 'red', bg: 'red-50', border: 'red-200' }
    if (ratio >= 30) return { level: 'High', color: 'orange', bg: 'orange-50', border: 'orange-200' }
    if (ratio >= 20) return { level: 'Moderate', color: 'yellow', bg: 'yellow-50', border: 'yellow-200' }
    return { level: 'Low', color: 'green', bg: 'green-50', border: 'green-200' }
  }

  const severity = getSeverity(debtAnalysis.debtToIncomeRatio)

  if (debtAnalysis.debtCount === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 text-center border-2 border-green-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">No Debt Impact! 🎉</h3>
            <p className="text-green-700">You have no debt items. Keep up the great financial health!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <div className={`bg-${severity.bg} border-2 border-${severity.border} rounded-xl p-6`}>
        <div className="flex items-start gap-4">
          <AlertTriangle className={`w-8 h-8 text-${severity.color}-600 flex-shrink-0`} />
          <div className="flex-1">
            <h3 className={`text-xl font-bold text-${severity.color}-800 mb-2`}>
              Debt Impact: {severity.level} Risk
            </h3>
            <p className={`text-${severity.color}-700`}>
              Your debt payments represent <strong>{debtAnalysis.debtToIncomeRatio.toFixed(1)}%</strong> of your monthly income.
              {debtAnalysis.debtToIncomeRatio >= 40 && ' This is considered a critical level and may impact your ability to save and invest.'}
              {debtAnalysis.debtToIncomeRatio >= 30 && debtAnalysis.debtToIncomeRatio < 40 && ' Consider strategies to reduce this ratio.'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-red-500" />
            <div>
              <div className="text-sm text-gray-600">Monthly Debt Cost</div>
              <div className="text-2xl font-bold text-red-600">
                ${debtAnalysis.debtCostPerMonth.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ${debtAnalysis.totalDebtPayments.toFixed(2)} payments + ${debtAnalysis.monthlyInterest.toFixed(2)} interest
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-sm text-gray-600">Annual Interest Cost</div>
              <div className="text-2xl font-bold text-orange-600">
                ${debtAnalysis.annualInterest.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Money lost to interest yearly
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm text-gray-600">Debt-to-Income Ratio</div>
              <div className="text-2xl font-bold text-blue-600">
                {debtAnalysis.debtToIncomeRatio.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {debtAnalysis.debtCount} debt account{debtAnalysis.debtCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm text-gray-600">Total Debt Balance</div>
              <div className="text-2xl font-bold text-purple-600">
                ${debtAnalysis.totalDebtBalance.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Outstanding principal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Breakdown */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Budget Impact</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Monthly Income</span>
              <span className="font-semibold text-green-600">${debtAnalysis.totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Debt Payments</span>
              <span className="font-semibold text-red-600">-${debtAnalysis.totalDebtPayments.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Interest Cost</span>
              <span className="font-semibold text-orange-600">-${debtAnalysis.monthlyInterest.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-300 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Available After Debt</span>
                <span className="font-bold text-lg text-blue-600">
                  ${(debtAnalysis.totalIncome - debtAnalysis.debtCostPerMonth).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Insight:</strong> You're paying <strong>${debtAnalysis.monthlyInterest.toFixed(2)}</strong> in interest each month. 
              That's <strong>${debtAnalysis.annualInterest.toFixed(2)}</strong> per year that could be going toward savings or investments instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

