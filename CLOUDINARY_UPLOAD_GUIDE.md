# Cloudinary Upload System Guide

## Overview
Complete Cloudinary upload system for Sree Venkatesswara Constructions & Interiors project.

## Environment Variables
Ensure these are set in your `.env` file:

```env
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
```

## API Endpoints

### POST /api/upload
Upload one or multiple files to Cloudinary.

**Authentication:** Admin only (SUPER_ADMIN or ADMIN)

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `files`: File[] (array of files to upload)
  - `folder`: string (optional, default: "documents")
    - Allowed values: "projects", "blogs", "services", "documents"

**Example using FormData:**
```javascript
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('folder', 'projects')

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "files": [
    {
      "url": "https://res.cloudinary.com/.../image.jpg",
      "publicId": "projects/images/image_1234567890_abc123.jpg",
      "metadata": {
        "originalName": "image.jpg",
        "size": 1024000,
        "type": "image/jpeg",
        "folder": "projects/images",
        "width": 1920,
        "height": 1080,
        "format": "jpg",
        "resourceType": "image",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    }
  ]
}
```

### DELETE /api/upload
Delete a file from Cloudinary.

**Authentication:** Admin only (SUPER_ADMIN or ADMIN)

**Request:**
- Method: DELETE
- Query params:
  - `publicId`: string (required)

**Example:**
```javascript
const response = await fetch(`/api/upload?publicId=${publicId}`, {
  method: 'DELETE'
})
```

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "publicId": "projects/images/image_1234567890_abc123.jpg"
}
```

## File Type Support

### Images
- **MIME Types:** image/jpeg, image/jpg, image/png, image/webp, image/gif, image/svg+xml
- **Max Size:** 10MB
- **Optimization:** Auto quality, auto format, max 1920x1080
- **Folder:** `images/` within specified folder

### Videos
- **MIME Types:** video/mp4, video/webm, video/quicktime, video/x-msvideo
- **Max Size:** 100MB
- **Folder:** `videos/` within specified folder

### Documents
- **MIME Types:** application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- **Max Size:** 25MB
- **Folder:** `documents/` within specified folder

## Folder Structure

Uploaded files are organized as follows:
- `projects/images/` - Project images
- `projects/videos/` - Project videos
- `blogs/images/` - Blog thumbnails and images
- `services/images/` - Service images
- `documents/documents/` - PDFs and other documents

## Features

### ✅ Secure Upload
- Admin authentication required
- File type validation
- File size limits

### ✅ Multiple Uploads
- Upload multiple files in a single request
- Parallel processing for faster uploads

### ✅ Image Optimization
- Automatic quality optimization
- Auto format selection
- Maximum dimensions (1920x1080)

### ✅ CDN Delivery
- All files served via Cloudinary CDN
- Fast global delivery

### ✅ Unique Filenames
- Timestamp-based naming
- Random string suffix
- Original name preservation in metadata

### ✅ Error Handling
- Detailed error messages
- Proper HTTP status codes
- Validation feedback

## Usage Examples

### React Component Example
```jsx
import { useState } from 'react'

function FileUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleUpload = async (files, folder = 'documents') => {
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setUploadedFiles(data.files)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => handleUpload(Array.from(e.target.files), 'projects')}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedFiles.map(file => (
        <img key={file.publicId} src={file.url} alt="Uploaded" />
      ))}
    </div>
  )
}
```

### Delete File Example
```javascript
const deleteFile = async (publicId) => {
  try {
    const response = await fetch(`/api/upload?publicId=${publicId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.success) {
      console.log('File deleted successfully')
    }
  } catch (error) {
    console.error('Delete failed:', error)
  }
}
```

## Error Codes

- **400** - Bad Request (invalid file, missing parameters, folder not allowed)
- **401** - Unauthorized (not authenticated)
- **403** - Forbidden (not admin)
- **500** - Internal Server Error (upload/delete failed)

## Notes

- All uploads require admin authentication
- Files are automatically optimized for web delivery
- Unique filenames prevent conflicts
- CDN delivery ensures fast loading globally
- Folder structure keeps uploads organized
