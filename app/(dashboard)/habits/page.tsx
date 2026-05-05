'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Pencil, Trash2, Check, Flame } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { HabitCalendar } from '@/components/habits/habit-calendar'
import { HabitProgress } from '@/components/habits/habit-progress'
import { HabitForm } from '@/components/habits/habit-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface HabitCompletion {
  id: string
  completedAt: Date | string
  notes: string | null
}

interface Habit {
  id: string
  name: string
  description?: string
  frequency: string
  targetCount: number
  currentStreak: number
  longestStreak: number
  completionRate: number
  lastCompletedAt?: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  completions: HabitCompletion[]
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const { toast } = useToast()
  const reduce = useReducedMotion()

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits')
      if (response.ok) {
        const data = await response.json()
        setHabits(data.habits || [])
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error)
      toast({
        title: 'Error',
        description: 'Failed to load habits',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHabit = async (data: Partial<Habit>) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const result = await response.json()
        setHabits([...habits, result.habit])
        setShowForm(false)
        toast({ title: 'Habit created' })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create habit', variant: 'destructive' })
    }
  }

  const handleUpdateHabit = async (data: Partial<Habit>) => {
    if (!editingHabit) return
    try {
      const response = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const result = await response.json()
        setHabits(habits.map((h) => (h.id === editingHabit.id ? result.habit : h)))
        setEditingHabit(null)
        toast({ title: 'Habit updated' })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update habit', variant: 'destructive' })
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Delete this habit? This cannot be undone.')) return
    try {
      const response = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      if (response.ok) {
        setHabits(habits.filter((h) => h.id !== habitId))
        toast({ title: 'Habit deleted' })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete habit', variant: 'destructive' })
    }
  }

  const handleCompleteHabit = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/complete`, { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        setHabits(habits.map((h) => (h.id === habitId ? result.habit : h)))
        toast({ title: 'Habit completed' })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to complete habit', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-[var(--card-radius)]" />
          ))}
        </div>
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Habits</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {habits.length} active {habits.length === 1 ? 'habit' : 'habits'}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            New habit
          </Button>
        </div>

        <Tabs defaultValue="board" className="w-full">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-6">
            {habits.length === 0 ? (
              <div className="bento-card flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-base text-muted-foreground">No habits yet — start your first one</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Create habit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {habits.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    index={index}
                    onComplete={() => handleCompleteHabit(habit.id)}
                    onEdit={() => setEditingHabit(habit)}
                    onDelete={() => handleDeleteHabit(habit.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <div className="bento-card p-5">
              <HabitCalendar
                habits={habits.map((h) => ({
                  id: h.id,
                  name: h.name,
                  completions: (h.completions ?? []).map((c) => ({
                    id: c.id,
                    completedAt: new Date(c.completedAt),
                    notes: c.notes,
                  })),
                }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            {habits.length === 0 ? (
              <div className="bento-card flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-base text-muted-foreground">
                  Track at least one habit to see progress.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {habits.map((habit) => (
                  <div key={habit.id} className="bento-card p-5">
                    <HabitProgress
                      habit={{
                        id: habit.id,
                        name: habit.name,
                        currentStreak: habit.currentStreak,
                        longestStreak: habit.longestStreak,
                        completionRate: habit.completionRate ?? 0,
                        completions: (habit.completions ?? []).map((c) => ({
                          id: c.id,
                          completedAt: new Date(c.completedAt),
                          notes: c.notes,
                        })),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create new habit</DialogTitle>
          </DialogHeader>
          <HabitForm onSubmit={handleCreateHabit} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
          </DialogHeader>
          {editingHabit && (
            <HabitForm
              onSubmit={handleUpdateHabit}
              initialData={{
                name: editingHabit.name,
                frequency: editingHabit.frequency as 'DAILY' | 'WEEKLY' | 'CUSTOM',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function HabitCard({
  habit,
  index,
  onComplete,
  onEdit,
  onDelete,
}: {
  habit: Habit
  index: number
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const reduce = useReducedMotion()
  const completedToday =
    habit.lastCompletedAt &&
    new Date(habit.lastCompletedAt).toDateString() === new Date().toDateString()

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: reduce ? 0 : Math.min(index, 8) * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="bento-card flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">{habit.name}</h3>
          {habit.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{habit.description}</p>
          )}
        </div>
        {habit.currentStreak > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
            title={`Current streak: ${habit.currentStreak}`}
          >
            <Flame className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            <span data-numeric>{habit.currentStreak}</span>
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-muted/40 p-2.5">
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Frequency</dt>
          <dd className="mt-0.5 font-medium text-foreground capitalize">
            {habit.frequency.toLowerCase()}
          </dd>
        </div>
        <div className="rounded-md bg-muted/40 p-2.5">
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Best streak</dt>
          <dd
            className="mt-0.5 font-mono text-base font-semibold tabular-nums text-foreground"
            data-numeric
          >
            {habit.longestStreak}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant={completedToday ? 'outline' : 'success'}
          size="sm"
          onClick={onComplete}
          className="flex-1"
          disabled={!!completedToday}
          aria-label={completedToday ? 'Already completed today' : `Mark ${habit.name} complete`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          {completedToday ? 'Done today' : 'Complete'}
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${habit.name}`}>
          <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label={`Delete ${habit.name}`}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Button>
      </div>
    </motion.article>
  )
}
