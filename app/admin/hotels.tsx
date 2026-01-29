import React from 'react';
import AdminWebView from '@/components/AdminWebView';

export default function AdminHotels() {
  return (
    <AdminWebView
      initialUrl="/mobile-admin/hotels"
      title="Hotels"
      showBackButton={true}
      showHeader={true}
    />
  );
}