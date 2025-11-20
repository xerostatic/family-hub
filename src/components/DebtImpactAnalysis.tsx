'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, TrendingDown, DollarSign, Calendar, ArrowRight, CheckCircle, Plus } from 'lucide-react'
import { BudgetItem } from '@/types'

export default function DebtImpactAnalysis({ budgetItems }: { budgetItems: BudgetItem[] }) {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [questionnaireStep, setQuestionnaireStep] = useState(1)
  const [questionnaireData, setQuestionnaireData] = useState({
    useBudgetDebts: false,
    selectedDebtIds: [] as string[],
    monthlyIncome: '',
    additionalDebts: [] as Array<{ description: string; balance: string; payment: string; interestRate: string }>
  })
  const debtItems = useMemo(() => {
    const expenses = budgetItems.filter(item => !item.is_income)
    const baseDebts = expenses.filter(item => item.is_debt && item.outstanding_balance && item.outstanding_balance > 0)
    
    // If questionnaire is complete and using budget debts, filter selected ones
    if (!showQuestionnaire && questionnaireData.useBudgetDebts && questionnaireData.selectedDebtIds.length > 0) {
      return baseDebts.filter(item => questionnaireData.selectedDebtIds.includes(item.id))
    }
    
    return baseDebts
  }, [budgetItems, showQuestionnaire, questionnaireData])

  const debtAnalysis = useMemo(() => {
    const expenses = budgetItems.filter(item => !item.is_income)
    const income = budgetItems.filter(item => item.is_income)
    
    let totalIncome = income.reduce((sum, item) => {
      const monthly = item.recurrence === 'monthly' ? parseFloat(item.amount.toString()) :
                     item.recurrence === 'biweekly' ? parseFloat(item.amount.toString()) * 2.17 :
                     item.recurrence === 'yearly' ? parseFloat(item.amount.toString()) / 12 :
                     parseFloat(item.amount.toString())
      return sum + monthly
    }, 0)
    
    // Add manual income from questionnaire if provided
    if (!showQuestionnaire && questionnaireData.monthlyIncome) {
      totalIncome += parseFloat(questionnaireData.monthlyIncome)
    }
    
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
    
    // Add additional debts from questionnaire
    let additionalDebtBalance = 0
    let additionalDebtPayments = 0
    let additionalMonthlyInterest = 0
    
    if (!showQuestionnaire && questionnaireData.additionalDebts.length > 0) {
      questionnaireData.additionalDebts.forEach(debt => {
        const balance = parseFloat(debt.balance) || 0
        const payment = parseFloat(debt.payment) || 0
        const interestRate = parseFloat(debt.interestRate) || 0
        
        additionalDebtBalance += balance
        additionalDebtPayments += payment
        additionalMonthlyInterest += balance * interestRate / 100 / 12
      })
    }
    
    const finalDebtBalance = totalDebtBalance + additionalDebtBalance
    const finalDebtPayments = totalDebtPayments + additionalDebtPayments
    const finalMonthlyInterest = monthlyInterest + additionalMonthlyInterest
    const finalDebtCostPerMonth = finalDebtPayments + finalMonthlyInterest
    const finalDebtToIncomeRatio = totalIncome > 0 ? (finalDebtPayments / totalIncome) * 100 : 0
    const finalAnnualInterest = finalMonthlyInterest * 12
    
    return {
      totalDebtBalance: finalDebtBalance,
      totalDebtPayments: finalDebtPayments,
      monthlyInterest: finalMonthlyInterest,
      annualInterest: finalAnnualInterest,
      debtCostPerMonth: finalDebtCostPerMonth,
      debtToIncomeRatio: finalDebtToIncomeRatio,
      interestPercentage: finalDebtBalance > 0 ? (finalMonthlyInterest / finalDebtBalance) * 100 : 0,
      debtCount: debtItems.length + questionnaireData.additionalDebts.length,
      totalIncome
    }
  }, [budgetItems, debtItems, showQuestionnaire, questionnaireData])

  const getSeverity = (ratio: number) => {
    if (ratio >= 40) return { level: 'Critical', color: 'red', bg: 'red-50', border: 'red-200' }
    if (ratio >= 30) return { level: 'High', color: 'orange', bg: 'orange-50', border: 'orange-200' }
    if (ratio >= 20) return { level: 'Moderate', color: 'yellow', bg: 'yellow-50', border: 'yellow-200' }
    return { level: 'Low', color: 'green', bg: 'green-50', border: 'green-200' }
  }

  const severity = getSeverity(debtAnalysis.debtToIncomeRatio)

  const budgetDebtItems = useMemo(() => {
    const expenses = budgetItems.filter(item => !item.is_income)
    return expenses.filter(item => item.is_debt && item.outstanding_balance && item.outstanding_balance > 0)
  }, [budgetItems])

  const handleNextStep = () => {
    if (questionnaireStep < 4) {
      setQuestionnaireStep(questionnaireStep + 1)
    } else {
      setShowQuestionnaire(false)
    }
  }

  const handleBackStep = () => {
    if (questionnaireStep > 1) {
      setQuestionnaireStep(questionnaireStep - 1)
    }
  }

  const toggleDebtSelection = (debtId: string) => {
    setQuestionnaireData(prev => ({
      ...prev,
      selectedDebtIds: prev.selectedDebtIds.includes(debtId)
        ? prev.selectedDebtIds.filter(id => id !== debtId)
        : [...prev.selectedDebtIds, debtId]
    }))
  }

  const addAdditionalDebt = () => {
    setQuestionnaireData(prev => ({
      ...prev,
      additionalDebts: [...prev.additionalDebts, { description: '', balance: '', payment: '', interestRate: '' }]
    }))
  }

  const updateAdditionalDebt = (index: number, field: string, value: string) => {
    setQuestionnaireData(prev => ({
      ...prev,
      additionalDebts: prev.additionalDebts.map((debt, i) => 
        i === index ? { ...debt, [field]: value } : debt
      )
    }))
  }

  const removeAdditionalDebt = (index: number) => {
    setQuestionnaireData(prev => ({
      ...prev,
      additionalDebts: prev.additionalDebts.filter((_, i) => i !== index)
    }))
  }

  // Show questionnaire if no debts found or user wants to configure
  if (showQuestionnaire || (debtAnalysis.debtCount === 0 && budgetDebtItems.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Debt Impact Analysis Setup
          </h2>
          <p className="text-orange-100">Answer a few questions to analyze your debt impact</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {questionnaireStep} of 4</span>
            <span className="text-sm text-gray-500">{Math.round((questionnaireStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionnaireStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Questionnaire Steps */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          {questionnaireStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Do you have debts in your budget section?</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setQuestionnaireData(prev => ({ ...prev, useBudgetDebts: true }))
                    if (budgetDebtItems.length > 0) {
                      setTimeout(() => setQuestionnaireStep(2), 300)
                    } else {
                      setTimeout(() => setQuestionnaireStep(3), 300)
                    }
                  }}
                  className="w-full p-4 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                >
                  <div className="font-semibold text-gray-800">Yes, use debts from budget section</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {budgetDebtItems.length > 0 
                      ? `${budgetDebtItems.length} debt(s) found`
                      : 'No debts found in budget section'}
                  </div>
                </button>
                <button
                  onClick={() => {
                    setQuestionnaireData(prev => ({ ...prev, useBudgetDebts: false }))
                    setTimeout(() => setQuestionnaireStep(3), 300)
                  }}
                  className="w-full p-4 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors text-left"
                >
                  <div className="font-semibold text-gray-800">No, I'll enter debts manually</div>
                </button>
              </div>
            </div>
          )}

          {questionnaireStep === 2 && budgetDebtItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Select which debts to include in analysis</h3>
              <div className="space-y-2">
                {budgetDebtItems.map(debt => (
                  <label
                    key={debt.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      questionnaireData.selectedDebtIds.includes(debt.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={questionnaireData.selectedDebtIds.includes(debt.id)}
                      onChange={() => toggleDebtSelection(debt.id)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{debt.description}</div>
                      <div className="text-sm text-gray-600">
                        Balance: ${debt.outstanding_balance?.toFixed(2)} | 
                        Payment: ${debt.amount.toFixed(2)}/mo
                        {debt.interest_rate && ` | Interest: ${debt.interest_rate}%`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={() => {
                  if (questionnaireData.selectedDebtIds.length === 0) {
                    setQuestionnaireData(prev => ({
                      ...prev,
                      selectedDebtIds: budgetDebtItems.map(d => d.id)
                    }))
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {questionnaireData.selectedDebtIds.length === 0 ? 'Select All' : 'Deselect All'}
              </button>
            </div>
          )}

          {questionnaireStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">What's your monthly income?</h3>
              <input
                type="number"
                step="0.01"
                value={questionnaireData.monthlyIncome}
                onChange={(e) => setQuestionnaireData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="5000.00"
              />
              <p className="text-sm text-gray-600">
                This will be added to any income from your budget section for the analysis.
              </p>
            </div>
          )}

          {questionnaireStep === 4 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Add any additional debts</h3>
                <button
                  onClick={addAdditionalDebt}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Debt
                </button>
              </div>
              {questionnaireData.additionalDebts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No additional debts added. Click "Add Debt" to include more.</p>
              ) : (
                <div className="space-y-4">
                  {questionnaireData.additionalDebts.map((debt, index) => (
                    <div key={index} className="p-4 border-2 border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800">Debt #{index + 1}</h4>
                        <button
                          onClick={() => removeAdditionalDebt(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={debt.description}
                            onChange={(e) => updateAdditionalDebt(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Credit Card, Loan, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={debt.balance}
                            onChange={(e) => updateAdditionalDebt(index, 'balance', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label>
                          <input
                            type="number"
                            step="0.01"
                            value={debt.payment}
                            onChange={(e) => updateAdditionalDebt(index, 'payment', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={debt.interestRate}
                            onChange={(e) => updateAdditionalDebt(index, 'interestRate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBackStep}
              disabled={questionnaireStep === 1}
              className={`px-6 py-2 rounded-lg transition-colors ${
                questionnaireStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              disabled={
                (questionnaireStep === 2 && questionnaireData.selectedDebtIds.length === 0 && questionnaireData.useBudgetDebts) ||
                (questionnaireStep === 3 && !questionnaireData.monthlyIncome)
              }
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {questionnaireStep === 4 ? 'Complete Analysis' : 'Next'}
              {questionnaireStep < 4 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (debtAnalysis.debtCount === 0 && !showQuestionnaire) {
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
      {/* Restart Questionnaire Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowQuestionnaire(true)
            setQuestionnaireStep(1)
          }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Reconfigure Analysis
        </button>
      </div>

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


