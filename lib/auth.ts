import { getServerSession } from 'next-auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '../pages/api/auth/[...nextauth]'

// Helper function to check if user is authenticated in API routes
export async function isAuthenticated(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || !session.user) {
    return false
  }
  
  return true
}

// Helper function to check if user has admin role
export async function isAdmin(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || !session.user) {
    return false
  }
  
  const userRole = session.user.role as string
  return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
}

// Helper function to check if user is super admin
export async function isSuperAdmin(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || !session.user) {
    return false
  }
  
  return session.user.role === 'SUPER_ADMIN'
}

// Helper function to get current user
export async function getCurrentUser(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session || !session.user) {
    return null
  }
  
  return session.user
}

// Middleware function to protect API routes
export function withAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authenticated = await isAuthenticated(req, res)
    
    if (!authenticated) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    return handler(req, res)
  }
}

// Middleware function to protect admin API routes
export function withAdminAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const admin = await isAdmin(req, res)
    
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' })
    }
    
    return handler(req, res)
  }
}

// Middleware function to protect super admin API routes
export function withSuperAdminAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const superAdmin = await isSuperAdmin(req, res)
    
    if (!superAdmin) {
      return res.status(403).json({ error: 'Forbidden - Super Admin access required' })
    }
    
    return handler(req, res)
  }
}
