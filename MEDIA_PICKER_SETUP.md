# Media Picker Setup Guide

## Overview
The admin project creation form now includes a professional media selection system integrated with Cloudinary Upload Manager.

## Setup Requirements

### 1. Cloudinary Account Setup
To use the media picker and upload manager, you need a Cloudinary account:

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to your Dashboard
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Environment Variables
Create a `.env` file in the project root with your Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 3. Restart the Development Server
After adding the environment variables, restart the server:

```bash
npm run dev
```

## How to Use

### Upload Files
1. Navigate to Admin → Upload Manager
2. Drag and drop files or click "Select Files"
3. Supported formats:
   - Images: JPG, PNG, GIF, WEBP (Max 10MB)
   - Videos: MP4, MOV (Max 100MB)
4. Files are uploaded to Cloudinary and organized in folders

### Create Project with Media
1. Navigate to Admin → Projects
2. Click "Add Project"
3. Fill in project details (Title, Description, Category, etc.)
4. Click "Select Images" to open the media picker
5. Select multiple images from your uploaded files
6. Click "Select Videos" to add videos (optional)
7. Preview selected media before saving
8. Click "Create Project"

### View Projects
- Public Projects page displays selected images in a gallery
- Project detail page shows full image gallery and video player
- All media URLs are automatically saved - no manual entry required

## Features

### Media Picker
- ✅ Visual thumbnail previews
- ✅ Multi-select support (10 images, 5 videos)
- ✅ Search/filter functionality
- ✅ Remove individual selections
- ✅ Preview before saving

### Upload Manager
- ✅ Drag and drop upload
- ✅ Real file upload to Cloudinary
- ✅ Thumbnail previews
- ✅ File size and date display
- ✅ Delete functionality
- ✅ Download links

### Backward Compatibility
- ✅ Existing projects continue to work
- ✅ Comma-separated URL format maintained
- ✅ No database schema changes required

## API Endpoints

### GET /api/upload/files
Fetch uploaded files from Cloudinary
- Query params: `resource_type` (image|video), `max_results`

### POST /api/upload
Upload files to Cloudinary
- Body: `file` (base64), `folder` (optional)

### POST /api/upload/delete
Delete file from Cloudinary
- Body: `publicId`

## Troubleshooting

### "Must supply cloud_name" Error
This means Cloudinary environment variables are not configured:
1. Check that `.env` file exists
2. Verify all three Cloudinary variables are set
3. Restart the development server

### No Files Showing in Media Picker
1. Ensure files have been uploaded via Upload Manager
2. Check Cloudinary dashboard to verify uploads
3. Verify folder prefix matches (default: "sree-venkatesswara")

### Upload Failing
1. Check file size limits (10MB images, 100MB videos)
2. Verify file format is supported
3. Check Cloudinary account has sufficient storage

## File Organization

Files are organized in Cloudinary as:
- `sree-venkatesswara/` - Root folder
- Images stored with resource_type: image
- Videos stored with resource_type: video

## Next Steps

After setup:
1. Upload sample images/videos via Upload Manager
2. Create a test project with media
3. Verify media displays on public Projects page
4. Test editing existing projects with new media picker

## Support

For issues:
- Check browser console for errors
- Verify Cloudinary credentials are correct
- Ensure Next.js dev server is running
- Check network tab for API request failures
