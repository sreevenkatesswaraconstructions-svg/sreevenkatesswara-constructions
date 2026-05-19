import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DashboardOverview from '../../components/admin/DashboardOverview';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <DashboardOverview />
    </AdminLayout>
  );
}
