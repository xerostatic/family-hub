'use client'

import { useState, useMemo } from 'react'
import { Calculator, ArrowRight, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { BudgetItem } from '@/types'
import { addMonths, format } from 'date-fns'

type RefinancingScenario = {
  currentMonthlyPayment: number
  newMonthlyPayment: number
  currentTotalInterest: number
  newTotalInterest: number
  monthlySavings: number
  totalSavings: number
  payoffMonths: number
  currentPayoffMonths: number
  timeSaved: number
}

export default function RefinancingCalculator({ budgetItems }: { budgetItems: BudgetItem[] }) {
  const [step, setStep] = useState(1)
  const [interviewData, setInterviewData] = useState({
    currentInterestRate: '',
    newInterestRate: '',
    currentBalance: '',
    currentPayment: '',
    newTermMonths: '',
    creditScore: '',
    debtType: 'credit_card'
  })
  const [showResults, setShowResults] = useState(false)

  const debtItems = useMemo(() => 
    budgetItems.filter(item => item.is_debt && item.outstanding_balance && item.outstanding_balance > 0),
    [budgetItems]
  )

  const calculateScenario = (): RefinancingScenario | null => {
    if (!interviewData.currentBalance || !interviewData.currentPayment || !interviewData.newInterestRate) {
      return null
    }

    const balance = parseFloat(interviewData.currentBalance)
    const currentPayment = parseFloat(interviewData.currentPayment)
    const currentRate = parseFloat(interviewData.currentInterestRate) || 0
    const newRate = parseFloat(interviewData.newInterestRate)
    const newTerm = parseInt(interviewData.newTermMonths) || 60

    // Calculate current payoff
    let currentBalance = balance
    let currentMonths = 0
    let currentTotalInterest = 0
    
    while (currentBalance > 0.01 && currentMonths < 600) {
      currentMonths++
      const monthlyInterest = currentRate > 0 ? (currentBalance * currentRate / 100 / 12) : 0
      currentTotalInterest += monthlyInterest
      currentBalance += monthlyInterest
      const payment = Math.min(currentPayment, currentBalance)
      currentBalance -= payment
    }

    // Calculate new payment using amortization formula
    const monthlyRate = newRate / 100 / 12
    const newMonthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, newTerm)) / 
                              (Math.pow(1 + monthlyRate, newTerm) - 1)

    // Calculate new total interest
    const newTotalInterest = (newMonthlyPayment * newTerm) - balance

    const monthlySavings = currentPayment - newMonthlyPayment
    const totalSavings = (currentTotalInterest - newTotalInterest) + (currentPayment * currentMonths - newMonthlyPayment * newTerm)

    return {
      currentMonthlyPayment: currentPayment,
      newMonthlyPayment,
      currentTotalInterest,
      newTotalInterest,
      monthlySavings,
      totalSavings,
      payoffMonths: newTerm,
      currentPayoffMonths: currentMonths,
      timeSaved: currentMonths - newTerm
    }
  }

  const scenario = useMemo(() => calculateScenario(), [interviewData])

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
    } else {
      setShowResults(true)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const resetInterview = () => {
    setStep(1)
    setInterviewData({
      currentInterestRate: '',
      newInterestRate: '',
      currentBalance: '',
      currentPayment: '',
      newTermMonths: '',
      creditScore: '',
      debtType: 'credit_card'
    })
    setShowResults(false)
  }

  const getRecommendedRate = (creditScore: string, debtType: string) => {
    const score = parseInt(creditScore) || 0
    if (debtType === 'credit_card') {
      if (score >= 750) return '12-18%'
      if (score >= 700) return '18-24%'
      if (score >= 650) return '24-29%'
      return '29%+'
    } else {
      if (score >= 750) return '4-6%'
      if (score >= 700) return '6-8%'
      if (score >= 650) return '8-12%'
      return '12%+'
    }
  }

  if (showResults && scenario) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Refinancing Analysis Results</h2>
          <p className="text-blue-100">See how refinancing could impact your debt</p>
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <div className="text-sm text-green-600 mb-1">Monthly Savings</div>
            <div className="text-3xl font-bold text-green-700">
              ${scenario.monthlySavings.toFixed(2)}
            </div>
            <div className="text-xs text-green-600 mt-2">
              Per month
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="text-sm text-blue-600 mb-1">Total Savings</div>
            <div className="text-3xl font-bold text-blue-700">
              ${scenario.totalSavings.toFixed(2)}
            </div>
            <div className="text-xs text-blue-600 mt-2">
              Over loan lifetime
            </div>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <div className="text-sm text-purple-600 mb-1">Time Saved</div>
            <div className="text-3xl font-bold text-purple-700">
              {scenario.timeSaved > 0 ? `${scenario.timeSaved} months` : 'No change'}
            </div>
            <div className="text-xs text-purple-600 mt-2">
              Payoff timeline
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Current vs. Refinanced</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Metric</th>
                  <th className="text-right py-3 px-4 text-red-600">Current</th>
                  <th className="text-right py-3 px-4 text-green-600">Refinanced</th>
                  <th className="text-right py-3 px-4 text-blue-600">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Monthly Payment</td>
                  <td className="py-3 px-4 text-right">${scenario.currentMonthlyPayment.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">${scenario.newMonthlyPayment.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-bold">
                    -${scenario.monthlySavings.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Total Interest</td>
                  <td className="py-3 px-4 text-right">${scenario.currentTotalInterest.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">${scenario.newTotalInterest.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-bold">
                    -${(scenario.currentTotalInterest - scenario.newTotalInterest).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Payoff Time</td>
                  <td className="py-3 px-4 text-right">{scenario.currentPayoffMonths} months</td>
                  <td className="py-3 px-4 text-right">{scenario.payoffMonths} months</td>
                  <td className="py-3 px-4 text-right text-green-600 font-bold">
                    {scenario.timeSaved > 0 ? `-${scenario.timeSaved} months` : 'No change'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Recommendations
          </h3>
          <div className="space-y-3">
            {scenario.monthlySavings > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800">
                  <strong>✅ Good News:</strong> Refinancing would save you <strong>${scenario.monthlySavings.toFixed(2)}</strong> per month. 
                  Consider using these savings to pay down debt faster or build your emergency fund.
                </p>
              </div>
            )}
            {scenario.totalSavings > 1000 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800">
                  <strong>💰 Significant Savings:</strong> You could save over <strong>${scenario.totalSavings.toFixed(2)}</strong> in total interest. 
                  This refinancing option looks very beneficial.
                </p>
              </div>
            )}
            {scenario.timeSaved > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-purple-800">
                  <strong>⏰ Faster Payoff:</strong> You could pay off your debt <strong>{scenario.timeSaved} months</strong> faster with this refinancing option.
                </p>
              </div>
            )}
            {scenario.monthlySavings <= 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800">
                  <strong>⚠️ Consider Alternatives:</strong> This refinancing option may not provide monthly savings. 
                  Consider negotiating with current lenders or exploring debt consolidation options.
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={resetInterview}
          className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          Calculate Another Scenario
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Refinancing Calculator
        </h2>
        <p className="text-blue-100">Answer a few questions to see if refinancing could help</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {step} of 5</span>
          <span className="text-sm text-gray-500">{Math.round((step / 5) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Interview Steps */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">What type of debt are you considering refinancing?</h3>
            <div className="grid grid-cols-2 gap-4">
              {['credit_card', 'personal_loan', 'auto_loan', 'mortgage'].map(type => (
                <button
                  key={type}
                  onClick={() => setInterviewData({ ...interviewData, debtType: type })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    interviewData.debtType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-800 capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">What's your current debt balance?</h3>
            <input
              type="number"
              step="0.01"
              value={interviewData.currentBalance}
              onChange={(e) => setInterviewData({ ...interviewData, currentBalance: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="0.00"
            />
            {debtItems.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">Quick select from your debts:</p>
                <div className="space-y-2">
                  {debtItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setInterviewData({ 
                        ...interviewData, 
                        currentBalance: item.outstanding_balance?.toString() || '',
                        currentPayment: item.amount.toString(),
                        currentInterestRate: item.interest_rate?.toString() || ''
                      })}
                      className="w-full text-left p-2 bg-white rounded border border-blue-200 hover:bg-blue-100 text-sm"
                    >
                      {item.description}: ${item.outstanding_balance?.toFixed(2)} (${item.amount.toFixed(2)}/mo)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">What's your current monthly payment?</h3>
            <input
              type="number"
              step="0.01"
              value={interviewData.currentPayment}
              onChange={(e) => setInterviewData({ ...interviewData, currentPayment: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="0.00"
            />
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Current Interest Rate (%)</h4>
              <input
                type="number"
                step="0.01"
                value={interviewData.currentInterestRate}
                onChange={(e) => setInterviewData({ ...interviewData, currentInterestRate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">What's your credit score?</h3>
            <input
              type="number"
              value={interviewData.creditScore}
              onChange={(e) => setInterviewData({ ...interviewData, creditScore: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="300-850"
              min="300"
              max="850"
            />
            {interviewData.creditScore && parseInt(interviewData.creditScore) >= 300 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>💡 Estimated Rate Range:</strong> {getRecommendedRate(interviewData.creditScore, interviewData.debtType)}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Refinancing Terms</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={interviewData.newInterestRate}
                  onChange={(e) => setInterviewData({ ...interviewData, newInterestRate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Loan Term (Months)</label>
                <input
                  type="number"
                  value={interviewData.newTermMonths}
                  onChange={(e) => setInterviewData({ ...interviewData, newTermMonths: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="60"
                />
                <p className="text-xs text-gray-500 mt-1">Common terms: 36, 60, 72 months</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-6 py-2 rounded-lg transition-colors ${
              step === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && !interviewData.debtType) ||
              (step === 2 && !interviewData.currentBalance) ||
              (step === 3 && (!interviewData.currentPayment || !interviewData.currentInterestRate)) ||
              (step === 4 && !interviewData.creditScore) ||
              (step === 5 && (!interviewData.newInterestRate || !interviewData.newTermMonths))
            }
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {step === 5 ? 'Calculate' : 'Next'}
            {step < 5 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

