import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Loader2 } from 'lucide-react'
import AdminLayout from '../../../../components/admin/AdminLayout'
import ProjectForm from '../../../../components/admin/ProjectForm'
import { prisma } from '../../../../lib/prisma'

export async function getServerSideProps({ params }) {
  const projectId = typeof params?.id === 'string' ? params.id : ''

  if (!projectId) {
    return { notFound: true }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return { notFound: true }
  }

  return {
    props: {
      initialProject: JSON.parse(JSON.stringify(project)),
    },
  }
}

export default function EditProjectPage({ initialProject }) {
  const router = useRouter()
  const projectId = typeof router.query.id === 'string' ? router.query.id : ''
  const [project, setProject] = useState(initialProject || null)
  const [loading, setLoading] = useState(!initialProject)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!projectId || initialProject?.id === projectId) {
      if (initialProject?.id === projectId) {
        setProject(initialProject)
        setLoading(false)
        setError('')
      }
      return
    }

    const loadProject = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(`/api/projects/${projectId}`)
        const result = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found.')
            return
          }

          throw new Error(result?.error || 'Failed to load project')
        }

        setProject(result)
      } catch (err) {
        console.error('Failed to load project for editing', err)
        setError(err.message || 'Unable to load project details right now.')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [initialProject, projectId])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            Loading project details...
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !project) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-medium">{error || 'Project not found.'}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <ProjectForm
        mode="edit"
        projectId={projectId}
        initialProject={project}
        customerId={project.customerId || ''}
        backHref={`/admin/projects/${projectId}`}
        successHref={`/admin/projects/${projectId}`}
        title="Edit Project"
        description="Update the selected project details while keeping the customer assignment unchanged."
        submitLabel="Save Changes"
      />
    </AdminLayout>
  )
}
