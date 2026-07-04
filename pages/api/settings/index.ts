import { prisma } from '../../../lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { createNotification } from '../../../lib/notifications'

const response = (success: boolean, data: any = null, message: string = '') => ({
  success,
  data,
  message
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method

  try {
    if (method === 'GET') {
      const settings = await prisma.settings.findMany({
        orderBy: { key: 'asc' }
      })

      const settingsMap: Record<string, string> = {}
      settings.forEach(setting => {
        settingsMap[setting.key] = setting.value
      })

      return res.status(200).json(response(true, settingsMap))
    }

    if (method === 'POST' || method === 'PUT') {
      const { settings } = req.body

      if (!settings || typeof settings !== 'object') {
        return res.status(400).json(
          response(false, null, 'Invalid settings data')
        )
      }

      const results: any[] = []

      for (const [key, value] of Object.entries(settings)) {
        if (!key || typeof key !== 'string') {
          continue
        }

        const result = await prisma.settings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })

        results.push(result)
      }

      // Create notification
      await createNotification({
        title: 'Website Settings Updated',
        message: 'Website settings have been updated',
        type: 'info',
        link: '/admin/settings'
      })

      return res.status(200).json(response(true, results, 'Settings saved successfully'))
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    return res.status(405).json(response(false, null, 'Method not allowed'))

  } catch (error: any) {
    console.error('[SETTINGS API] Error:', error)
    return res.status(500).json(
      response(false, null, error.message || 'Internal server error')
    )
  }
}
