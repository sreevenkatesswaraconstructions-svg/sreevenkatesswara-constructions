import NextAuth from 'next-auth'
import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { createNotification } from '../../../lib/notifications'
import { logActivity } from '../../../lib/activityLog'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      const req = { headers: {} } as any
      const ipAddress = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || null
      const browser = req?.headers?.['user-agent'] || null

      // Update lastLogin timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      })

      // Create notification for login
      await createNotification({
        title: 'Admin Login',
        message: `${user.name} has logged in`,
        type: 'info',
        link: '/admin/dashboard'
      })

      // Log activity
      await logActivity({
        adminName: user.name || user.email || 'Unknown admin',
        action: 'Logged in',
        module: 'Authentication',
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
        browser: typeof browser === 'string' ? browser : undefined
      })

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/svci-admin-secure-login',
  },
  session: {
    strategy: 'jwt' as const
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)
