'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TransactionList } from '@/components/finance/transaction-list'
import { BudgetTracker } from '@/components/finance/budget-tracker'
import { TransactionForm, TransactionFormData } from '@/components/finance/transaction-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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

const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const reduce = useReducedMotion()

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

  const handleCreateTransaction = async (data: TransactionFormData) => {
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
        toast({ title: 'Transaction added' })
      } else throw new Error('Failed')
    } catch {
      toast({ title: 'Error', description: 'Failed to create transaction', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTransaction = async (data: TransactionFormData) => {
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
        setTransactions(
          transactions.map((t) => (t.id === editingTransaction.id ? result.transaction : t))
        )
        setEditingTransaction(null)
        toast({ title: 'Transaction updated' })
      } else throw new Error('Failed')
    } catch {
      toast({ title: 'Error', description: 'Failed to update transaction', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Delete this transaction?')) return
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' })
      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== transactionId))
        toast({ title: 'Transaction deleted' })
      } else throw new Error('Failed')
    } catch {
      toast({ title: 'Error', description: 'Failed to delete transaction', variant: 'destructive' })
    }
  }

  const summary = computeSummary(transactions)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[var(--card-radius)]" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-[var(--card-radius)]" />
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Finance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {transactions.length} transactions · {budgets.length} budgets
            </p>
          </div>
          <Button onClick={() => setShowTransactionForm(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            New transaction
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiTile
                icon={Receipt}
                label="Transactions"
                value={String(transactions.length)}
                tone="default"
              />
              <KpiTile
                icon={TrendingUp}
                label="Income"
                value={formatCurrency(summary.income)}
                tone="success"
              />
              <KpiTile
                icon={TrendingDown}
                label="Expenses"
                value={formatCurrency(summary.expenses)}
                tone="destructive"
              />
              <KpiTile
                icon={Wallet}
                label="Net"
                value={formatCurrency(summary.net)}
                tone={summary.net >= 0 ? 'success' : 'destructive'}
              />
            </div>

            <div className="bento-card p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Recent activity</h2>
              {transactions.slice(0, 5).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No transactions yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {transactions.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {t.description || t.category || 'Transaction'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'font-mono text-sm font-medium tabular-nums',
                          t.type === 'INCOME' ? 'text-success' : 'text-foreground'
                        )}
                        data-numeric
                      >
                        {t.type === 'INCOME' ? '+' : '−'}
                        {formatCurrency(Math.abs(t.amount || 0))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <TransactionList
              transactions={transactions}
              onEdit={(transaction) => setEditingTransaction(transaction)}
              onDelete={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="budgets" className="mt-6">
            <BudgetTracker budgets={budgets} />
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleCreateTransaction}
            onCancel={() => setShowTransactionForm(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              onSubmit={handleUpdateTransaction}
              onCancel={() => setEditingTransaction(null)}
              initialData={{
                amount: editingTransaction.amount,
                type: editingTransaction.type,
                category: editingTransaction.category,
                subcategory: editingTransaction.subcategory,
                description: editingTransaction.description,
                date: new Date(editingTransaction.date).toISOString().slice(0, 16),
                tags: editingTransaction.tags,
              }}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function computeSummary(transactions: Transaction[]) {
  let income = 0
  let expenses = 0
  for (const t of transactions) {
    const a = t.amount || 0
    if (t.type === 'INCOME') income += a
    else expenses += Math.abs(a)
  }
  return { income, expenses, net: income - expenses }
}

function KpiTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value: string
  tone: 'default' | 'success' | 'destructive'
}) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-success',
    destructive: 'text-destructive',
  }[tone]
  return (
    <div className="bento-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p
        className={cn(
          'mt-2 font-mono text-2xl font-semibold tabular-nums sm:text-3xl',
          toneClass
        )}
        data-numeric
      >
        {value}
      </p>
    </div>
  )
}
