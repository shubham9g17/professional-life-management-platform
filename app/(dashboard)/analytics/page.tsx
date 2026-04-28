'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendCharts } from '@/components/analytics/trend-charts'
import { InsightPanel } from '@/components/analytics/insight-panel'
import { ReportGenerator } from '@/components/analytics/report-generator'
import { AchievementDisplay } from '@/components/analytics/achievement-display'
import { useToast } from '@/hooks/use-toast'

interface TrendPoint {
  date: string
  productivityScore: number
  wellnessScore: number
  growthScore: number
  overallScore: number
}

interface Insight {
  type: 'POSITIVE' | 'NEUTRAL' | 'IMPROVEMENT'
  category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'OVERALL'
  title: string
  description: string
  metric?: number
}

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [achievements, setAchievements] = useState<Array<{
    id: string
    type: string
    title: string
    description: string
    unlockedAt: Date
    category: 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'FINANCIAL'
  }>>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const reduce = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [trendsRes, insightsRes, achievementsRes] = await Promise.all([
          fetch('/api/analytics/trends?days=30'),
          fetch('/api/analytics/insights'),
          fetch('/api/achievements'),
        ])

        if (!cancelled && trendsRes.ok) {
          const json = await trendsRes.json()
          setTrends(json.trends ?? [])
        }
        if (!cancelled && insightsRes.ok) {
          const json = await insightsRes.json()
          setInsights(json.insights ?? [])
        }
        if (!cancelled && achievementsRes.ok) {
          const json = await achievementsRes.json()
          setAchievements(json.achievements ?? [])
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        if (!cancelled) {
          toast({
            title: 'Error',
            description: 'Failed to load analytics data',
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [toast])

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    const res = await fetch(`/api/analytics/reports?type=${type}`)
    if (!res.ok) throw new Error('Report generation failed')
    return res.json()
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Insights and trends across your productivity, wellness, and growth.
        </p>
      </div>

      <Tabs defaultValue="achievements" className="w-full">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-[var(--card-radius)]" />
              ))}
            </div>
          ) : (
            <AchievementDisplay achievements={achievements} />
          )}
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <TrendCharts data={trends} isLoading={loading} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <InsightPanel insights={insights} isLoading={loading} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportGenerator onGenerate={handleGenerateReport} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
