# Mobile Admin Integration Guide

## 🚀 Overview

This document outlines the production-grade integration of the web-based admin dashboard into the HelpKey mobile app using WebView technology.

## 📁 File Structure

```
Helpkey-app/
├── app/admin/
│   ├── index.tsx           # Admin menu/dashboard entry
│   ├── dashboard.tsx       # Main admin dashboard WebView
│   ├── bookings.tsx        # Bookings management WebView
│   ├── hotels.tsx          # Hotels management WebView
│   └── notifications.tsx   # Existing notifications (native)
├── components/
│   └── AdminWebView.tsx    # Reusable WebView component
├── config/
│   └── admin.ts           # Admin configuration
├── hooks/
│   └── useAdmin.ts        # Admin functionality hook
├── services/
│   └── adminService.ts    # Admin API service
└── utils/
    └── webViewUtils.ts    # WebView utilities
```

## 🔧 Configuration

### 1. Update Production URL

Edit `Helpkey-app/config/admin.ts`:

```typescript
export const AdminConfig = {
  baseUrl: __DEV__ 
    ? 'http://localhost:3000'
    : 'https://your-actual-domain.com', // UPDATE THIS
  // ... rest of config
};
```

### 2. Environment Variables

Create `.env` file in your mobile app root:

```env
ADMIN_BASE_URL=https://your-production-domain.com
ADMIN_API_URL=https://your-production-domain.com/api
```

## 🔐 Security Features

### Authentication
- **Role-based access control**: Only `admin` and `super-admin` roles can access
- **Token-based authentication**: Firebase auth tokens passed to WebView
- **Session validation**: Automatic logout on session expiry

### WebView Security
- **Domain whitelist**: Only allowed domains can be loaded
- **HTTPS enforcement**: Production URLs must use HTTPS
- **Content Security Policy**: Injected JavaScript follows security best practices
- **User agent identification**: Custom user agent for mobile app requests

### Data Protection
- **Secure communication**: All API calls use authentication headers
- **Error handling**: Sensitive information not exposed in error messages
- **Input validation**: All user inputs validated before processing

## 📱 Usage

### 1. Navigation to Admin

From anywhere in the app:
```typescript
import { router } from 'expo-router';

// Navigate to admin menu
router.push('/admin');

// Navigate directly to specific admin page
router.push('/admin/bookings');
```

### 2. Using the Admin Hook

```typescript
import { useAdmin } from '@/hooks/useAdmin';

const MyComponent = () => {
  const { 
    isAdmin, 
    stats, 
    loading, 
    fetchStats,
    getAdminUrl 
  } = useAdmin();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <View>
      <Text>Total Bookings: {stats.totalBookings}</Text>
      {/* ... */}
    </View>
  );
};
```

### 3. Custom WebView Implementation

```typescript
import AdminWebView from '@/components/AdminWebView';

const CustomAdminPage = () => {
  return (
    <AdminWebView 
      initialUrl="/mobile-admin/custom-page"
      title="Custom Admin Page"
      showBackButton={true}
    />
  );
};
```

## 🌐 WebView Communication

### From Mobile App to WebView

```typescript
// Using the communicator
const communicator = new WebViewCommunicator(webViewRef);

// Send auth data
communicator.sendAuthData(user, userData);

// Send navigation command
communicator.sendNavigationCommand('back');

// Send custom message
communicator.sendMessage('CUSTOM_ACTION', { data: 'value' });
```

### From WebView to Mobile App

In your web admin dashboard:

```javascript
// Send message to mobile app
window.sendToMobile('BOOKING_UPDATED', {
  bookingId: 'BK123',
  status: 'confirmed'
});

// Handle messages from mobile app
document.addEventListener('mobileMessage', (event) => {
  const { type, data } = event.detail;
  
  switch (type) {
    case 'AUTH_DATA':
      // Update authentication in web app
      updateAuthData(data);
      break;
    case 'THEME_DATA':
      // Update theme
      updateTheme(data);
      break;
  }
});
```

## 🔄 API Integration

### Admin Service Usage

```typescript
import { adminService } from '@/services/adminService';

// Get dashboard stats
const stats = await adminService.getDashboardStats();

// Get bookings with filters
const bookings = await adminService.getBookings({
  status: 'pending',
  dateRange: 'today'
});

// Update booking status
await adminService.updateBookingStatus('booking-id', 'confirmed');

// Send notification
await adminService.sendNotification({
  type: 'booking_update',
  title: 'Booking Confirmed',
  message: 'Your booking has been confirmed',
  recipients: ['user-id']
});
```

