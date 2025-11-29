'use client'

import { Card } from '@/components/ui/card'

interface FinancialWidgetProps {
  currentBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
}

export function FinancialWidget({
  currentBalance,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
}: FinancialWidgetProps) {
  const netIncome = monthlyIncome - monthlyExpenses
  const isPositive = netIncome >= 0

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Financial Snapshot</h3>
          <p className="text-sm text-muted-foreground">Current month overview</p>
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        {/* Balance */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
          <p className="text-3xl font-bold text-foreground">
            ${currentBalance.toLocaleString()}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              +${monthlyIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              -${monthlyExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Net and Savings */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Net Income</span>
            <span className={`text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}${netIncome.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Savings Rate</span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {savingsRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
