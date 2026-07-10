import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sreevenkatesswaraconstructions.com' },
    update: { emailVerified: true },
    create: {
      name: 'Super Admin',
      email: 'admin@sreevenkatesswaraconstructions.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      phone: '+91 98765 43210',
      emailVerified: true
    }
  })

  // Create services
  const services = [
    {
      serviceName: 'Construction',
      shortDescription: 'Complete residential and commercial construction services.',
      detailedDescription: 'Complete residential and commercial construction services with premium quality materials and expert craftsmanship.',
      slug: 'construction',
      image: '/images/services/construction.jpg'
    },
    {
      serviceName: 'Interiors',
      shortDescription: 'Premium interior design services including modern and traditional styles.',
      detailedDescription: 'Transform your spaces with our premium interior design services including modern and traditional styles.',
      slug: 'interiors',
      image: '/images/services/interiors.jpg'
    },
    {
      serviceName: 'Renovation',
      shortDescription: 'Expert renovation services for existing properties.',
      detailedDescription: 'Expert renovation services to breathe new life into your existing property with modern upgrades.',
      slug: 'renovation',
      image: '/images/services/renovation.jpg'
    },
    {
      serviceName: 'Civil Works',
      shortDescription: 'Comprehensive civil engineering works.',
      detailedDescription: 'Comprehensive civil engineering works including structural design, foundation work, and infrastructure development.',
      slug: 'civil-works',
      image: '/images/services/civil-works.jpg'
    },
    {
      serviceName: 'Plumbing',
      shortDescription: 'Professional plumbing services for all properties.',
      detailedDescription: 'Professional plumbing services for residential and commercial properties with modern fixtures and leak-free solutions.',
      slug: 'plumbing',
      image: '/images/services/plumbing.jpg'
    },
    {
      serviceName: 'Electrical',
      shortDescription: 'Complete electrical services for all property types.',
      detailedDescription: 'Complete electrical services including wiring, lighting solutions, and safety inspections for all property types.',
      slug: 'electrical',
      image: '/images/services/electrical.jpg'
    },
    {
      serviceName: 'Painting',
      shortDescription: 'Premium painting services with expert color consultation.',
      detailedDescription: 'Premium painting services with high-quality paints, expert color consultation, and flawless finishes.',
      slug: 'painting',
      image: '/images/services/painting.jpg'
    },
    {
      serviceName: 'Carpentry',
      shortDescription: 'Custom carpentry and woodworking services.',
      detailedDescription: 'Custom carpentry and woodworking services including furniture, cabinets, and decorative woodwork.',
      slug: 'carpentry',
      image: '/images/services/carpentry.jpg'
    }
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service
    })
  }

  // Create sample projects
  const projects = [
    {
      title: 'Luxury Villa Construction',
      description: 'A stunning 5000 sq.ft luxury villa with modern amenities, premium finishes, and landscaped gardens.',
      category: 'Residential',
      status: 'COMPLETED',
      images: '/images/projects/villa1.jpg,/images/projects/villa2.jpg',
      videos: '',
      location: 'Chennai',
      completionDate: new Date('2024-03-15'),
      clientName: 'Rajesh Kumar',
      featured: true
    },
    {
      title: 'Corporate Office Interior',
      description: 'Modern office space design with open layout, ergonomic furniture, and smart lighting solutions.',
      category: 'Commercial',
      status: 'COMPLETED',
      images: '/images/projects/office1.jpg,/images/projects/office2.jpg',
      videos: '',
      location: 'Chennai',
      completionDate: new Date('2024-02-20'),
      clientName: 'Tech Solutions Ltd',
      featured: true
    },
    {
      title: 'Apartment Complex',
      description: 'Multi-story apartment complex with 24 units, modern amenities, and premium construction quality.',
      category: 'Residential',
      status: 'ONGOING',
      images: '/images/projects/apartment1.jpg',
      videos: '',
      location: 'Chennai',
      completionDate: new Date('2024-12-31'),
      clientName: 'Skyline Developers',
      featured: false
    }
  ]

  for (const project of projects) {
    await prisma.project.create({
      data: project
    })
  }

  // Create sample blogs
  const blogs = [
    {
      title: 'Top 10 Interior Design Trends for 2024',
      slug: 'top-10-interior-design-trends-2024',
      content: 'Discover the latest interior design trends that are transforming homes and offices in 2024. From sustainable materials to smart home integration...',
      category: 'Interior Design',
      tags: 'Interior,Design,Trends,2024',
      featuredImage: '/images/blog/interior-trends.jpg',
      metaTitle: 'Top 10 Interior Design Trends for 2024 | Sree Venkatesswara Constructions',
      metaDescription: 'Explore the latest interior design trends for 2024. Get expert insights on modern home and office design.',
      published: true
    },
    {
      title: 'Complete Guide to Home Construction',
      slug: 'complete-guide-to-home-construction',
      content: 'Everything you need to know about building your dream home. From planning to completion, we cover all aspects of home construction...',
      category: 'Construction',
      tags: 'Construction,Home Building,Guide',
      featuredImage: '/images/blog/home-construction.jpg',
      metaTitle: 'Complete Guide to Home Construction | Sree Venkatesswara Constructions',
      metaDescription: 'Learn the complete process of home construction from planning to completion with expert tips.',
      published: true
    }
  ]

  for (const blog of blogs) {
    await prisma.blog.create({
      data: blog
    })
  }

  // Create sample settings
  const settings = [
    { key: 'site_title', value: 'Sree Venkatesswara Constructions & Interiors' },
    { key: 'site_tagline', value: 'Building Dreams. Creating Spaces.' },
    { key: 'contact_email', value: 'info@sreevenkatesswaraconstructions.com' },
    { key: 'contact_phone', value: '+91 98765 43210' },
    { key: 'contact_address', value: 'Chennai, Tamil Nadu, India' }
  ]

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }

}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
