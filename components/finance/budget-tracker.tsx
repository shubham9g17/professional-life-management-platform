'use client'

import { Button } from '@/components/ui/button'

interface Budget {
  id: string
  category: string
  monthlyLimit: number
  alertThreshold: number
  currentSpending: number
  percentageUsed: number
  isOverThreshold: boolean
  isOverBudget: boolean
}

interface BudgetTrackerProps {
  budgets: Budget[]
  onEdit?: (budget: Budget) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

export function BudgetTracker({ budgets, onEdit, onDelete, isLoading }: BudgetTrackerProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading budgets...
      </div>
    )
  }

  if (budgets.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500">No budgets set yet. Create your first budget to start tracking!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const remaining = budget.monthlyLimit - budget.currentSpending
        const progressColor = budget.isOverBudget
          ? 'bg-red-600'
          : budget.isOverThreshold
          ? 'bg-yellow-500'
          : 'bg-green-600'

        return (
          <div
            key={budget.id}
            className={`p-6 bg-white border rounded-lg ${
              budget.isOverBudget
                ? 'border-red-300 bg-red-50'
                : budget.isOverThreshold
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Monthly Limit: {formatCurrency(budget.monthlyLimit)}
                </p>
              </div>

              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(budget)}
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(budget.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">
                  Spent: {formatCurrency(budget.currentSpending)}
                </span>
                <span className={remaining >= 0 ? 'text-gray-700' : 'text-red-600 font-semibold'}>
                  {remaining >= 0 ? 'Remaining' : 'Over'}: {formatCurrency(Math.abs(remaining))}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${progressColor}`}
                  style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>0%</span>
                <span className="font-medium">{budget.percentageUsed.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Alert Messages */}
            {budget.isOverBudget && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                ⚠️ You've exceeded your budget for this category by {formatCurrency(Math.abs(remaining))}
              </div>
            )}
            {budget.isOverThreshold && !budget.isOverBudget && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                ⚠️ You've reached {budget.alertThreshold}% of your budget limit
              </div>
            )}
          </div>
        )
      })}

      {/* Summary */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(budgets.reduce((sum, b) => sum + b.monthlyLimit, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(budgets.reduce((sum, b) => sum + b.currentSpending, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Remaining</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(
                budgets.reduce((sum, b) => sum + (b.monthlyLimit - b.currentSpending), 0)
              )}
            </p>
          </div>
        </div>

        {/* Alerts Summary */}
        {budgets.some(b => b.isOverBudget || b.isOverThreshold) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Alerts:</p>
            <div className="space-y-1">
              {budgets.filter(b => b.isOverBudget).length > 0 && (
                <p className="text-sm text-red-600">
                  • {budgets.filter(b => b.isOverBudget).length} budget(s) exceeded
                </p>
              )}
              {budgets.filter(b => b.isOverThreshold && !b.isOverBudget).length > 0 && (
                <p className="text-sm text-yellow-600">
                  • {budgets.filter(b => b.isOverThreshold && !b.isOverBudget).length} budget(s) over threshold
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
