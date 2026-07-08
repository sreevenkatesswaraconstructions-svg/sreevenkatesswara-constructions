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
  const materialId = getParam(req.query.materialId)

  if (!projectId || !materialId) {
    return res.status(400).json({ error: 'Invalid project or material id' })
  }

  if (req.method === 'PUT') {
    try {
      const body = parseBody(req)
      const materialName = typeof body.materialName === 'string' ? body.materialName.trim() : undefined
      const category = typeof body.category === 'string' ? body.category.trim() : undefined
      const unit = typeof body.unit === 'string' ? body.unit.trim() : undefined
      const supplier = typeof body.supplier === 'string' ? body.supplier.trim() : undefined
      const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined

      if (materialName !== undefined && !materialName) {
        return res.status(400).json({ error: 'Material name is required' })
      }

      const quantity = body.quantity === undefined ? undefined : Number(body.quantity)
      if (quantity !== undefined && (!Number.isFinite(quantity) || quantity <= 0)) {
        return res.status(400).json({ error: 'Quantity must be greater than zero' })
      }

      const unitPrice = body.unitPrice === undefined ? undefined : Number(body.unitPrice)
      if (unitPrice !== undefined && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
        return res.status(400).json({ error: 'Unit price must be zero or greater' })
      }

      const existingMaterial = await prisma.material.findUnique({ where: { id: materialId } })
      if (!existingMaterial) {
        return res.status(404).json({ error: 'Material not found' })
      }

      const nextQuantity = quantity ?? existingMaterial.quantity
      const nextUnitPrice = unitPrice ?? existingMaterial.unitPrice
      const nextTotalPrice = nextQuantity * nextUnitPrice

      const material = await prisma.material.update({
        where: { id: materialId },
        data: {
          ...(materialName !== undefined && { materialName }),
          ...(category !== undefined && { category: category || null }),
          ...(quantity !== undefined && { quantity }),
          ...(unit !== undefined && { unit: unit || null }),
          ...(unitPrice !== undefined && { unitPrice }),
          totalPrice: nextTotalPrice,
          ...(supplier !== undefined && { supplier: supplier || null }),
          ...(notes !== undefined && { notes: notes || null }),
        },
      })

      return res.status(200).json(material)
    } catch (error) {
      console.error('[PROJECT MATERIALS API] Error updating material:', error)
      return res.status(500).json({ error: 'Failed to update project material' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.material.delete({ where: { id: materialId } })
      return res.status(204).end()
    } catch (error) {
      console.error('[PROJECT MATERIALS API] Error deleting material:', error)
      return res.status(500).json({ error: 'Failed to delete project material' })
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE'])
  return res.status(405).json({ error: 'Method not allowed' })
}
