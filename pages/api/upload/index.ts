import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { createNotification } from '../../../lib/notifications'
import { logActivity } from '../../../lib/activityLog'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]

    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm']
    const allowedDocumentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocumentTypes]

    const mimetype = file.mimetype || ''
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' })
    }

    // Determine file type and directory
    const fileType = allowedImageTypes.includes(mimetype) ? 'image' : allowedVideoTypes.includes(mimetype) ? 'video' : 'document'
    const uploadDir = fileType === 'image' ? 'images' : fileType === 'video' ? 'videos' : 'documents'
    const maxSize = fileType === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024 // 10MB for images, 100MB for videos

    // Validate file size
    if (file.size && file.size > maxSize) {
      return res.status(400).json({ 
        error: `File too large. Maximum size for ${fileType}s is ${maxSize / (1024 * 1024)}MB` 
      })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = path.extname(file.originalFilename || '')
    const fileName = `${timestamp}-${randomString}${extension}`

    // Create upload directory if it doesn't exist
  
    //await fs.copyFile(file.filepath, filePath)

    //const exists = await fs.stat(filePath)
    //console.log("FILE SAVED:", filePath)
    //console.log("FILE SIZE:", exists.size)
    //await fs.unlink(file.filepath)

    // Generate file URL
    //const fileUrl = `/uploads/${uploadDir}/${fileName}`
    // ===== CLOUDINARY UPLOAD =====
    // Determine resource type based on file type
    const resourceType =
    fileType === "image"
    ? "image"
    : fileType === "video"
    ? "video"
    : "raw"

    const uploadResult = await cloudinary.uploader.upload(file.filepath, {
        folder: "sreevenkatesswara",
        resource_type: resourceType,
    })

    await fs.unlink(file.filepath)

    const fileUrl = uploadResult.secure_url

    console.log("Cloudinary URL:", fileUrl)
    // Save to database
    const media = await prisma.media.create({
      data: {
        fileName,
        originalName: file.originalFilename || 'unknown',
        fileType,
        mimeType: file.mimetype || 'application/octet-stream',
        fileSize: file.size || 0,
        fileUrl,
      },
    })

    // Create notification
    await createNotification({
      title: 'Image Uploaded',
      message: `New ${fileType} "${file.originalFilename}" has been uploaded`,
      type: 'success',
      link: '/admin/uploads'
    })

    // Log activity
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null
    const browser = req.headers['user-agent'] || null
    await logActivity({
      adminName: 'Admin',
      action: 'Uploaded Image',
      module: 'Upload',
      ipAddress: ipAddress as string,
      browser: browser as string
    })

    return res.status(200).json({
      success: true,
      media: {
        id: media.id,
        fileName: media.fileName,
        originalName: media.originalName,
        fileType: media.fileType,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
        fileUrl: media.fileUrl,
        uploadedAt: media.uploadedAt,
      },
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    })
  }
}
