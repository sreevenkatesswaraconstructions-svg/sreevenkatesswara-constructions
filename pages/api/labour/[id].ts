import { prisma } from '../../../lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

const response = (success: boolean, data: any = null, message: string = '') => ({
  success,
  data,
  message,
})

const validRoles = [
  'Mason',
  'Helper',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Welder',
  'Tile Worker',
  'Supervisor',
  'Other',
]

const validStatuses = ['ACTIVE', 'INACTIVE']

function validateLabourPayload(body: any) {
  const errors: string[] = []

  if (body?.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    errors.push('Name is required')
  }

  if (body?.phone !== undefined && (typeof body.phone !== 'string' || body.phone.trim().length === 0)) {
    errors.push('Phone is required')
  }

  if (body?.role !== undefined && (typeof body.role !== 'string' || !validRoles.includes(body.role))) {
    errors.push('Role must be one of the allowed values')
  }

  if (body?.dailyWage !== undefined && (Number(body.dailyWage) <= 0)) {
    errors.push('Daily wage must be positive')
  }

  if (body?.status !== undefined && typeof body.status === 'string' && !validStatuses.includes(body.status.toUpperCase())) {
    errors.push('Status must be ACTIVE or INACTIVE')
  }

  if (body?.joiningDate !== undefined && body.joiningDate !== null && body.joiningDate !== '' && isNaN(Date.parse(body.joiningDate))) {
    errors.push('Joining date is invalid')
  }

  if (body?.projectId !== undefined && body.projectId !== null && body.projectId !== '' && typeof body.projectId !== 'string') {
    errors.push('Project reference is invalid')
  }

  return errors
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json(response(false, null, 'Invalid labour ID'))
  }

  if (req.method === 'GET') {
    return handleGet(id, req, res)
  }

  if (req.method === 'PUT') {
    return handlePut(id, req, res)
  }

  if (req.method === 'DELETE') {
    return handleDelete(id, req, res)
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json(response(false, null, 'Method not allowed'))
}

async function handleGet(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const labour = await prisma.labour.findUnique({ where: { id } })

    if (!labour) {
      return res.status(404).json(response(false, null, 'Labour not found'))
    }

    return res.status(200).json(response(true, labour, 'Labour fetched successfully'))
  } catch (error: any) {
    console.error('[LABOUR API] Error fetching labour:', error)
    return res.status(500).json(response(false, null, error.message || 'Failed to fetch labour'))
  }
}

async function handlePut(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const existing = await prisma.labour.findUnique({ where: { id } })

    if (!existing) {
      return res.status(404).json(response(false, null, 'Labour not found'))
    }

    const payload = req.body || {}
    const errors = validateLabourPayload(payload)

    if (errors.length > 0) {
      return res.status(400).json(response(false, null, errors.join(', ')))
    }

    const updateData: any = {}

    if (payload.name !== undefined) updateData.name = payload.name.trim()
    if (payload.phone !== undefined) updateData.phone = payload.phone.trim()
    if (payload.role !== undefined) updateData.role = payload.role
    if (payload.dailyWage !== undefined) updateData.dailyWage = Number(payload.dailyWage)
    if (payload.status !== undefined) updateData.status = String(payload.status).toUpperCase()
    if (payload.joiningDate !== undefined) updateData.joiningDate = payload.joiningDate ? new Date(payload.joiningDate) : null
    if (payload.notes !== undefined) updateData.notes = payload.notes?.trim() ? payload.notes.trim() : null
    if (payload.projectId !== undefined) updateData.projectId = payload.projectId?.trim() ? payload.projectId.trim() : null

    const labour = await prisma.labour.update({
      where: { id },
      data: updateData,
    })

    return res.status(200).json(response(true, labour, 'Labour updated successfully'))
  } catch (error: any) {
    console.error('[LABOUR API] Error updating labour:', error)
    return res.status(500).json(response(false, null, error.message || 'Failed to update labour'))
  }
}

async function handleDelete(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const existing = await prisma.labour.findUnique({ where: { id } })

    if (!existing) {
      return res.status(404).json(response(false, null, 'Labour not found'))
    }

    await prisma.labour.delete({ where: { id } })

    return res.status(200).json(response(true, null, 'Labour deleted successfully'))
  } catch (error: any) {
    console.error('[LABOUR API] Error deleting labour:', error)
    return res.status(500).json(response(false, null, error.message || 'Failed to delete labour'))
  }
}
