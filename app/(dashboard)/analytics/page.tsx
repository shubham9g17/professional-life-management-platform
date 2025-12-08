'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendCharts } from '@/components/analytics/trend-charts'
import { InsightPanel } from '@/components/analytics/insight-panel'
import { ReportGenerator } from '@/components/analytics/report-generator'
import { AchievementDisplay } from '@/components/analytics/achievement-display'
import { useToast } from '@/hooks/use-toast'

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [analyticsRes, achievementsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/achievements'),
      ])

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalyticsData(data)
      }

      if (achievementsRes.ok) {
        const data = await achievementsRes.json()
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Insights and trends across all areas</p>
      </div>

      <Tabs defaultValue="achievements" className="w-full">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="mt-6">
          <AchievementDisplay achievements={achievements} />
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Trend Analysis</h2>
            <p className="text-gray-600">View trends across all your activities and metrics.</p>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <InsightPanel insights={[]} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-600">Generate custom reports for any time period.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
