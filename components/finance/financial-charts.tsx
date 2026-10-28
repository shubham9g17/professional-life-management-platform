'use client'

interface FinancialStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  byCategory: Record<string, number>
  byMonth: Array<{
    month: string
    income: number
    expenses: number
    balance: number
  }>
}

interface FinancialChartsProps {
  stats: FinancialStats
}

export function FinancialCharts({ stats }: FinancialChartsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format month
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
  }

  // Get spending by category data
  const categoryData = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const maxCategoryAmount = Math.max(...categoryData.map(([, amount]) => amount), 1)

  // Get monthly trend data (last 6 months)
  const monthlyData = stats.byMonth.slice(-6)
  const maxMonthlyAmount = Math.max(
    ...monthlyData.flatMap(m => [m.income, m.expenses]),
    1
  )

  return (
    <div className="space-y-6">
      {/* Spending by Category Chart */}
      <div className="bento-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Spending by Category</h3>
        {categoryData.length > 0 ? (
          <div className="space-y-4">
            {categoryData.map(([category, amount]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{category}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="relative w-full bg-muted rounded-full h-8">
                  <div
                    className="absolute top-0 left-0 h-8 bg-blue-600 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {((amount / stats.totalExpenses) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No spending data available</p>
        )}
      </div>

      {/* Monthly Income vs Expenses Chart */}
      <div className="bento-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Monthly Income vs Expenses</h3>
        {monthlyData.length > 0 ? (
          <div className="space-y-6">
            {/* Chart */}
            <div className="flex items-end justify-between gap-2 h-64 border-b border-l border-border pb-2 pl-2">
              {monthlyData.map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end justify-center h-full">
                    {/* Income Bar */}
                    <div
                      className="w-1/2 bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                      style={{
                        height: `${(month.income / maxMonthlyAmount) * 100}%`,
                        minHeight: month.income > 0 ? '4px' : '0',
                      }}
                      title={`Income: ${formatCurrency(month.income)}`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-1/2 bg-red-500 rounded-t hover:bg-red-600 transition-colors"
                      style={{
                        height: `${(month.expenses / maxMonthlyAmount) * 100}%`,
                        minHeight: month.expenses > 0 ? '4px' : '0',
                      }}
                      title={`Expenses: ${formatCurrency(month.expenses)}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatMonth(month.month)}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-sm text-foreground">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span className="text-sm text-foreground">Expenses</span>
              </div>
            </div>

            {/* Monthly Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              {monthlyData.slice(-3).map((month) => (
                <div key={month.month} className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">{formatMonth(month.month)}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Income: {formatCurrency(month.income)}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Expenses: {formatCurrency(month.expenses)}
                    </p>
                    <p className={`text-sm font-semibold ${month.balance >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'}`}>
                      Net: {formatCurrency(month.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No monthly data available</p>
        )}
      </div>
    </div>
  )
}
