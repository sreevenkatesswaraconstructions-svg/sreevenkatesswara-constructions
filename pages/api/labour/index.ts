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

  if (typeof body?.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Name is required')
  }

  if (typeof body?.phone !== 'string' || body.phone.trim().length === 0) {
    errors.push('Phone is required')
  }

  if (typeof body?.role !== 'string' || !validRoles.includes(body.role)) {
    errors.push('Role must be one of the allowed values')
  }

  if (body?.dailyWage === undefined || body?.dailyWage === null || Number(body.dailyWage) <= 0) {
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
  if (req.method === 'GET') {
    return handleGet(req, res)
  }

  if (req.method === 'POST') {
    return handlePost(req, res)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json(response(false, null, 'Method not allowed'))
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, status, role, projectId } = req.query

    const where: any = {}

    if (status) {
      where.status = String(status).toUpperCase()
    }

    if (role) {
      where.role = String(role)
    }

    if (projectId) {
      where.projectId = String(projectId)
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        { notes: { contains: String(search), mode: 'insensitive' } },
      ]
    }

    const labours = await prisma.labour.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json(response(true, labours, 'Labour records fetched successfully'))
  } catch (error: any) {
    console.error('[LABOUR API] Error fetching labour:', error)
    return res.status(500).json(response(false, null, error.message || 'Failed to fetch labour'))
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = req.body || {}
    const errors = validateLabourPayload(payload)

    if (errors.length > 0) {
      return res.status(400).json(response(false, null, errors.join(', ')))
    }

    const labour = await prisma.labour.create({
      data: {
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        role: payload.role,
        dailyWage: Number(payload.dailyWage),
        status: (payload.status || 'ACTIVE').toUpperCase(),
        joiningDate: payload.joiningDate ? new Date(payload.joiningDate) : undefined,
        notes: payload.notes?.trim() ? payload.notes.trim() : null,
        projectId: payload.projectId?.trim() ? payload.projectId.trim() : null,
      },
    })

    return res.status(201).json(response(true, labour, 'Labour created successfully'))
  } catch (error: any) {
    console.error('[LABOUR API] Error creating labour:', error)
    return res.status(500).json(response(false, null, error.message || 'Failed to create labour'))
  }
}
