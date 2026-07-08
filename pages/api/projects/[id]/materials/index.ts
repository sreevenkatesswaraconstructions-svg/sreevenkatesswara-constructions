import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../lib/prisma'

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }

  return req.body ?? {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectId = getParam(req.query.id)

  if (!projectId) {
    return res.status(400).json({ error: 'Invalid project id' })
  }

  if (req.method === 'GET') {
    try {
      const project = await prisma.project.findUnique({ where: { id: projectId } })

      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }
      
      const materials = await prisma.material.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(materials)
    } catch (error) {
      console.error('[PROJECT MATERIALS API] Error fetching materials:', error)
      return res.status(500).json({ error: 'Failed to fetch project materials' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = parseBody(req)
      const materialName = typeof body.materialName === 'string' ? body.materialName.trim() : ''
      const category = typeof body.category === 'string' ? body.category.trim() : null
      const unit = typeof body.unit === 'string' ? body.unit.trim() : null
      const supplier = typeof body.supplier === 'string' ? body.supplier.trim() : null
      const notes = typeof body.notes === 'string' ? body.notes.trim() : null

      if (!materialName) {
        return res.status(400).json({ error: 'Material name is required' })
      }

      const quantity = Number(body.quantity)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than zero' })
      }

      const unitPrice = Number(body.unitPrice)
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ error: 'Unit price must be zero or greater' })
      }

      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const material = await prisma.material.create({
        data: {
          projectId,
          materialName,
          category: category || null,
          quantity,
          unit: unit || null,
          unitPrice,
          totalPrice: quantity * unitPrice,
          supplier: supplier || null,
          notes: notes || null,
        },
      })

      return res.status(201).json(material)
    } catch (error) {
      console.error('[PROJECT MATERIALS API] Error creating material:', error)
      return res.status(500).json({ error: 'Failed to create project material' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}
