'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FitnessDashboard } from '@/components/fitness/fitness-dashboard'
import { ExerciseLog } from '@/components/fitness/exercise-log'
import { FitnessGoals } from '@/components/fitness/fitness-goals'
import { HealthMetricsForm } from '@/components/fitness/health-metrics-form'
import { useToast } from '@/hooks/use-toast'

export default function FitnessPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [exercisesRes, goalsRes] = await Promise.all([
        fetch('/api/exercises'),
        fetch('/api/fitness-goals'),
      ])

      if (exercisesRes.ok) {
        const data = await exercisesRes.json()
        setExercises(data.exercises || [])
        
        // Calculate stats
        const totalMinutes = data.exercises?.reduce((sum: number, e: any) => sum + e.duration, 0) || 0
        const totalCalories = data.exercises?.reduce((sum: number, e: any) => sum + (e.caloriesBurned || 0), 0) || 0
        setStats({
          totalExercises: data.exercises?.length || 0,
          totalMinutes,
          totalCalories,
          averageIntensity: 'MODERATE',
          mostCommonActivity: 'Running',
          weeklyMinutes: totalMinutes,
          monthlyMinutes: totalMinutes,
        })
      }

      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Failed to fetch fitness data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load fitness data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExercises(exercises.filter(e => e.id !== exerciseId))
        toast({
          title: 'Success',
          description: 'Exercise deleted successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete exercise',
        variant: 'destructive',
      })
    }
  }

  const handleCreateGoal = async (data: any) => {
    try {
      const response = await fetch('/api/fitness-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setGoals([...goals, result.goal])
        toast({
          title: 'Success',
          description: 'Goal created successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const response = await fetch(`/api/fitness-goals/${goalId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setGoals(goals.filter(g => g.id !== goalId))
        toast({
          title: 'Success',
          description: 'Goal deleted successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive',
      })
    }
  }

  const handleMetricsSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/health-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Health metrics saved successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save health metrics',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading fitness data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {stats && <FitnessDashboard stats={stats} />}
        </TabsContent>

        <TabsContent value="exercises" className="mt-6">
          <ExerciseLog
            exercises={exercises}
            onDelete={handleDeleteExercise}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <FitnessGoals
            goals={goals}
            onCreateGoal={handleCreateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <HealthMetricsForm onSubmit={handleMetricsSubmit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
