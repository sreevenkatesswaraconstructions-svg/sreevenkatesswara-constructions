import { useRouter } from 'next/router'
import AdminLayout from '../../../components/admin/AdminLayout'
import ProjectForm from '../../../components/admin/ProjectForm'

export default function CreateCustomerProjectPage() {
  const router = useRouter()
  const customerId = typeof router.query.customerId === 'string' ? router.query.customerId : ''

  return (
    <AdminLayout>
      <ProjectForm
        mode="create"
        customerId={customerId}
        backHref={customerId ? `/admin/customers/${customerId}?tab=projects` : '/admin/projects'}
        successHref={customerId ? `/admin/customers/${customerId}?tab=projects` : '/admin/projects'}
        title="Create Project"
        description="Create a project for the selected customer without changing the customer selection."
        submitLabel="Save Project"
      />
    </AdminLayout>
  )
}
