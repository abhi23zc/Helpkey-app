// Test script for mobile app booking cancellation notifications
// Run this in React Native debugger console or add to a test component

import notificationManager from './services/notificationManager';

async function testMobileCancellationNotification() {
  console.log('🧪 Testing mobile app cancellation notification...');
  
  const testBookingData = {
    guestName: 'Test Mobile User',
    guestPhone: '919876543210',
    hotelName: 'Test Mobile Hotel',
    roomType: 'Test Mobile Room',
    checkIn: 'Tomorrow, 2:00 PM',
    checkOut: 'Day after tomorrow, 11:00 AM',
    bookingId: 'MOBILE_TEST_123',
    totalAmount: 1500,
    nights: 1,
    guests: 2,
    hotelId: 'test_hotel_id',
    hotelAdmin: '0TgS3HwbSzMsyCOJQBf9sGB75it1', // Your admin ID
    reason: 'Testing mobile app cancellation'
  };

  try {
    const success = await notificationManager.handleEvent({
      type: 'admin_booking_cancelled_by_user',
      data: testBookingData
    });

    if (success) {
      console.log('✅ Mobile cancellation notification test successful!');
      return 'Test passed - Admin should receive WhatsApp notification';
    } else {
      console.error('❌ Mobile cancellation notification test failed');
      return 'Test failed - Check console for errors';
    }

  } catch (error) {
    console.error('💥 Error during mobile test:', error);
    return `Test error: ${error.message}`;
  }
}

// Export for use in components
export { testMobileCancellationNotification };

// Usage in a React Native component:
/*
import { testMobileCancellationNotification } from './test-mobile-cancellation';

// In your component
const handleTestCancellation = async () => {
  const result = await testMobileCancellationNotification();
  Alert.alert('Test Result', result);
};
*/