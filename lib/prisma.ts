import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}


export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test connection
prisma.$connect()
  .catch((error) => {
    console.error('[PRISMA] Database connection failed:', error)
    console.error('[PRISMA] Error details:', JSON.stringify(error, null, 2))
  })
