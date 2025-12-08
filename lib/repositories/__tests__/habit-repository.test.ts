import { describe, it, expect } from 'vitest'
import { calculateStreak, calculateCompletionRate } from '../habit-repository'

describe('Habit Repository', () => {
  describe('calculateStreak', () => {
    it('should return 0 for empty completion array', () => {
      expect(calculateStreak([])).toBe(0)
    })

    it('should return 1 for single completion today', () => {
      const today = new Date()
      expect(calculateStreak([today])).toBe(1)
    })

    it('should return 1 for single completion yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(calculateStreak([yesterday])).toBe(1)
    })

    it('should return 0 if most recent completion is more than 1 day ago', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
      expect(calculateStreak([twoDaysAgo])).toBe(0)
    })

    it('should calculate consecutive days correctly', () => {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      expect(calculateStreak([today, yesterday, twoDaysAgo])).toBe(3)
    })

    it('should stop counting at first gap', () => {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const fourDaysAgo = new Date()
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)

      expect(calculateStreak([today, yesterday, fourDaysAgo])).toBe(2)
    })

    it('should handle unsorted dates', () => {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      // Pass in random order
      expect(calculateStreak([yesterday, twoDaysAgo, today])).toBe(3)
    })
  })

  describe('calculateCompletionRate', () => {
    it('should return 0 for no completions', () => {
      const createdAt = new Date()
      expect(calculateCompletionRate(createdAt, 0)).toBe(0)
    })

    it('should return 100 for completion every day', () => {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - 10)
      // 11 days (including today) = 11 completions
      expect(calculateCompletionRate(createdAt, 11)).toBe(100)
    })

    it('should calculate percentage correctly', () => {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - 9) // 10 days ago (actually 9 days difference)
      // The function uses Math.ceil which rounds up, so 9 days becomes 9 days
      // 5 completions out of 9 days = 55.56%
      expect(calculateCompletionRate(createdAt, 5)).toBe(55.56)
    })

    it('should cap at 100%', () => {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - 5)
      // More completions than days (shouldn't happen but handle it)
      expect(calculateCompletionRate(createdAt, 20)).toBe(100)
    })

    it('should handle habit created today', () => {
      const createdAt = new Date()
      // 1 completion on day 1 = 100%
      expect(calculateCompletionRate(createdAt, 1)).toBe(100)
    })
  })
})
