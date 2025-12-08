'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialDashboard } from '@/components/finance/financial-dashboard'
import { TransactionList } from '@/components/finance/transaction-list'
import { BudgetTracker } from '@/components/finance/budget-tracker'
import { FinancialCharts } from '@/components/finance/financial-charts'
import { TransactionForm } from '@/components/finance/transaction-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [transactionsRes, budgetsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/budgets'),
      ])

      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      }

      if (budgetsRes.ok) {
        const data = await budgetsRes.json()
        setBudgets(data.budgets || [])
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (data: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setTransactions([result.transaction, ...transactions])
        setShowTransactionForm(false)
        toast({
          title: 'Success',
          description: 'Transaction added successfully',
        })
      } else {
        throw new Error('Failed to create transaction')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create transaction',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTransaction = async (data: any) => {
    if (!editingTransaction) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setTransactions(transactions.map(t => t.id === editingTransaction.id ? result.transaction : t))
        setEditingTransaction(null)
        toast({
          title: 'Success',
          description: 'Transaction updated successfully',
        })
      } else {
        throw new Error('Failed to update transaction')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== transactionId))
        toast({
          title: 'Success',
          description: 'Transaction deleted successfully',
        })
      } else {
        throw new Error('Failed to delete transaction')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading financial data...</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="charts">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-blue-600">{transactions.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Active Budgets</p>
                  <p className="text-3xl font-bold text-green-600">{budgets.length}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">This Month</p>
                  <p className="text-3xl font-bold text-purple-600">
                    ${transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Transactions</h2>
                <button
                  onClick={() => setShowTransactionForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + New Transaction
                </button>
              </div>
              <TransactionList
                transactions={transactions}
                onEdit={(transaction) => setEditingTransaction(transaction)}
                onDelete={handleDeleteTransaction}
              />
            </div>
          </TabsContent>

          <TabsContent value="budgets" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Budgets</h2>
              <p className="text-gray-600">Budget tracking will appear here.</p>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Financial Analytics</h2>
              <p className="text-gray-600">Charts and insights will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Transaction Dialog */}
      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleCreateTransaction}
            onCancel={() => setShowTransactionForm(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              onSubmit={handleUpdateTransaction}
              onCancel={() => setEditingTransaction(null)}
              initialData={editingTransaction}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
