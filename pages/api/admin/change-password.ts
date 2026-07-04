import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma'
import { logActivity } from '../../../lib/activityLog'

const response = (success: boolean, data: any = null, message: string = '') => ({
  success,
  data,
  message,
})

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    return res.status(405).json(response(false, null, 'Method not allowed'))
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json(response(false, null, 'Unauthorized'))
  }

  const { currentPassword, newPassword, confirmPassword } = req.body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json(response(false, null, 'All fields are required'))
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json(response(false, null, 'New passwords do not match'))
  }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json(response(false, null, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'))
    }

    if (currentPassword === newPassword) {
      return res.status(400).json(response(false, null, 'New password cannot be the same as current password'))
    }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return res.status(404).json(response(false, null, 'User not found'))


    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return res.status(400).json(response(false, null, 'Current password is incorrect'))

    const hashed = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
    const browser = req.headers['user-agent'] || null

    await logActivity({
      adminName: user.name || 'Admin',
      action: 'Changed password',
      module: 'Authentication',
      ipAddress: ipAddress as string,
      browser: browser as string,
    })

    return res.status(200).json(response(true, null, 'Password updated successfully'))
  } catch (err: any) {
    console.error('Change password error:', err)
    return res.status(500).json(response(false, null, 'Failed to update password'))
  }
}
