# Admin Dashboard - Sree Venkatesswara Constructions & Interiors

A modern, enterprise-level admin dashboard built with Next.js, Tailwind CSS, TypeScript, and Framer Motion.

## Features

### Core Features
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes
- **Modern UI**: Clean, minimal, and premium design aesthetic
- **Smooth Animations**: Powered by Framer Motion for fluid transitions

### Dashboard Sections
1. **Dashboard Home** - Overview with statistics cards and recent activity
2. **Enquiries** - Manage customer enquiries and requests
3. **Projects** - Track construction and interior projects
4. **Blogs** - Content management for blog posts
5. **Services** - Manage company services
6. **Upload Manager** - File and image management
7. **Settings** - Account and application settings

### Components

#### Layout Components
- `AdminLayout` - Main layout wrapper with sidebar and navbar
- `AdminSidebar` - Navigation sidebar with menu items
- `AdminNavbar` - Top navigation bar with search and notifications

#### UI Components
- `StatCard` - Statistics display card with trend indicators
- `Table` - Reusable data table with sorting, filtering, and pagination
- `Modal` - Modal dialog component
- `Form` - Dynamic form builder with validation
- `Toast` - Notification toast component
- `Skeleton` - Loading skeleton components
- `RecentActivity` - Activity feed component
- `QuickActions` - Quick action buttons

#### Dashboard Components
- `DashboardOverview` - Main dashboard overview with stats and activity

## Tech Stack

- **Next.js** 13.5.6 - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Getting Started

### Access the Dashboard

Navigate to `/admin` in your browser to access the dashboard.

```
http://localhost:3000/admin
```

### File Structure

```
pages/
  admin/
    index.jsx              # Dashboard home
    enquiries.jsx          # Enquiries management
    projects.jsx           # Projects management
    blogs.jsx              # Blogs management
    services.jsx           # Services management
    uploads.jsx            # Upload manager
    settings.jsx           # Settings page

components/
  admin/
    AdminLayout.jsx        # Main layout
    AdminSidebar.jsx       # Sidebar navigation
    AdminNavbar.jsx        # Top navbar
    DashboardOverview.jsx  # Dashboard overview
    StatCard.jsx           # Statistics card
    RecentActivity.jsx     # Activity feed
    QuickActions.jsx       # Quick actions
    Table.jsx              # Data table
    Modal.jsx              # Modal dialog
    Form.jsx               # Form builder
    Toast.jsx              # Toast notifications
    Skeleton.jsx           # Loading skeletons
```

## Component Usage

### Table Component

```jsx
<Table
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
  ]}
  data={dataArray}
  onRowClick={handleRowClick}
  pagination
  searchable
  filterable
/>
```

### Modal Component

```jsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Modal Title"
  size="lg"
>
  <div>Modal content</div>
</Modal>
```

### Form Component

```jsx
<Form
  fields={[
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
  ]}
  onSubmit={handleSubmit}
  submitText="Submit"
/>
```

### StatCard Component

```jsx
<StatCard
  title="Total Enquiries"
  value="248"
  change="+12%"
  trend="up"
  icon="MessageSquare"
  color="emerald"
/>
```

## Features by Page

### Dashboard Home
- Statistics cards (Total Enquiries, Active Projects, Completed Projects, Blog Count, Website Visitors)
- Recent activity feed
- Quick action buttons

### Enquiries
- List all customer enquiries
- View enquiry details
- Add new enquiries
- Filter by status
- Search functionality
- Pagination

### Projects
- List all projects
- View project details
- Add new projects
- Filter by status
- Search functionality
- Pagination

### Blogs
- List all blog posts
- View blog details
- Add new blog posts
- Filter by status
- Search functionality
- Pagination

### Services
- List all services
- View service details
- Add new services
- Filter by status
- Search functionality
- Pagination

### Upload Manager
- Drag and drop file upload
- File list with details
- Download and delete files
- Storage usage indicator

### Settings
- Profile settings
- Company information
- Notification preferences
- Security settings
- Appearance settings
- SEO settings

## Customization

### Colors

The dashboard uses a custom color scheme defined in `tailwind.config.js`:

```javascript
colors: {
  emerald: {
    DEFAULT: '#004d40',
    700: '#014033'
  },
  gold: '#cfa84b',
  ivory: '#fffaf0',
  beige: '#efe6dd',
  wood: '#8b5e3c'
}
```

### Dark Mode

Dark mode is enabled via Tailwind's class strategy. Toggle the `dark` class on the root element to switch themes.

## Responsive Design

The dashboard is fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

The sidebar collapses on mobile devices and can be toggled via the menu button.

## Future Enhancements

- Analytics integration
- Real-time notifications
- Advanced filtering
- Export functionality
- Role-based access control
- Multi-language support

## Notes

- The dashboard uses mock data for demonstration purposes
- Analytics integration is not yet implemented
- Backend API integration is required for full functionality
