# 🔔 Expo Push Notifications Setup Guide

This guide explains how to set up and use the comprehensive push notification system in your Helpkey app.

## 📋 Features

- ✅ **Dual Channel Notifications**: Both Push Notifications and WhatsApp
- ✅ **User Notifications**: Booking confirmations, payment success, reminders, etc.
- ✅ **Admin Notifications**: New booking alerts, cancellation alerts
- ✅ **Scheduled Notifications**: Check-in reminders, custom scheduling
- ✅ **Bulk Notifications**: Promotional messages, announcements
- ✅ **Deep Linking**: Navigate to specific screens from notifications
- ✅ **Notification Logging**: Track delivery and engagement
- ✅ **Permission Handling**: Graceful permission requests
- ✅ **Cross-Platform**: iOS and Android support

## 🚀 Quick Start

### 1. Installation (Already Done)

The required packages are already installed:
```json
{
  "expo-notifications": "^0.32.15",
  "expo-device": "^8.0.10"
}
```

### 2. Configuration

The app.json is already configured with notification settings:
```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/notification-icon.png",
        "color": "#0066FF",
        "defaultChannel": "default"
      }
    ]
  ]
}
```

### 3. Basic Usage

```typescript
import { useNotifications } from '@/context/NotificationContext';
import useNotificationHandler from '@/hooks/useNotificationHandler';

const MyComponent = () => {
  const { isNotificationPermissionGranted } = useNotifications();
  const { sendBookingConfirmation } = useNotificationHandler();

  const handleBooking = async (bookingData) => {
    // Send booking confirmation (both push + WhatsApp)
    const success = await sendBookingConfirmation({
      bookingId: 'BK123',
      hotelName: 'Grand Hotel',
      guestName: 'John Doe',
      amount: 2500,
      checkinDate: '2024-12-20',
      // ... other booking data
    });

    if (success) {
      console.log('Notifications sent successfully!');
    }
  };
};
```

## 📱 Notification Types

### User Notifications
- **Booking Confirmed** 🎉: Sent when booking is created
- **Payment Success** 💳: Sent when payment is processed
- **Check-in Reminder** ⏰: Scheduled 1 day before check-in
- **Booking Cancelled** ❌: Sent when booking is cancelled
- **Checkout Thank You** 🙏: Sent after checkout

### Admin Notifications
- **New Booking Alert** 🔔: Sent to hotel admin for new bookings
- **Booking Cancelled by User** ⚠️: Sent when user cancels booking

## 🔧 Implementation Examples

### Complete Booking Flow
```typescript
const { sendCompleteBookingNotifications } = useNotificationHandler();

const handleBookingComplete = async (bookingData) => {
  const success = await sendCompleteBookingNotifications({
    bookingId: bookingData.id,
    hotelId: bookingData.hotelId,
    hotelName: bookingData.hotelName,
    guestName: bookingData.guestName,
    guestPhone: bookingData.guestPhone,
    amount: bookingData.totalAmount,
    checkinDate: bookingData.checkinDate,
    checkoutDate: bookingData.checkoutDate,
    hotelAdmin: bookingData.hotelAdminUserId, // Important!
    hotelAdminPhone: bookingData.hotelAdminPhone,
  });
  
  return success;
};
```

### Admin-Only Notifications
```typescript
const { sendAdminNewBookingAlert } = useNotificationHandler();

const notifyAdminOnly = async (bookingData, adminUserId) => {
  const success = await sendAdminNewBookingAlert(bookingData, {
    adminUserId,
    sendWhatsApp: false, // Only push notification
    sendPush: true,
  });
  
  return success;
};
```

### Scheduled Reminders
```typescript
const { scheduleCheckinReminder } = useNotifications();

const scheduleReminder = async (bookingData) => {
  const checkinDate = new Date(bookingData.checkinDate);
  await scheduleCheckinReminder(bookingData, checkinDate);
};
```

## 🔐 Firebase Setup

