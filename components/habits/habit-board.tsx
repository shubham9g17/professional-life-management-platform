'use client'

import { useState, useEffect } from 'react'
import { HabitCard } from './habit-card'
import { HabitForm, HabitFormData } from './habit-form'
import { Button } from '@/components/ui/button'

interface Habit {
  id: string
  name: string
  category: string
  frequency: string
  currentStreak: number
  longestStreak: number
  completionRate: number
  lastCompletedAt: Date | null
}

export function HabitBoard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    { value: null, label: 'All' },
    { value: 'PROFESSIONAL_DEVELOPMENT', label: 'Professional Development' },
    { value: 'HEALTH', label: 'Health' },
    { value: 'PRODUCTIVITY', label: 'Productivity' },
    { value: 'PERSONAL_GROWTH', label: 'Personal Growth' },
  ]

  useEffect(() => {
    fetchHabits()
  }, [selectedCategory])

  const fetchHabits = async () => {
    setIsLoading(true)
    try {
      const url = selectedCategory
        ? `/api/habits?category=${selectedCategory}`
        : '/api/habits'
      const response = await fetch(url)
      const data = await response.json()
      setHabits(data.habits || [])
    } catch (error) {
      console.error('Error fetching habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateHabit = async (data: HabitFormData) => {
    const response = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create habit')
    }

    setShowForm(false)
    fetchHabits()
  }

  const handleCompleteHabit = async (habitId: string) => {
    const response = await fetch(`/api/habits/${habitId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error('Failed to complete habit')
    }

    fetchHabits()
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit?')) {
      return
    }

    const response = await fetch(`/api/habits/${habitId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete habit')
    }

    fetchHabits()
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading habits...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Habit Tracker</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Habit'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Create New Habit</h3>
          <HabitForm onSubmit={handleCreateHabit} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.value || 'all'}
            onClick={() => setSelectedCategory(cat.value)}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No habits yet</p>
          <p className="text-sm">Create your first habit to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onComplete={handleCompleteHabit}
              onDelete={handleDeleteHabit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
