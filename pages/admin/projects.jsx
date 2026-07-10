import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Table from '../../components/admin/Table';
import Modal from '../../components/admin/Modal';
import Form from '../../components/admin/Form';
import MediaPicker from '../../components/admin/MediaPicker';
import { Edit, Trash2, Calendar, MapPin, DollarSign, Video } from 'lucide-react';
import { prisma } from '../../lib/prisma';

export default function ProjectsPage({ projects }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const columns = [
    { key: 'title', label: 'Project Name', sortable: true },
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'COMPLETED'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : status === 'ONGOING'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : status === 'PLANNED'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      key: 'completionDate',
      label: 'Completion Date',
      sortable: true,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
  ];

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setViewMode(false);
    
    // Parse existing images and videos
    const existingImages = project.images 
      ? project.images.split(',').map((url, index) => ({
          id: `img-${index}`,
          url: url.trim(),
          name: url.split('/').pop(),
          thumbnailUrl: url.trim(),
          type: 'image',
        }))
      : [];
    
    const existingVideos = project.videos
      ? project.videos.split(',').map((url, index) => ({
          id: `vid-${index}`,
          url: url.trim(),
          name: url.split('/').pop(),
          type: 'video',
        }))
      : [];
    
    setSelectedImages(existingImages);
    setSelectedVideos(existingVideos);
    setIsModalOpen(true);
  };

  const handleNewProject = () => {
    setSelectedProject(null);
    setViewMode(false);
    setSelectedImages([]);
    setSelectedVideos([]);
    setIsModalOpen(true);
  };

  const handleCreateProject = async (data) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images: Array.isArray(data.selectedImages) 
            ? data.selectedImages.map(img => img.url).join(',')
            : '',
          videos: Array.isArray(data.selectedVideos)
            ? data.selectedVideos.map(vid => vid.url).join(',')
            : '',
          featured: data.featured === 'true',
        }),
      });

      if (response.ok) {
        const project = await response.json();
        window.location.reload();
      } else {
        console.error('[PROJECT] Failed to create project');
        alert('Failed to create project');
      }
    } catch (error) {
      console.error('[PROJECT] Error creating project:', error);
      alert('Error creating project');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('[PROJECT] Failed to delete project');
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('[PROJECT] Error deleting project:', error);
      alert('Error deleting project');
    }
  };

  const handleUpdateProject = async (data) => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images: Array.isArray(data.selectedImages) 
            ? data.selectedImages.map(img => img.url).join(',')
            : '',
          videos: Array.isArray(data.selectedVideos)
            ? data.selectedVideos.map(vid => vid.url).join(',')
            : '',
          featured: data.featured === 'true',
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('[PROJECT] Failed to update project');
        alert('Failed to update project');
      }
    } catch (error) {
      console.error('[PROJECT] Error updating project:', error);
      alert('Error updating project');
    }
  };

  const formFields = [
    { name: 'title', label: 'Project Title', type: 'text', required: true, placeholder: 'Enter project title' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Enter project description', rows: 4 },
    { name: 'category', label: 'Category', type: 'text', required: true, placeholder: 'Enter category (e.g., Residential, Commercial)' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'PLANNED', label: 'Planned' },
        { value: 'ONGOING', label: 'Ongoing' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
    { name: 'location', label: 'Location', type: 'text', required: false, placeholder: 'Enter location' },
    { name: 'clientName', label: 'Client Name', type: 'text', required: false, placeholder: 'Enter client name' },
    {
      name: 'completionDate',
      label: 'Completion Date',
      type: 'text',
      required: false,
      placeholder: 'YYYY-MM-DD',
    },
    {
      name: 'selectedImages',
      label: 'Images',
      type: 'custom',
      required: false,
      render: (formData, handleChange) => (
        <MediaPicker
          type="image"
          selected={selectedImages}
          onChange={(media) => {
            setSelectedImages(media);
            handleChange('selectedImages', media);
          }}
          maxSelect={10}
        />
      ),
    },
    {
      name: 'selectedVideos',
      label: 'Videos',
      type: 'custom',
      required: false,
      render: (formData, handleChange) => (
        <MediaPicker
          type="video"
          selected={selectedVideos}
          onChange={(media) => {
            setSelectedVideos(media);
            handleChange('selectedVideos', media);
          }}
          maxSelect={5}
        />
      ),
    },
    {
      name: 'featured',
      label: 'Featured Project',
      type: 'select',
      required: false,
      options: [
        { value: 'false', label: 'No' },
        { value: 'true', label: 'Yes' },
      ],
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
          title={viewMode ? 'Project Details' : (selectedProject ? 'Edit Project' : 'Add New Project')}
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedProject.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedProject.status}</p>
                  </div>
                </div>
                {selectedProject.location && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedProject.location}</p>
                    </div>
                  </div>
                )}
                {selectedProject.completionDate && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Completion Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedProject.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedProject.clientName && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Client</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedProject.clientName}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedProject.description}</p>
              </div>

              {selectedProject.images && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Images</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedProject.images.split(',').map((url, index) => (
                      <img
                        key={index}
                        src={url.trim()}
                        alt={`Project image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.videos && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Videos</h3>
                  <div className="space-y-2">
                    {selectedProject.videos.split(',').map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <a
                          href={url.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Video {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => handleEditProject(selectedProject)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Project
                </button>
                <button 
                  onClick={() => handleDeleteProject(selectedProject.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            </div>
          ) : (
            <Form
              fields={formFields}
              onSubmit={selectedProject ? handleUpdateProject : handleCreateProject}
              submitText={selectedProject ? 'Update Project' : 'Create Project'}
              defaultValues={selectedProject ? {
                ...selectedProject,
                selectedImages,
                selectedVideos,
                featured: selectedProject.featured ? 'true' : 'false',
              } : undefined}
            />
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      props: {
        projects: JSON.parse(JSON.stringify(projects)),
      },
    };
  } catch (error) {
    console.error('[PROJECT] Error fetching projects:', error);
    return {
      props: {
        projects: [],
      },
    };
  }
}
