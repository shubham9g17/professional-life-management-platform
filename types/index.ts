// Core type definitions for the Professional Life Management Platform

export type Workspace = 'PROFESSIONAL' | 'PERSONAL' | 'LEARNING'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'
export type HabitCategory = 'PROFESSIONAL_DEVELOPMENT' | 'HEALTH' | 'PRODUCTIVITY' | 'PERSONAL_GROWTH'
export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'CUSTOM'
export type TransactionType = 'INCOME' | 'EXPENSE'
export type ExerciseIntensity = 'LOW' | 'MODERATE' | 'HIGH' | 'INTENSE'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type LearningResourceType = 'BOOK' | 'COURSE' | 'CERTIFICATION' | 'ARTICLE'
export type AchievementCategory = 'PRODUCTIVITY' | 'WELLNESS' | 'GROWTH' | 'FINANCIAL'
export type Theme = 'LIGHT' | 'DARK' | 'AUTO'
export type NotificationFrequency = 'REALTIME' | 'HOURLY' | 'DAILY'
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE'
export type ConflictStrategy = 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface FilterParams {
  startDate?: Date
  endDate?: Date
  status?: string
  category?: string
}
