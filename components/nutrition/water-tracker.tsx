'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WaterIntake {
  id: string
  amount: number
  date: Date
}

interface WaterTrackerProps {
  dailyGoal?: number // ml
}

export function WaterTracker({ dailyGoal = 2000 }: WaterTrackerProps) {
  const [waterIntakes, setWaterIntakes] = useState<WaterIntake[]>([])
  const [amount, setAmount] = useState<number>(250)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTodayWaterIntake()
  }, [])

  const fetchTodayWaterIntake = async () => {
    try {
      setIsLoading(true)
      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0))
      const endOfDay = new Date(today.setHours(23, 59, 59, 999))

      const params = new URLSearchParams({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      })

      const response = await fetch(`/api/water?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch water intake')

      const data = await response.json()
      setWaterIntakes(
        data.waterIntakes.map((intake: any) => ({
          ...intake,
          date: new Date(intake.date),
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load water intake')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddWater = async () => {
    if (amount <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          date: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to log water intake')

      const data = await response.json()
      setWaterIntakes([
        ...waterIntakes,
        {
          ...data.waterIntake,
          date: new Date(data.waterIntake.date),
        },
      ])
      setAmount(250) // Reset to default
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log water intake')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteIntake = async (intakeId: string) => {
    try {
      const response = await fetch(`/api/water/${intakeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete water intake')

      setWaterIntakes(waterIntakes.filter((intake) => intake.id !== intakeId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete water intake')
    }
  }

  const totalIntake = waterIntakes.reduce((sum, intake) => sum + intake.amount, 0)
  const progressPercentage = Math.min((totalIntake / dailyGoal) * 100, 100)
  const remainingAmount = Math.max(dailyGoal - totalIntake, 0)

  const quickAmounts = [250, 500, 750, 1000]

  if (isLoading) {
    return <div className="text-center py-8">Loading water tracker...</div>
  }

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Water Intake</h3>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{totalIntake} ml</span>
            <span className="text-gray-600">{dailyGoal} ml goal</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {remainingAmount > 0 ? (
          <p className="text-sm text-gray-600">
            {remainingAmount} ml remaining to reach your daily goal
          </p>
        ) : (
          <p className="text-sm text-green-600 font-medium">
            🎉 Daily goal achieved!
          </p>
        )}
      </div>

      {/* Add Water Section */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Log Water Intake</h4>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ml)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount)}
              >
                {quickAmount} ml
              </Button>
            ))}
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <Button
            onClick={handleAddWater}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Adding...' : 'Add Water'}
          </Button>
        </div>
      </div>

      {/* History Section */}
      {waterIntakes.length > 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Today's Log</h4>
          <div className="space-y-2">
            {waterIntakes.map((intake) => (
              <div
                key={intake.id}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">💧</span>
                  <span className="font-medium">{intake.amount} ml</span>
                  <span className="text-sm text-gray-500">
                    {intake.date.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteIntake(intake.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
