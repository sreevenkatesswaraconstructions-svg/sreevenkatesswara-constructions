import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'
import { User, Mail, Phone, Building, Briefcase, Camera, Save, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    designation: '',
    profileImage: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState(50)
  const [cropPreviewUrl, setCropPreviewUrl] = useState('')
  const [cropOrientation, setCropOrientation] = useState('square')
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (!selectedImageUrl) return

    const updateCropPreview = async () => {
      if (!canvasRef.current) return

      const image = new Image()
      image.src = selectedImageUrl
      await new Promise((resolve) => {
        if (image.complete) {
          resolve(true)
        } else {
          image.onload = resolve
          image.onerror = resolve
        }
      })

      const width = image.naturalWidth
      const height = image.naturalHeight
      if (!width || !height) return

      const baseSize = Math.min(width, height)
      const cropSize = Math.max(50, Math.round(baseSize / cropZoom))
      const orientation = width >= height ? 'landscape' : 'portrait'
      setCropOrientation(orientation)

      const maxOffset = orientation === 'landscape' ? width - cropSize : height - cropSize
      const offsetPosition = Math.round((cropOffset / 100) * maxOffset)
      const cropX = orientation === 'landscape' ? offsetPosition : Math.round((width - cropSize) / 2)
      const cropY = orientation === 'landscape' ? Math.round((height - cropSize) / 2) : offsetPosition

      const canvas = canvasRef.current
      const targetSize = 360
      canvas.width = targetSize
      canvas.height = targetSize
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, targetSize, targetSize)
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, targetSize, targetSize)
      ctx.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, targetSize, targetSize)

      setCropPreviewUrl(canvas.toDataURL('image/jpeg', 0.92))
    }

    updateCropPreview()

    return () => {
      URL.revokeObjectURL(selectedImageUrl)
    }
  }, [selectedImageUrl, cropZoom, cropOffset])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile')
      const data = await res.json()
      if (data.success) {
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          companyName: data.data.companyName || '',
          designation: data.data.designation || '',
          profileImage: data.data.profileImage || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG and WebP files are allowed')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10 MB')
      return
    }

    setSelectedFile(file)
    setSelectedImageUrl(URL.createObjectURL(file))
    setCropZoom(1)
    setCropOffset(50)
    setCropModalOpen(true)
    e.target.value = ''
  }

  const handleUploadCroppedPhoto = async () => {
    if (!selectedImageUrl || !canvasRef.current) return

    setUploadingPhoto(true)

    try {
      const canvas = canvasRef.current
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blobData) => {
          if (blobData) {
            resolve(blobData)
          } else {
            reject(new Error('Failed to create cropped image'))
          }
        }, 'image/jpeg', 0.92)
      })

      const formDataUpload = new FormData()
      formDataUpload.append('file', blob, `profile-${Date.now()}.jpg`)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      const saveRes = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: uploadData.media.fileUrl })
      })
      const saveData = await saveRes.json()
      if (!saveData.success) {
        throw new Error(saveData.message || 'Failed to save profile photo')
      }

      setFormData(prev => ({ ...prev, profileImage: saveData.data.profileImage || uploadData.media.fileUrl }))
      toast.success('Profile photo uploaded and saved')
      setCropModalOpen(false)
      setSelectedFile(null)
      setSelectedImageUrl('')
    } catch (error) {
      console.error('Failed to upload profile photo:', error)
      toast.error('Failed to upload profile photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'A'
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Profile Photo Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h2>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="relative group">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-white text-4xl font-semibold flex items-center justify-center border-4 border-white shadow-xl transition-transform duration-300 group-hover:scale-105">
                    {getInitials(formData.name)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-lg animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload and crop a professional profile photo. The finished image is stored in the Upload Manager and saved to your admin profile.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  Supported formats: JPG, PNG, WebP. Max 10MB.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Designation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your designation"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 flex justify-end gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {cropModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Crop Profile Photo</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Adjust the crop and preview the final avatar before saving.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCropModalOpen(false)
                    setSelectedImageUrl('')
                    setSelectedFile(null)
                  }}
                  className="rounded-full p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] p-6">
                <div className="space-y-4">
                  <div className="rounded-3xl overflow-hidden bg-slate-950 border border-gray-200 dark:border-gray-700">
                    {cropPreviewUrl ? (
                      <img
                        src={cropPreviewUrl}
                        alt="Crop preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-96 flex items-center justify-center text-gray-400">
                        Preparing preview...
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Zoom</label>
                      <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.01"
                        value={cropZoom}
                        onChange={(e) => setCropZoom(Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>

                    {cropOrientation !== 'square' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {cropOrientation === 'landscape' ? 'Move crop horizontally' : 'Move crop vertically'}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={cropOffset}
                          onChange={(e) => setCropOffset(Number(e.target.value))}
                          className="w-full mt-2"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Crop Details</p>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-3">
                      <p>Orientation: <span className="font-medium">{cropOrientation}</span></p>
                      <p>Zoom: <span className="font-medium">{cropZoom.toFixed(2)}x</span></p>
                      {cropOrientation !== 'square' && (
                        <p>Offset: <span className="font-medium">{cropOffset}%</span></p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleUploadCroppedPhoto}
                      disabled={uploadingPhoto}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Save Photo
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCropModalOpen(false)
                        setSelectedImageUrl('')
                        setSelectedFile(null)
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </AdminLayout>
  )
}
