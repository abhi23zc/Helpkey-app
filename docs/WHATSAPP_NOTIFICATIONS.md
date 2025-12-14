# 📱 WhatsApp Notification System

This document explains how to use the WhatsApp notification system integrated with your MsgZone platform.

## 🚀 Features

- **Automated Notifications**: Send WhatsApp messages for various booking events
- **Multiple Event Types**: Booking confirmations, payment success, reminders, etc.
- **Admin Notifications**: Notify hotel admins about new bookings
- **Custom Messages**: Send custom WhatsApp messages
- **Bulk Messaging**: Send messages to multiple recipients
- **Error Handling**: Robust error handling and retry mechanisms

## 📋 Available Notification Types

### 1. Booking Confirmation (`booking_confirmed`)
- Sent when a booking is successfully created
- Includes hotel details, room info, dates, and special requests
- Automatically notifies admins as well

### 2. Payment Success (`payment_success`)
- Sent when online payment is completed
- Includes payment ID and booking details

### 3. Check-in Reminder (`checkin_reminder`)
- Sent 24 hours before check-in (configurable)
- Includes what to bring and booking details

### 4. Booking Cancellation (`booking_cancelled`)
- Sent when a booking is cancelled
- Includes cancellation reason if provided

### 5. Check-out Thank You (`checkout_thankyou`)
- Sent after check-out
- Includes review request and special offers

### 6. Admin New Booking Alert (`admin_new_booking`)
- Sent to hotel admins for new bookings
- Includes guest details and special requests

## 🛠️ Implementation

### Basic Usage

```typescript
import { useNotifications } from '@/hooks/useNotifications';

const { sendNotification } = useNotifications();

// Send booking confirmation
await sendNotification({
  type: 'booking_confirmed',
  data: {
    hotelName: 'Grand Hotel',
    roomType: 'Deluxe Room',
    guestName: 'John Doe',
    checkIn: 'Monday, Dec 11, 2024, 02:00 PM',
    checkOut: 'Tuesday, Dec 12, 2024, 11:00 AM',
    totalAmount: 2500,
    bookingId: 'BK123456',
    guestPhone: '916389055071',
    nights: 1,
    guests: 2,
    additionalRequests: 'Early check-in'
  }
});
```

### Direct Service Usage

```typescript
import whatsappNotificationService from '@/services/whatsappNotification';

// Send custom message
await whatsappNotificationService.sendCustomMessage(
  '916389055071',
  'Hello! Your booking is confirmed.'
);
```

## ⚙️ Configuration

### API Configuration
Located in `config/notifications.ts`:

```typescript
export const NOTIFICATION_CONFIG = {
  whatsapp: {
    apiKey: 'dev_a4682328eef2',
    baseUrl: 'https://api.webifyit.in/api/v1/dev/create-message',
    timeout: 10000,
  },
  adminPhones: [
    '916389055071', // Primary admin
  ],
  settings: {
    enableGuestNotifications: true,
    enableAdminNotifications: true,
    checkinReminderHours: 24,
  }
};
```

### Environment Variables
You can override settings based on environment:

```typescript
const isDevelopment = __DEV__;
if (isDevelopment) {
  // Disable admin notifications in development
  config.settings.enableAdminNotifications = false;
}
```

## 🧪 Testing

### Using the Admin Panel
1. Navigate to `/admin/notifications`
2. Enter a phone number (with country code)
3. Select notification type
4. Send test notification

### Manual Testing
```typescript
import { notificationManager } from '@/services/notificationManager';

// Test booking notification
await notificationManager.handleEvent({
  type: 'booking_confirmed',
  data: testBookingData
});
```

## 📱 Message Templates

### Booking Confirmation Template
```
🎉 *Booking Confirmed!*

Dear John Doe,

Your booking has been confirmed! Here are the details:

🏨 *Hotel:* Grand Hotel
🛏️ *Room:* Deluxe Room
📅 *Check-in:* Monday, Dec 11, 2024, 02:00 PM
📅 *Check-out:* Tuesday, Dec 12, 2024, 11:00 AM
👥 *Guests:* 2
🌙 *Nights:* 1
💰 *Total Amount:* ₹2500
🆔 *Booking ID:* BK123456

📝 *Special Requests:* Early check-in

Thank you for choosing us! We look forward to hosting you.

*Helpkey Team* 🏨✨
```

## 🔧 Integration Points

### 1. Payment Screen Integration
The notification system is already integrated into:
- `app/hotel/payment.tsx` - Sends notifications after successful booking/payment

### 2. Booking Service Integration
Add to your booking service:
```typescript
import { notificationManager } from '@/services/notificationManager';

// After creating booking
await notificationManager.handleEvent({
  type: 'booking_confirmed',
  data: bookingData
});
```

### 3. Scheduled Notifications
For check-in reminders:
```typescript
// Schedule reminder 24 hours before check-in
await notificationManager.scheduleCheckinReminder(
  bookingData,
  new Date(checkInDate)
);
```

## 🚨 Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const success = await sendNotification(event);
  if (!success) {
    console.error('Notification failed');
  }
} catch (error) {
  console.error('Notification error:', error);
  // Don't block main process
}
```

## 📊 Monitoring

### Success/Failure Tracking
```typescript
const result = await whatsappNotificationService.sendBulkMessage(
  phoneNumbers,
  message
);
console.log(`Success: ${result.success}, Failed: ${result.failed}`);
```

### Logging
All notifications are logged with:
- Success/failure status
- Phone numbers
- Message content (truncated)
- Error details

## 🔐 Security Considerations

1. **Phone Number Validation**: Always validate phone numbers before sending
2. **Rate Limiting**: Built-in delays prevent API rate limiting
3. **Error Handling**: Failures don't block main application flow
4. **Admin Controls**: Separate admin phone list management

## 🚀 Future Enhancements

1. **Message Templates**: Customizable message templates
2. **Scheduling**: Advanced scheduling for different time zones
3. **Analytics**: Delivery reports and analytics
4. **Multi-language**: Support for multiple languages
5. **Rich Media**: Support for images and documents

## 📞 API Reference

### MsgZone API Endpoint
```
GET https://api.webifyit.in/api/v1/dev/create-message
Parameters:
- apikey: dev_a4682328eef2
- to: 916389055071 (phone number with country code)
- message: [URL encoded message content]
```

### Response Format
```json
{
  "status": true,
  "message": "Message Sent Successfully",
  "data": null
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Message Not Delivered**
   - Check phone number format (include country code)
   - Verify API key is correct
   - Check network connectivity

2. **API Rate Limiting**
   - Built-in delays should prevent this
   - Reduce bulk message frequency if needed

3. **Invalid Phone Numbers**
   - Ensure format: country code + number (e.g., 916389055071)
   - No spaces, dashes, or special characters

### Debug Mode
Enable detailed logging:
```typescript
console.log('Sending notification:', notificationData);
```

## 📝 License

This notification system is part of the Helpkey application and follows the same licensing terms.