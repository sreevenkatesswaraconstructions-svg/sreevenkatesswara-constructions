import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import Table from '../../components/admin/Table';
import Modal from '../../components/admin/Modal';
import Form from '../../components/admin/Form';
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign } from 'lucide-react';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  const projects = [
    {
      id: 1,
      title: 'Villa Renovation',
      client: 'John Doe',
      location: 'Chennai',
      budget: 2500000,
      status: 'in-progress',
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      description: 'Complete villa renovation including interior design and landscaping.',
    },
    {
      id: 2,
      title: 'Office Space Design',
      client: 'Tech Corp',
      location: 'Bangalore',
      budget: 5000000,
      status: 'active',
      startDate: '2024-02-01',
      endDate: '2024-08-31',
      description: 'Modern office space design for a technology company.',
    },
    {
      id: 3,
      title: 'Residential Complex',
      client: 'BuildWell Ltd',
      location: 'Hyderabad',
      budget: 15000000,
      status: 'completed',
      startDate: '2023-06-01',
      endDate: '2024-01-31',
      description: 'Multi-story residential complex construction.',
    },
    {
      id: 4,
      title: 'Restaurant Interior',
      client: 'Foodie Inc',
      location: 'Mumbai',
      budget: 1800000,
      status: 'pending',
      startDate: '2024-03-01',
      endDate: '2024-05-31',
      description: 'Restaurant interior design and fit-out.',
    },
    {
      id: 5,
      title: 'Retail Store',
      client: 'Fashion Hub',
      location: 'Delhi',
      budget: 3200000,
      status: 'in-progress',
      startDate: '2024-01-15',
      endDate: '2024-04-30',
      description: 'Premium retail store design and construction.',
    },
  ];

  const columns = [
    { key: 'title', label: 'Project Name', sortable: true },
    { key: 'client', label: 'Client', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (budget) => `₹${(budget / 100000).toFixed(1)}L`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'completed'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : status === 'active'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : status === 'in-progress'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'Deadline',
      sortable: true,
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleNewProject = () => {
    setSelectedProject(null);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const formFields = [
    { name: 'title', label: 'Project Title', type: 'text', required: true, placeholder: 'Enter project title' },
    { name: 'client', label: 'Client Name', type: 'text', required: true, placeholder: 'Enter client name' },
    { name: 'location', label: 'Location', type: 'text', required: true, placeholder: 'Enter location' },
    { name: 'budget', label: 'Budget (₹)', type: 'text', required: true, placeholder: 'Enter budget' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'active', label: 'Active' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'text',
      required: true,
      placeholder: 'YYYY-MM-DD',
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: 'text',
      required: true,
      placeholder: 'YYYY-MM-DD',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      placeholder: 'Enter project description',
      rows: 4,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage construction and interior projects
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewProject}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </motion.button>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={projects}
          onRowClick={handleViewProject}
          pagination
          searchable
          filterable
        />

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={viewMode ? 'Project Details' : 'Add New Project'}
          size="lg"
        >
          {viewMode && selectedProject ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedProject.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedProject.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedProject.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ₹{selectedProject.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Client</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedProject.client}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedProject.description}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit Project
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            </div>
          ) : (
            <Form
              fields={formFields}
              onSubmit={(data) => {
                console.log('New project:', data);
                setIsModalOpen(false);
              }}
              submitText="Create Project"
            />
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
