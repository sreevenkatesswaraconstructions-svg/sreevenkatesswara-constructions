import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

console.log('[PRISMA] Initializing Prisma client...')
console.log('[PRISMA] DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('[PRISMA] DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/[^@]+@/, '//***@') : 'NOT SET')

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test connection
prisma.$connect()
  .then(() => console.log('[PRISMA] Database connected successfully'))
  .catch((error) => {
    console.error('[PRISMA] Database connection failed:', error)
    console.error('[PRISMA] Error details:', JSON.stringify(error, null, 2))
  })
