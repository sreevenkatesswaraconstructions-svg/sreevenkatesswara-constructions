# Backend Setup Guide for Sree Venkatesswara Constructions & Interiors

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (local or cloud-based)
- npm or yarn

## Database Setup

### Option 1: Use Supabase (Recommended for Production)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Update your `.env` file with the database URL

### Option 2: Use Neon (Recommended for Development)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Update your `.env` file with the database URL

### Option 3: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   ```sql
   CREATE DATABASE sree_venkatesswara_db;
   ```
3. Update your `.env` file with the connection string

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sree_venkatesswara_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@sreevenkatesswaraconstructions.com"
ADMIN_EMAIL="admin@sreevenkatesswaraconstructions.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_UPLOAD_PRESET="your-upload-preset"

# WhatsApp (Optional)
WHATSAPP_PHONE_NUMBER_ID="your-whatsapp-phone-number-id"
WHATSAPP_ACCESS_TOKEN="your-whatsapp-access-token"
WHATSAPP_API_VERSION="v18.0"
WHATSAPP_ADMIN_PHONE="your-admin-phone-number"

# Admin Credentials (Default admin - change after first login)
ADMIN_EMAIL="admin@sreevenkatesswaraconstructions.com"
ADMIN_PASSWORD="admin123"
```

## Installation Steps

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma Client:
```bash
npx prisma generate
```

3. Run database migrations:
```bash
npx prisma migrate dev --name init
```

4. Seed the database with initial data:
```bash
npm run seed
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Admin Access

After seeding the database, you can access the admin panel:

- URL: `http://localhost:3000/admin/login`
- Email: `admin@sreevenkatesswaraconstructions.com`
- Password: `admin123`

**Important:** Change the default password after first login!

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

### Enquiries
- `GET /api/enquiries` - Get all enquiries
- `GET /api/enquiries?id={id}` - Get single enquiry
- `POST /api/enquiries` - Create enquiry
- `PATCH /api/enquiries/{id}` - Update enquiry
- `DELETE /api/enquiries/{id}` - Delete enquiry
- `GET /api/enquiries/export?format=excel` - Export to Excel
- `GET /api/enquiries/export?format=pdf` - Export to PDF

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects?id={id}` - Get single project
- `POST /api/projects` - Create project
- `PATCH /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Blogs
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs?slug={slug}` - Get blog by slug
- `POST /api/blogs` - Create blog
- `PATCH /api/blogs/{id}` - Update blog
- `DELETE /api/blogs/{id}` - Delete blog

### Services
- `GET /api/services` - Get all services
- `GET /api/services?id={id}` - Get single service
- `POST /api/services` - Create service
- `PATCH /api/services/{id}` - Update service
- `DELETE /api/services/{id}` - Delete service

### Upload
- `POST /api/upload` - Upload file to Cloudinary
- `DELETE /api/upload/{id}` - Delete file from Cloudinary

### Email
- `POST /api/email/contact` - Send contact form emails
- `POST /api/email/enquiry` - Send enquiry emails
- `POST /api/email/quote` - Send quote request emails

## Third-Party Services Setup

### Resend (Email Service)

1. Go to [resend.com](https://resend.com)
2. Create an account
3. Get your API key from Settings > API Keys
4. Add the API key to your `.env` file

### Cloudinary (Image/Video Storage)

1. Go to [cloudinary.com](https://cloudinary.com)
2. Create an account
3. Get your credentials from Dashboard
4. Add the credentials to your `.env` file
5. Create an upload preset with unsigned upload enabled

### WhatsApp (Optional)

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a Meta for Developers account
3. Set up WhatsApp Business API
4. Get your phone number ID and access token
5. Add the credentials to your `.env` file

## Troubleshooting

### Prisma Client Not Generated

If you see errors about Prisma Client not being found:

```bash
npx prisma generate
```

### Database Connection Issues

If you can't connect to the database:

1. Check that your `.env` file has the correct `DATABASE_URL`
2. Ensure your database server is running
3. Verify the database credentials

### Migration Issues

If migrations fail:

```bash
npx prisma migrate reset
```

This will reset the database and re-run all migrations.

## Security Notes

1. Never commit `.env` file to version control
2. Change default admin password immediately
3. Use strong secrets in production
4. Enable HTTPS in production
5. Regularly update dependencies

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database for Production

Use Supabase or Neon for production database as they offer:
- Automatic backups
- High availability
- SSL connections
- Easy scaling

## Support

For issues or questions, refer to:
- Prisma Documentation: https://www.prisma.io/docs
- NextAuth Documentation: https://next-auth.js.org
- Next.js Documentation: https://nextjs.org/docs
