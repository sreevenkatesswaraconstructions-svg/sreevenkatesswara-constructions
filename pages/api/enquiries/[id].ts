import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  if (req.method === 'GET') {
    try {
      const enquiry = await prisma.enquiry.findUnique({
        where: { id }
      })

      if (!enquiry) {
        return res.status(404).json({ error: 'Enquiry not found' })
      }

      return res.status(200).json(enquiry)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch enquiry' })
    }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const { status, isContacted } = req.body

      const enquiry = await prisma.enquiry.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(isContacted !== undefined && { isContacted })
        }
      })

      return res.status(200).json(enquiry)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update enquiry' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.enquiry.delete({
        where: { id }
      })

      return res.status(204).end()
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete enquiry' })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}
