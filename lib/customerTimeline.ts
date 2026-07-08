import { prisma } from './prisma'

export async function addCustomerTimelineEvent({
  customerId,
  eventType,
  title,
  description,
  source = 'SYSTEM',
  createdBy,
}: {
  customerId: string
  eventType: string
  title: string
  description?: string | null
  source?: string
  createdBy?: string | null
}) {
  if (!customerId?.trim() || !eventType?.trim() || !title?.trim()) {
    console.warn('Missing required fields for customer timeline event')
    return null
  }

  try {
    const safeSource = (source || 'SYSTEM').toString().trim() || 'SYSTEM'
    const safeDescription = description?.toString().trim() || null
    const safeCreatedBy = createdBy?.toString().trim() || null

    return await prisma.customerTimeline.create({
      data: {
        customerId: customerId.trim(),
        eventType: eventType.trim(),
        title: title.trim(),
        description: safeDescription,
        source: safeSource,
        createdBy: safeCreatedBy,
      },
    })
  } catch (error) {
    console.error('Failed to create customer timeline event:', error)
    return null
  }
}
