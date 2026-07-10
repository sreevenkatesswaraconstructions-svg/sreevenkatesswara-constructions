import AdminLayout from '../../components/admin/AdminLayout';
import DashboardOverview from '../../components/admin/DashboardOverview';
import { prisma } from '../../lib/prisma';

export default function AdminDashboard({ stats, activities }) {
  return (
    <AdminLayout>
      <DashboardOverview stats={stats} activities={activities} />
    </AdminLayout>
  );
}

export async function getServerSideProps() {
  try {
    console.log('[DASHBOARD] Fetching real-time database counts...');
    console.log('[DASHBOARD] Fetching recent activities...');

    const completedStatus = 'Completed';

    // Fetch live counts from database and keep the dashboard resilient if any query fails.
    const [
      enquiryCountResult,
      projectCountResult,
      activeProjectCountResult,
      completedProjectCountResult,
      blogCountResult,
      serviceCountResult,
    ] = await Promise.allSettled([
      prisma.enquiry.count(),
      prisma.project.count(),
      prisma.project.count({
        where: {
          status: {
            not: {
              equals: completedStatus,
            },
          },
        },
      }),
      prisma.project.count({
        where: {
          status: {
            equals: completedStatus,
          },
        },
      }),
      prisma.blog.count(),
      prisma.service.count(),
    ]);

    const enquiryCount = enquiryCountResult.status === 'fulfilled' ? enquiryCountResult.value : 0;
    const projectCount = projectCountResult.status === 'fulfilled' ? projectCountResult.value : 0;
    const activeProjectCount = activeProjectCountResult.status === 'fulfilled' ? activeProjectCountResult.value : 0;
    const completedProjectCount = completedProjectCountResult.status === 'fulfilled' ? completedProjectCountResult.value : 0;
    const blogCount = blogCountResult.status === 'fulfilled' ? blogCountResult.value : 0;
    const serviceCount = serviceCountResult.status === 'fulfilled' ? serviceCountResult.value : 0;

    // Log the counts
    console.log('[DASHBOARD] Enquiries:', enquiryCount);
    console.log('[DASHBOARD] Projects:', projectCount);
    console.log('[DASHBOARD] Active Projects:', activeProjectCount);
    console.log('[DASHBOARD] Completed Projects:', completedProjectCount);
    console.log('[DASHBOARD] Blogs:', blogCount);
    console.log('[DASHBOARD] Services:', serviceCount);

    // Fetch recent activities from database
    const [enquiries, projects, blogs, services] = await Promise.all([
      prisma.enquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          customerName: true,
          service: true,
          createdAt: true,
        },
      }),
      prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.blog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          published: true,
          createdAt: true,
        },
      }),
      prisma.service.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          serviceName: true,
          shortDescription: true,
          createdAt: true,
        },
      }),
    ]);

    // Transform database records into activity objects
    const activities = [
      ...enquiries.map(e => ({
        id: `enquiry-${e.id}`,
        type: 'enquiry',
        title: `New enquiry from ${e.customerName}`,
        description: `${e.service} enquiry`,
        createdAt: e.createdAt.toISOString(),
      })),
      ...projects.map(p => ({
        id: `project-${p.id}`,
        type: 'project',
        title: `Project added: ${p.title}`,
        description: `${p.category} - ${p.status}`,
        createdAt: p.createdAt.toISOString(),
      })),
      ...blogs.map(b => ({
        id: `blog-${b.id}`,
        type: 'blog',
        title: b.published ? `Blog published: ${b.title}` : `Blog draft: ${b.title}`,
        description: `${b.category}`,
        createdAt: b.createdAt.toISOString(),
      })),
      ...services.map(s => ({
        id: `service-${s.id}`,
        type: 'service',
        title: `Service added: ${s.serviceName}`,
        description: s.shortDescription?.substring(0, 50) + (s.shortDescription?.length > 50 ? '...' : '') || 'New service',
        createdAt: s.createdAt.toISOString(),
      })),
    ];

    // Sort all activities by createdAt DESC and take latest 10
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestActivities = activities.slice(0, 10);

    console.log('[DASHBOARD] Activities count:', latestActivities.length);

    const stats = [
      {
        title: 'Total Enquiries',
        value: enquiryCount.toString(),
        change: '+0%',
        trend: 'up',
        icon: 'MessageSquare',
        color: 'emerald'
      },
      {
        title: 'Active Projects',
        value: activeProjectCount.toString(),
        change: '+0',
        trend: 'up',
        icon: 'FolderKanban',
        color: 'blue'
      },
      {
        title: 'Completed Projects',
        value: completedProjectCount.toString(),
        change: '+0',
        trend: 'up',
        icon: 'CheckCircle',
        color: 'green'
      },
      {
        title: 'Blog Posts',
        value: blogCount.toString(),
        change: '+0',
        trend: 'up',
        icon: 'FileText',
        color: 'purple'
      },
      {
        title: 'Services',
        value: serviceCount.toString(),
        change: '+0',
        trend: 'up',
        icon: 'Settings',
        color: 'orange'
      },
    ];

    return {
      props: {
        stats,
        activities: latestActivities,
      },
    };
  } catch (error) {
    console.error('[DASHBOARD] Error fetching database counts:', error);
    
    // Return default stats on error
    const stats = [
      {
        title: 'Total Enquiries',
        value: '0',
        change: '+0%',
        trend: 'up',
        icon: 'MessageSquare',
        color: 'emerald'
      },
      {
        title: 'Active Projects',
        value: '0',
        change: '+0',
        trend: 'up',
        icon: 'FolderKanban',
        color: 'blue'
      },
      {
        title: 'Completed Projects',
        value: '0',
        change: '+0',
        trend: 'up',
        icon: 'CheckCircle',
        color: 'green'
      },
      {
        title: 'Blog Posts',
        value: '0',
        change: '+0',
        trend: 'up',
        icon: 'FileText',
        color: 'purple'
      },
      {
        title: 'Services',
        value: '0',
        change: '+0',
        trend: 'up',
        icon: 'Settings',
        color: 'orange'
      },
    ];

    return {
      props: {
        stats,
        activities: [],
      },
    };
  }
}
