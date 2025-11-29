'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Transaction {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  subcategory?: string
  description: string
  date: Date
  tags: string[]
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

export function TransactionList({ transactions, onEdit, onDelete, isLoading }: TransactionListProps) {
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: '',
  })

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (filters.type && transaction.type !== filters.type) return false
    if (filters.category && transaction.category !== filters.category) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.category.toLowerCase().includes(searchLower) ||
        (transaction.subcategory?.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  // Get unique categories
  const categories = Array.from(new Set(transactions.map(t => t.category))).sort()

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="type-filter">Type</Label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-filter">Category</Label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-filter">Search</Label>
          <Input
            id="search-filter"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search transactions..."
          />
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading transactions...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      transaction.type === 'INCOME'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {transaction.type}
                  </span>
                  <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-medium">{transaction.category}</span>
                  {transaction.subcategory && (
                    <span className="text-gray-500">• {transaction.subcategory}</span>
                  )}
                  <span className="text-gray-500">• {formatDate(transaction.date)}</span>
                </div>
                {transaction.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {transaction.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`text-xl font-bold ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>

                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(transaction)}
                    >
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(transaction.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Net</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + t.amount, 0) -
                  filteredTransactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
