'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HabitBoard } from '@/components/habits/habit-board'
import { HabitCalendar } from '@/components/habits/habit-calendar'
import { HabitProgress } from '@/components/habits/habit-progress'
import { HabitForm } from '@/components/habits/habit-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Habit {
  id: string
  name: string
  description?: string
  frequency: string
  targetCount: number
  currentStreak: number
  longestStreak: number
  lastCompletedAt?: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

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

  const handleCreateHabit = async (data: any) => {
    setIsSubmitting(true)
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
        toast({
          title: 'Success',
          description: 'Habit created successfully',
        })
      } else {
        throw new Error('Failed to create habit')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create habit',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateHabit = async (data: any) => {
    if (!editingHabit) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setHabits(habits.map(h => h.id === editingHabit.id ? result.habit : h))
        setEditingHabit(null)
        toast({
          title: 'Success',
          description: 'Habit updated successfully',
        })
      } else {
        throw new Error('Failed to update habit')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update habit',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) return

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setHabits(habits.filter(h => h.id !== habitId))
        toast({
          title: 'Success',
          description: 'Habit deleted successfully',
        })
      } else {
        throw new Error('Failed to delete habit')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete habit',
        variant: 'destructive',
      })
    }
  }

  const handleCompleteHabit = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        setHabits(habits.map(h => h.id === habitId ? result.habit : h))
        toast({
          title: 'Success',
          description: 'Habit completed! 🎉',
        })
      } else {
        throw new Error('Failed to complete habit')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete habit',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading habits...</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="board" className="w-full">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Habits</h2>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + New Habit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {habits.map((habit: any) => (
                  <div key={habit.id} className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-lg mb-2">{habit.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{habit.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompleteHabit(habit.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Habit Calendar</h2>
              <p className="text-gray-600">Calendar view will appear here.</p>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Habit Progress</h2>
              <p className="text-gray-600">Progress tracking will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Habit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Habit</DialogTitle>
          </DialogHeader>
          <HabitForm
            onSubmit={handleCreateHabit}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Habit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          {editingHabit && (
            <HabitForm
              onSubmit={handleUpdateHabit}
              initialData={{
                name: editingHabit.name,
                frequency: editingHabit.frequency as any,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
