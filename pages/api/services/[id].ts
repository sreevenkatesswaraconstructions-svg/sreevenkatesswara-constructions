import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

// Allowed service names
const ALLOWED_SERVICES = [
  'Construction',
  'Interiors',
  'Renovation',
  'Civil Works',
  'Plumbing',
  'Electrical',
  'Painting',
  'Carpentry'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  if (req.method === 'GET') {
    try {
      const service = await prisma.service.findUnique({
        where: { id }
      })

      if (!service) {
        return res.status(404).json({ error: 'Service not found' })
      }

      return res.status(200).json(service)
    } catch (error) {
      console.error('Error fetching service:', error)
      return res.status(500).json({ error: 'Failed to fetch service' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { serviceName, description, image } = req.body

      // Validate service name if provided
      if (serviceName && !ALLOWED_SERVICES.includes(serviceName)) {
        return res.status(400).json({ 
          error: 'Invalid service name. Allowed services: ' + ALLOWED_SERVICES.join(', ') 
        })
      }

      // Check if service exists
      const existingService = await prisma.service.findUnique({
        where: { id }
      })

      if (!existingService) {
        return res.status(404).json({ error: 'Service not found' })
      }

      // If serviceName is being updated, check for slug conflicts
      if (serviceName && serviceName !== existingService.serviceName) {
        const newSlug = serviceName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
        
        const slugConflict = await prisma.service.findFirst({
          where: {
            slug: newSlug,
            id: { not: id }
          }
        })

        if (slugConflict) {
          return res.status(409).json({ error: 'Service with this name already exists' })
        }

        // Update with new slug
        const service = await prisma.service.update({
          where: { id },
          data: {
            serviceName,
            description: description || existingService.description,
            slug: newSlug,
            ...(image !== undefined && { image })
          }
        })

        return res.status(200).json(service)
      }

      // Update without changing serviceName/slug
      const service = await prisma.service.update({
        where: { id },
        data: {
          ...(serviceName && { serviceName }),
          ...(description && { description }),
          ...(image !== undefined && { image })
        }
      })

      return res.status(200).json(service)
    } catch (error) {
      console.error('Error updating service:', error)
      
      // Handle Prisma-specific errors
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return res.status(404).json({ error: 'Service not found' })
      }

      return res.status(500).json({ error: 'Failed to update service' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if service exists
      const service = await prisma.service.findUnique({
        where: { id }
      })

      if (!service) {
        return res.status(404).json({ error: 'Service not found' })
      }

      // Delete service
      await prisma.service.delete({
        where: { id }
      })

      return res.status(200).json({ message: 'Service deleted successfully' })
    } catch (error) {
      console.error('Error deleting service:', error)
      
      // Handle Prisma-specific errors
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return res.status(404).json({ error: 'Service not found' })
      }

      return res.status(500).json({ error: 'Failed to delete service' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}
