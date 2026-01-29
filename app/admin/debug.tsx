import React from 'react';
import AdminWebView from '@/components/AdminWebView';

export default function AdminDebug() {
  return (
    <AdminWebView 
      initialUrl="/mobile-admin/debug"
      title="Debug Info"
      showBackButton={true}
    />
  );
}