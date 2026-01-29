import React from 'react';
import AdminWebView from '@/components/AdminWebView';

export default function AdminDashboard() {
  return (
    <AdminWebView
      initialUrl="/mobile-admin"
      title="Admin Dashboard"
      showBackButton={true}
      showHeader={true}
    />
  );
}