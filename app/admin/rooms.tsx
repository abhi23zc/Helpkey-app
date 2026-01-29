import React from 'react';
import AdminWebView from '@/components/AdminWebView';

export default function AdminRoomsScreen() {
  return (
    <AdminWebView
      initialUrl="/mobile-admin/rooms"
      title="Rooms"
      showBackButton={true}
      showHeader={true}
    />
  );
}
