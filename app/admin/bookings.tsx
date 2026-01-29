import React from 'react';
import AdminWebView from '@/components/AdminWebView';

export default function AdminBookings() {
  return (
    <AdminWebView
      initialUrl="/mobile-admin/bookings"
      title="Bookings"
      showBackButton={true}
      showHeader={true}
    />
  );
}