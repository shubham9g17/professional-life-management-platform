export const config = {
  app: {
    name: 'Professional Life Management Platform',
    description: 'Enterprise-grade productivity and wellness application',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  auth: {
    sessionMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    bcryptSaltRounds: 12,
    rateLimitAttempts: 5,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes in milliseconds
  },
  performance: {
    readTimeout: 100, // ms
    writeTimeout: 200, // ms
    cacheTimeout: 5 * 60 * 1000, // 5 minutes in milliseconds
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
} as const
