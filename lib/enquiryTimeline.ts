import { prisma } from './prisma'

export async function addEnquiryActivity({
  enquiryId,
  activity,
  performedBy = 'System'
}: {
  enquiryId: string
  activity: string
  performedBy?: string | null
}) {
  const safePerformedBy = (performedBy || 'System').toString().trim() || 'System'

  return prisma.enquiryActivity.create({
    data: {
      enquiryId,
      activity,
      performedBy: safePerformedBy
    }
  })
}

export async function getEnquiryActivities(enquiryId: string) {
  return prisma.enquiryActivity.findMany({
    where: { enquiryId },
    orderBy: { createdAt: 'desc' }
  })
}