## 🎨 Styling & Theming

### Mobile-Specific Styles

The WebView automatically injects mobile-optimized styles:

```css
/* Automatically applied to web admin when loaded in mobile app */
.mobile-app {
  /* Mobile-specific styles */
  -webkit-user-select: none;
  user-select: none;
}

.mobile-app input {
  /* Prevent zoom on input focus */
  font-size: 16px;
}
```

### Dark Theme Integration

The mobile app's dark theme is automatically passed to the WebView:

```javascript
// In web admin, listen for theme updates
document.addEventListener('mobileMessage', (event) => {
  if (event.detail.type === 'THEME_DATA') {
    applyMobileTheme(event.detail.data);
  }
});
```

## 🚨 Error Handling

### Network Errors
- **Connection timeout**: Automatic retry with exponential backoff
- **No internet**: Clear error message with retry option
- **Server errors**: Graceful degradation with offline capabilities

### Authentication Errors
- **Session expired**: Automatic redirect to login
- **Access denied**: Clear messaging with support contact
- **Role changes**: Real-time role validation

### WebView Errors
- **Page load failures**: Fallback to native error screen
- **JavaScript errors**: Isolated error handling
- **Memory issues**: Automatic WebView refresh

## 📊 Performance Optimization

### WebView Optimization
- **Caching**: Enabled for static resources
- **Compression**: GZIP compression for all requests
- **Lazy loading**: Images and non-critical resources
- **Memory management**: Automatic cleanup on navigation

### Network Optimization
- **Request batching**: Multiple API calls combined
- **Response caching**: Intelligent caching strategy
- **Offline support**: Critical data cached locally
- **Progressive loading**: Skeleton screens while loading

## 🧪 Testing

### Unit Tests
```bash
# Run admin-specific tests
npm test -- --testPathPattern=admin

# Test WebView communication
npm test -- --testPathPattern=webView
```

### Integration Tests
```bash
# Test admin flow end-to-end
npm run test:e2e -- --spec=admin

# Test WebView integration
npm run test:integration -- --spec=webview
```

### Manual Testing Checklist

- [ ] Admin access control works correctly
- [ ] WebView loads without errors
- [ ] Authentication tokens are passed correctly
- [ ] Back button navigation works
- [ ] Error states display properly
- [ ] Network connectivity issues handled gracefully
- [ ] Performance is acceptable on low-end devices
- [ ] Memory usage is within acceptable limits

## 🚀 Deployment

### Pre-deployment Checklist

1. **Update Configuration**
   - [ ] Production URLs configured
   - [ ] API endpoints updated
   - [ ] Security settings verified

2. **Security Review**
   - [ ] Authentication flow tested
   - [ ] Role-based access verified
   - [ ] WebView security settings confirmed

3. **Performance Testing**
   - [ ] Load times acceptable
   - [ ] Memory usage optimized
   - [ ] Network requests minimized

4. **Cross-platform Testing**
   - [ ] iOS functionality verified
   - [ ] Android functionality verified
   - [ ] Different screen sizes tested

### Production Deployment

1. **Build the app**:
   ```bash
   eas build --platform all
   ```

2. **Test on staging**:
   ```bash
   eas build --profile staging
   ```

3. **Deploy to stores**:
   ```bash
   eas submit --platform all
   ```

## 🔧 Troubleshooting

### Common Issues

1. **WebView not loading**
   - Check network connectivity
   - Verify production URL is correct
   - Check authentication status

2. **Authentication errors**
   - Verify Firebase configuration
   - Check user role permissions
   - Validate token expiry

3. **Performance issues**
   - Monitor memory usage
   - Check network request frequency
   - Optimize WebView settings

### Debug Mode

Enable debug logging:

```typescript
// In AdminWebView component
const DEBUG = __DEV__;

if (DEBUG) {
  console.log('WebView URL:', fullUrl);
  console.log('User data:', userData);
  console.log('Auth token:', user?.accessToken);
}
```

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review error logs in the console
- Contact the development team with specific error messages and steps to reproduce

## 🔄 Updates & Maintenance

### Regular Maintenance
- Monitor WebView performance metrics
- Update security configurations
- Review and update API endpoints
- Test with new OS versions

### Version Updates
- Update WebView component when React Native updates
- Review and update security policies
- Test compatibility with new devices
- Update documentation as needed