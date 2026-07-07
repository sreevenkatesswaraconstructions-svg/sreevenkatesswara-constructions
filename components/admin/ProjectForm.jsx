import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const statusOptions = ['Planning', 'Ongoing', 'On Hold', 'Completed']

const initialForm = {
  projectName: '',
  projectType: '',
  siteAddress: '',
  startDate: '',
  expectedEndDate: '',
  estimatedBudget: '',
  projectManager: '',
  status: 'Planning',
}

function toDateInputValue(value) {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)
  return localDate.toISOString().slice(0, 10)
}

function buildFormData(initialValues) {
  if (!initialValues) {
    return { ...initialForm }
  }

  return {
    projectName: initialValues.projectName || initialValues.title || '',
    projectType: initialValues.projectType || '',
    siteAddress: initialValues.siteAddress || initialValues.location || '',
    startDate: toDateInputValue(initialValues.startDate),
    expectedEndDate: toDateInputValue(initialValues.expectedEndDate || initialValues.expectedCompletionDate || initialValues.completionDate),
    estimatedBudget: initialValues.estimatedBudget || '',
    projectManager: initialValues.projectManager || '',
    status: initialValues.status || 'Planning',
  }
}

function validateForm(values) {
  const errors = []

  const projectName = values.projectName.trim()
  const projectType = values.projectType.trim()
  const status = values.status.trim()

  if (!projectName) {
    errors.push('Project name is required.')
  }

  if (!projectType) {
    errors.push('Project type is required.')
  }

  if (!status) {
    errors.push('Status is required.')
  }

  if (values.estimatedBudget && values.estimatedBudget.trim() && !/^[-+]?\d+(\.\d+)?$/.test(values.estimatedBudget.trim())) {
    errors.push('Budget must be numeric.')
  }

  if (values.startDate) {
    const parsedStartDate = new Date(values.startDate)
    if (Number.isNaN(parsedStartDate.getTime())) {
      errors.push('Start date must be valid.')
    }
  }

  if (values.expectedEndDate) {
    const parsedExpectedDate = new Date(values.expectedEndDate)
    if (Number.isNaN(parsedExpectedDate.getTime())) {
      errors.push('Expected completion date must be valid.')
    }
  }

  if (values.startDate && values.expectedEndDate) {
    const startDate = new Date(values.startDate)
    const expectedEndDate = new Date(values.expectedEndDate)

    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(expectedEndDate.getTime()) && startDate > expectedEndDate) {
      errors.push('Expected completion date cannot be before the start date.')
    }
  }

  return errors
}

export default function ProjectForm({
  mode = 'create',
  projectId = '',
  customerId = '',
  initialProject = null,
  customer = null,
  backHref = '/admin/projects',
  successHref = '/admin/projects',
  title = 'Create Project',
  description = 'Create a project for the selected customer without changing the customer selection.',
  submitLabel = 'Save Project',
}) {
  const router = useRouter()
  const [formData, setFormData] = useState(() => buildFormData(initialProject))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState([])
  const [customerDetails, setCustomerDetails] = useState(customer)
  const [loadingCustomer, setLoadingCustomer] = useState(mode === 'create' && Boolean(customerId))

  useEffect(() => {
    if (initialProject) {
      setFormData(buildFormData(initialProject))
    }
  }, [initialProject])

  useEffect(() => {
    if (mode !== 'create') {
      return
    }

    if (!customerId) {
      router.replace('/admin/customers')
      return
    }

    const loadCustomer = async () => {
      try {
        setLoadingCustomer(true)
        setError('')
        const response = await fetch('/api/customers')
        const result = await response.json()

        if (result?.success) {
          const selectedCustomer = (result.data || []).find((item) => String(item.id) === String(customerId)) || null
          setCustomerDetails(selectedCustomer)

          if (!selectedCustomer) {
            setError('The selected customer could not be found.')
          }
        } else {
          setError(result?.message || 'Failed to load customer details')
        }
      } catch (err) {
        console.error('Failed to load customer', err)
        setError('Unable to load customer details right now.')
      } finally {
        setLoadingCustomer(false)
      }
    }

    loadCustomer()
  }, [customerId, mode, router])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (validationErrors.length) setValidationErrors([])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (mode === 'create' && (!customerId || !customerDetails)) {
      setError('A valid customer is required to create a project.')
      return
    }

    const errors = validateForm(formData)
    if (errors.length) {
      setValidationErrors(errors)
      setError('Please correct the highlighted issues before saving.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setValidationErrors([])

      const payload = {
        ...formData,
        title: formData.projectName.trim(),
        projectName: formData.projectName.trim(),
        projectType: formData.projectType.trim(),
        siteAddress: formData.siteAddress.trim(),
        startDate: formData.startDate || null,
        expectedEndDate: formData.expectedEndDate || null,
        estimatedBudget: formData.estimatedBudget.trim(),
        projectManager: formData.projectManager.trim(),
        status: formData.status.trim(),
        customerId: initialProject?.customerId || customerId || null,
        customerName: customerDetails?.name || initialProject?.clientName || initialProject?.customerName || '',
      }

      const endpoint = mode === 'edit' ? `/api/projects/${projectId}` : '/api/projects'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || (mode === 'edit' ? 'Failed to update project' : 'Failed to create project'))
      }

      router.push(successHref || (mode === 'edit' ? `/admin/projects/${projectId}` : `/admin/customers/${customerId}?tab=projects`))
    } catch (err) {
      console.error(mode === 'edit' ? 'Failed to update project' : 'Failed to create project', err)
      setError(err.message || (mode === 'edit' ? 'Unable to update the project right now.' : 'Unable to create the project right now.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="h-4 w-4" />
            {mode === 'edit' ? 'Back to Project Details' : 'Back to Projects'}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {loadingCustomer ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            Loading customer details...
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {mode === 'create' ? (
            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">Selected Customer</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{customerDetails?.name || 'Customer not found'}</p>
              <p className="text-sm text-gray-600">Customer ID: {customerDetails?.id || customerId}</p>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">Project Customer</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{customerDetails?.name || initialProject?.clientName || initialProject?.customerName || 'Customer not available'}</p>
              <p className="text-sm text-gray-600">Customer ID: {initialProject?.customerId || customerId || 'Not assigned'}</p>
            </div>
          )}

          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          {validationErrors.length ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              <ul className="list-disc space-y-1 pl-5">
                {validationErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Project Name</label>
              <input
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Project Type</label>
              <input
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="e.g. Residential"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">Site Address</label>
              <input
                name="siteAddress"
                value={formData.siteAddress}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="Enter site address"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Expected Completion Date</label>
              <input
                type="date"
                name="expectedEndDate"
                value={formData.expectedEndDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Estimated Budget</label>
              <input
                name="estimatedBudget"
                value={formData.estimatedBudget}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="e.g. 1200000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Project Manager</label>
              <input
                name="projectManager"
                value={formData.projectManager}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="Enter project manager"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <Link href={backHref} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || (mode === 'create' && (!customerId || !customerDetails))}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {submitting ? (mode === 'edit' ? 'Saving changes...' : 'Saving...') : submitLabel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
