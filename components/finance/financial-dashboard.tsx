'use client'

import { useEffect, useState } from 'react'

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

interface FinancialDashboardProps {
  stats: FinancialStats
  isLoading?: boolean
}

export function FinancialDashboard({ stats, isLoading }: FinancialDashboardProps) {
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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading financial data...
      </div>
    )
  }

  // Get top spending categories
  const topCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Calculate savings rate
  const savingsRate = stats.totalIncome > 0
    ? ((stats.balance / stats.totalIncome) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalIncome)}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalExpenses)}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Balance</p>
          <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.balance)}
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Savings Rate</p>
          <p className="text-2xl font-bold text-blue-600">
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Monthly Trends */}
      {stats.byMonth.length > 0 && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <div className="space-y-3">
            {stats.byMonth.slice(-6).map((month) => (
              <div key={month.month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {formatMonth(month.month)}
                  </span>
                  <span className={`text-sm font-semibold ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.balance)}
                  </span>
                </div>
                <div className="flex gap-2 h-6">
                  <div
                    className="bg-green-500 rounded"
                    style={{
                      width: `${(month.income / Math.max(month.income, month.expenses)) * 100}%`,
                    }}
                    title={`Income: ${formatCurrency(month.income)}`}
                  />
                  <div
                    className="bg-red-500 rounded"
                    style={{
                      width: `${(month.expenses / Math.max(month.income, month.expenses)) * 100}%`,
                    }}
                    title={`Expenses: ${formatCurrency(month.expenses)}`}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Income: {formatCurrency(month.income)}</span>
                  <span>Expenses: {formatCurrency(month.expenses)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Spending Categories */}
      {topCategories.length > 0 && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {topCategories.map(([category, amount]) => {
              const percentage = stats.totalExpenses > 0
                ? ((amount / stats.totalExpenses) * 100).toFixed(1)
                : '0.0'
              
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(amount)} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalIncome === 0 && stats.totalExpenses === 0 && (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">No financial data yet. Start by adding your first transaction!</p>
        </div>
      )}
    </div>
  )
}
