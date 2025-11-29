import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default query options with stale-while-revalidate pattern
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale-while-revalidate configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection time (formerly cacheTime)
    
    // Retry configuration
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch configuration
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    
    // Network mode
    networkMode: 'online',
  },
  mutations: {
    // Retry failed mutations
    retry: 1,
    retryDelay: 1000,
    
    // Network mode
    networkMode: 'online',
  },
}

/**
 * Create a new QueryClient instance with optimized defaults
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions,
  })
}

/**
 * Singleton QueryClient for client-side
 */
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient()
  } else {
    // Browser: reuse the same query client
    if (!browserQueryClient) {
      browserQueryClient = createQueryClient()
    }
    return browserQueryClient
  }
}

/**
 * Query key factories for consistent cache keys
 */
export const queryKeys = {
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    stats: (userId: string) => [...queryKeys.tasks.all, 'stats', userId] as const,
  },
  
  // Habits
  habits: {
    all: ['habits'] as const,
    lists: () => [...queryKeys.habits.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.habits.lists(), filters] as const,
    details: () => [...queryKeys.habits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.habits.details(), id] as const,
    stats: (userId: string) => [...queryKeys.habits.all, 'stats', userId] as const,
  },
  
  // Transactions
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    stats: (userId: string) =>
      [...queryKeys.transactions.all, 'stats', userId] as const,
  },
  
  // Exercises
  exercises: {
    all: ['exercises'] as const,
    lists: () => [...queryKeys.exercises.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.exercises.lists(), filters] as const,
    details: () => [...queryKeys.exercises.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exercises.details(), id] as const,
    stats: (userId: string) =>
      [...queryKeys.exercises.all, 'stats', userId] as const,
  },
  
  // Meals
  meals: {
    all: ['meals'] as const,
    lists: () => [...queryKeys.meals.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.meals.lists(), filters] as const,
    details: () => [...queryKeys.meals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.meals.details(), id] as const,
    stats: (userId: string) => [...queryKeys.meals.all, 'stats', userId] as const,
  },
  
  // Learning Resources
  learning: {
    all: ['learning'] as const,
    lists: () => [...queryKeys.learning.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.learning.lists(), filters] as const,
    details: () => [...queryKeys.learning.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.learning.details(), id] as const,
    stats: (userId: string) =>
      [...queryKeys.learning.all, 'stats', userId] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    overview: (userId: string) =>
      [...queryKeys.analytics.all, 'overview', userId] as const,
    trends: (userId: string, period: string) =>
      [...queryKeys.analytics.all, 'trends', userId, period] as const,
    insights: (userId: string) =>
      [...queryKeys.analytics.all, 'insights', userId] as const,
    reports: (userId: string, type: string) =>
      [...queryKeys.analytics.all, 'reports', userId, type] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unread: (userId: string) =>
      [...queryKeys.notifications.all, 'unread', userId] as const,
  },
  
  // Budgets
  budgets: {
    all: ['budgets'] as const,
    lists: () => [...queryKeys.budgets.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.budgets.lists(), userId] as const,
  },
  
  // Fitness Goals
  fitnessGoals: {
    all: ['fitnessGoals'] as const,
    lists: () => [...queryKeys.fitnessGoals.all, 'list'] as const,
    list: (userId: string) =>
      [...queryKeys.fitnessGoals.lists(), userId] as const,
  },
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  invalidateTasks: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  },
  
  invalidateHabits: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.habits.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  },
  
  invalidateTransactions: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  },
  
  invalidateExercises: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  },
  
  invalidateMeals: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meals.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  },
  
  invalidateLearning: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.learning.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  },
  
  invalidateAnalytics: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
  },
  
  invalidateNotifications: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  },
}
