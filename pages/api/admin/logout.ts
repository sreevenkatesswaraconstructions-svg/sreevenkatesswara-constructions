import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { logActivity } from '../../../lib/activityLog'

const response = (success: boolean, data: any = null, message: string = '') => ({
  success,
  data,
  message,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json(response(false, null, 'Method not allowed'))
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json(response(false, null, 'Unauthorized'))
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return res.status(404).json(response(false, null, 'User not found'))
  }

  const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
  const browser = req.headers['user-agent'] || null

  await logActivity({
    adminName: user.name || 'Admin',
    action: 'Logged out',
    module: 'Authentication',
    ipAddress: ipAddress as string,
    browser: browser as string,
  })

  return res.status(200).json(response(true, null, 'Logout recorded'))
}
