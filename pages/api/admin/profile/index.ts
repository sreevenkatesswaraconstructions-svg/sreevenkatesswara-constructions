import { prisma } from '../../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { logActivity } from '../../../../lib/activityLog'

const response = (success: boolean, data: any = null, message: string = '') => ({
  success,
  data,
  message
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json(response(false, null, 'Unauthorized'))
  }

  const method = req.method

  try {
    if (method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          profileImage: true,
          companyName: true,
          designation: true,
          lastLogin: true,
          accountStatus: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        return res.status(404).json(response(false, null, 'User not found'))
      }

      return res.status(200).json(response(true, user))
    }

    if (method === 'PUT') {
      const { name, email, phone, companyName, designation, profileImage } = req.body

      // Check if email is being changed and if it's already taken
      if (email && email !== session.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          return res.status(409).json(response(false, null, 'Email already in use'))
        }
      }

      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone || null
      if (companyName !== undefined) updateData.companyName = companyName || null
      if (designation !== undefined) updateData.designation = designation || null
      if (profileImage !== undefined) updateData.profileImage = profileImage || null

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          profileImage: true,
          companyName: true,
          designation: true,
          lastLogin: true,
          accountStatus: true,
          createdAt: true,
          updatedAt: true
        }
      })

      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
      const browser = req.headers['user-agent'] || null
      const action = profileImage !== undefined ? 'Updated Profile Photo' : 'Changed Settings'
      await logActivity({
        adminName: user.name,
        action,
        module: 'Settings',
        ipAddress: ipAddress as string,
        browser: browser as string
      })

      return res.status(200).json(response(true, user, 'Profile updated successfully'))
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json(response(false, null, 'Method not allowed'))

  } catch (error: any) {
    console.error('[PROFILE API] Error:', error)
    return res.status(500).json(
      response(false, null, error.message || 'Internal server error')
    )
  }
}
