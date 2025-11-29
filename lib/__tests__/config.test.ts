import { describe, it, expect } from 'vitest'
import { config } from '../config'

describe('Configuration', () => {
  it('should have app configuration', () => {
    expect(config.app).toBeDefined()
    expect(config.app.name).toBe('Professional Life Management Platform')
  })

  it('should have auth configuration', () => {
    expect(config.auth).toBeDefined()
    expect(config.auth.sessionMaxAge).toBe(7 * 24 * 60 * 60)
    expect(config.auth.bcryptSaltRounds).toBe(12)
  })

  it('should have performance configuration', () => {
    expect(config.performance).toBeDefined()
    expect(config.performance.readTimeout).toBe(100)
    expect(config.performance.writeTimeout).toBe(200)
  })
})