### User Document Structure
Ensure your Firebase user documents have the following fields:
```typescript
{
  uid: string,
  fullName: string,
  email: string,
  phoneNumber: string,
  expoPushToken?: string, // Added automatically
  lastTokenUpdate?: Timestamp,
  deviceInfo?: {
    platform: 'ios' | 'android',
    deviceName: string,
    osVersion: string,
  }
}
```

### Hotel Document Structure
Ensure your hotel documents have admin information:
```typescript
{
  id: string,
  name: string,
  hotelAdmin: string, // User ID of hotel admin
  // ... other hotel fields
}
```

## 🧪 Testing

### Development Testing
1. Use the **NotificationTestPanel** component (visible only in development)
2. Test on physical device (notifications don't work in simulator)
3. Check console logs for detailed debugging information

### Test Panel Usage
The test panel is automatically added to the home screen in development mode:
- Test basic notifications
- Test user notification flows
- Test admin notification flows
- Test complete booking flows

### Manual Testing
```typescript
import { pushNotificationService } from '@/services/pushNotificationService';

// Send test notification
await pushNotificationService.sendLocalNotification({
  type: 'general',
  title: 'Test Notification',
  body: 'This is a test!',
});
```

## 🔍 Debugging

### Common Issues

1. **Notifications not received**
   - Check if running on physical device
   - Verify notification permissions are granted
   - Check if push token is generated and saved
   - Verify EAS project ID in app.json

2. **Admin notifications not working**
   - Ensure hotel document has `hotelAdmin` field with valid user ID
   - Verify admin user exists in users collection
   - Check admin user has `expoPushToken` field

3. **Permission denied**
   - Handle gracefully with fallback to WhatsApp only
   - Provide UI to re-request permissions
   - Guide users to enable in device settings

### Debug Logs
The system provides detailed console logs:
```
🔔 Initializing push notifications...
✅ Push notifications initialized successfully
📱 Expo Push Token: ExponentPushToken[xxx]
📨 Notification received: {...}
✅ Push notification sent successfully
```

## 📊 Notification Analytics

### Logging
All notifications are automatically logged to Firebase:
```typescript
// Collection: notificationLogs
{
  userId: string,
  type: string,
  title: string,
  body: string,
  timestamp: Timestamp,
  platform: 'ios' | 'android',
  status: 'sent' | 'failed',
}
```

### Tracking Delivery
Monitor notification delivery in Firebase console and check logs for failed deliveries.

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Test on physical iOS and Android devices
- [ ] Verify notification icons are properly sized
- [ ] Test notification permissions flow
- [ ] Verify deep linking works correctly
- [ ] Test admin notification routing
- [ ] Remove or disable test components
- [ ] Configure proper notification channels
- [ ] Test bulk notification performance

### Performance Considerations
- Notifications are sent with 100ms delays to avoid rate limiting
- Bulk notifications are batched appropriately
- Failed notifications are logged for retry logic
- Push tokens are cached and updated only when necessary

## 🔗 Integration Points

### Booking Flow Integration
```typescript
// In your booking component
const handleBookingSubmit = async (formData) => {
  // 1. Create booking
  const booking = await createBooking(formData);
  
  // 2. Send notifications
  await sendCompleteBookingNotifications(booking);
  
  // 3. Schedule reminders
  await scheduleCheckinReminder(booking);
  
  // 4. Navigate to success
  navigation.navigate('BookingSuccess');
};
```

### Payment Integration
```typescript
// After successful payment
const handlePaymentSuccess = async (paymentData) => {
  await sendPaymentSuccess(bookingData);
};
```

### Cancellation Integration
```typescript
// When user cancels booking
const handleCancellation = async (bookingData) => {
  await sendCompleteCancellationNotifications(bookingData);
};
```

## 📞 Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify Firebase user and hotel document structure
3. Test on physical device with proper permissions
4. Review notification templates and data structure

## 🔄 Updates and Maintenance

### Regular Tasks
- Monitor notification delivery rates
- Update notification templates as needed
- Clean up old notification logs
- Update push tokens for active users
- Review and optimize notification timing

### Version Updates
When updating Expo or notification packages:
1. Test notification functionality thoroughly
2. Verify permission flows still work
3. Check notification channel configurations
4. Test deep linking and navigation