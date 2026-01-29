// Admin configuration for WebView integration
export const AdminConfig = {
  // Base URL for the web admin dashboard
  baseUrl: __DEV__
    ? 'http://192.168.1.7:3000'  // Development URL
    : 'https://helpkey.in',  // Production URL - UPDATE THIS


  // Admin routes
  routes: {
    dashboard: '/mobile-admin',
    bookings: '/mobile-admin/bookings',
    hotels: '/mobile-admin/hotels',
    rooms: '/mobile-admin/rooms',
    payouts: '/mobile-admin/payouts',
    authTest: '/mobile-admin/auth-test',
    debug: '/mobile-admin/debug',
    locationPicker: '/mobile-admin/location-picker',
  },

  // WebView configuration
  webViewConfig: {
    userAgent: 'HelpKeyMobileApp/1.0 (Mobile; Admin)',
    javaScriptEnabled: true,
    domStorageEnabled: true,
    thirdPartyCookiesEnabled: true,
    sharedCookiesEnabled: true,
    mixedContentMode: 'compatibility' as const,
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: false,
  },

  // Security settings
  security: {
    allowedDomains: [
      'localhost:3000',
      '192.168.1.7:3000',
      'helpkey.in',  // UPDATE THIS
    ],
    requireAuth: true,
    allowedRoles: ['admin', 'super-admin', 'hotel_admin'],
  },

  // Error messages
  errorMessages: {
    accessDenied: 'You don\'t have permission to access the admin dashboard.',
    connectionError: 'Failed to load admin dashboard. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    notFound: 'Admin dashboard not found. Please contact support.',
  },
};

// Helper function to get full URL
export const getAdminUrl = (route: keyof typeof AdminConfig.routes): string => {
  return `${AdminConfig.baseUrl}${AdminConfig.routes[route]}`;
};

// Helper function to check if user has admin access
export const hasAdminAccess = (userRole?: string): boolean => {
  if (!userRole) return false;
  return AdminConfig.security.allowedRoles.includes(userRole);
};