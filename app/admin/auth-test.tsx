import React from 'react';
import AdminWebView from '@/components/AdminWebView';

export default function AdminAuthTest() {
  return (
    <AdminWebView 
      initialUrl="/mobile-admin/auth-test"
      title="Auth Test"
      showBackButton={true}
    />
  );
}