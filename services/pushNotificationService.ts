import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  type: 'booking_confirmed' | 'payment_success' | 'checkin_reminder' | 'booking_cancelled' | 'checkout_thankyou' | 'admin_new_booking' | 'admin_booking_cancelled_by_user' | 'general';
  title: string;
  body: string;
  data?: any;
  userId?: string;
  hotelId?: string;
  bookingId?: string;
}

export interface NotificationTemplate {
  title: string;
  body: string;
  data?: any;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  // Initialize push notifications
  async initialize(userId?: string): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get push token
      console.log('🔄 Getting Expo push token...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'cbf44b03-6026-46ac-b160-5850ec46f1be', // Your EAS project ID
      });

      this.expoPushToken = tokenData.data;
      console.log('📱 Expo Push Token received:', this.expoPushToken);
      
      // Validate token format
      if (!this.expoPushToken || !this.expoPushToken.startsWith('ExponentPushToken[')) {
        console.error('❌ Invalid push token format received');
        return null;
      }

      // Save token to AsyncStorage
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);

      // Save token to Firebase if userId is provided
      if (userId && this.expoPushToken) {
        await this.saveTokenToFirebase(userId, this.expoPushToken);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidNotificationChannel();
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  // Save push token to Firebase user document
  private async saveTokenToFirebase(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushToken: token,
        lastTokenUpdate: serverTimestamp(),
        deviceInfo: {
          platform: Platform.OS,
          deviceName: Device.deviceName,
          osVersion: Device.osVersion,
        }
      });
      console.log('✅ Push token saved to Firebase');
    } catch (error) {
      console.error('Error saving push token to Firebase:', error);
    }
  }

  // Setup Android notification channel
  private async setupAndroidNotificationChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066FF',
      sound: 'default',
    });

    // Booking notifications channel
    await Notifications.setNotificationChannelAsync('booking', {
      name: 'Booking Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C851',
      sound: 'default',
    });

    // Admin notifications channel
    await Notifications.setNotificationChannelAsync('admin', {
      name: 'Admin Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FF4444',
      sound: 'default',
    });
  }

  // Setup notification listeners
  private setupNotificationListeners(): void {
    // Listener for notifications received while app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification received while app is running
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { type, bookingId, hotelId } = notification.request.content.data || {};
    
    // You can add custom logic here based on notification type
    switch (type) {
      case 'booking_confirmed':
        // Maybe update booking status in local state
        break;
      case 'admin_new_booking':
        // Maybe refresh admin dashboard
        break;
      default:
        break;
    }
  }

  // Handle notification response (when user taps notification)
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { type, bookingId, hotelId, screen } = response.notification.request.content.data || {};
    
    // Navigate to appropriate screen based on notification type
    switch (type) {
      case 'booking_confirmed':
      case 'payment_success':
        if (bookingId) {
          // Navigate to booking details
          // You can use your navigation service here
          console.log('Navigate to booking:', bookingId);
        }
        break;
      case 'admin_new_booking':
        if (hotelId) {
          // Navigate to admin dashboard
          console.log('Navigate to admin dashboard:', hotelId);
        }
        break;
      default:
        if (screen) {
          console.log('Navigate to screen:', screen);
        }
        break;
    }
  }

  // Send local notification (for testing or immediate notifications)
  async sendLocalNotification(notification: PushNotificationData): Promise<void> {
    try {
      console.log('📱 Sending local notification:', notification.title);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
      
      console.log('✅ Local notification scheduled:', notificationId);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
      throw error;
    }
  }

  // Send push notification to specific user
  async sendPushNotification(
    targetUserId: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      console.log('📤 Sending push notification to user:', targetUserId);
      
      // Get user's push token from Firebase
      const userRef = doc(db, 'users', targetUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('❌ User not found:', targetUserId);
        return false;
      }

      const userData = userDoc.data();
      const pushToken = userData.expoPushToken;

      if (!pushToken) {
        console.warn('⚠️ No push token found for user:', targetUserId);
        console.log('💡 User data:', { 
          uid: userData.uid, 
          email: userData.email,
          hasToken: !!userData.expoPushToken 
        });
        return false;
      }

      console.log('🎯 Found push token for user, sending notification...');

      // Send notification via Expo Push API
      const success = await this.sendToExpoPushAPI(pushToken, notification);

      // Log notification to Firebase
      if (success) {
        await this.logNotificationToFirebase(targetUserId, notification);
      } else {
        console.error('❌ Failed to send push notification via API');
      }

      return success;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  // Send notification via Expo Push API
  private async sendToExpoPushAPI(
    pushToken: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      // Validate push token format
      if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
        console.error('❌ Invalid push token format:', pushToken);
        return false;
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        channelId: this.getChannelId(notification.type),
        priority: 'high',
      };

      console.log('📤 Sending push notification:', {
        to: pushToken.substring(0, 30) + '...',
        title: message.title,
        body: message.body,
      });

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('📥 Push API Response:', result);
      
      // Handle different response formats
      if (result.data) {
        // Array response format
        const firstResult = Array.isArray(result.data) ? result.data[0] : result.data;
        if (firstResult && firstResult.status === 'ok') {
          console.log('✅ Push notification sent successfully');
          return true;
        } else {
          console.error('❌ Push notification failed:', firstResult);
          return false;
        }
      } else if (result.status === 'ok') {
        // Direct response format
        console.log('✅ Push notification sent successfully');
        return true;
      } else {
        console.error('❌ Push notification failed:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error calling Expo Push API:', error);
      return false;
    }
  }

  // Get appropriate channel ID based on notification type
  private getChannelId(type: string): string {
    switch (type) {
      case 'admin_new_booking':
      case 'admin_booking_cancelled_by_user':
        return 'admin';
      case 'booking_confirmed':
      case 'payment_success':
      case 'checkin_reminder':
      case 'booking_cancelled':
      case 'checkout_thankyou':
        return 'booking';
      default:
        return 'default';
    }
  }

  // Log notification to Firebase for tracking
  private async logNotificationToFirebase(
    userId: string,
    notification: PushNotificationData
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'notificationLogs'), {
        userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        timestamp: serverTimestamp(),
        platform: Platform.OS,
        status: 'sent',
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Send notification to multiple users
  async sendBulkNotifications(
    userIds: string[],
    notification: PushNotificationData
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      const result = await this.sendPushNotification(userId, notification);
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { success, failed };
  }

  // Get notification templates
  getNotificationTemplate(
    type: PushNotificationData['type'],
    data: any
  ): NotificationTemplate {
    switch (type) {
      case 'booking_confirmed':
        return {
          title: '🎉 Booking Confirmed!',
          body: `Your booking at ${data.hotelName} has been confirmed. Check-in: ${data.checkinDate}`,
          data: { bookingId: data.bookingId, hotelId: data.hotelId, screen: 'BookingDetails' }
        };

      case 'payment_success':
        return {
          title: '💳 Payment Successful',
          body: `Payment of ₹${data.amount} received for ${data.hotelName}. Booking confirmed!`,
          data: { bookingId: data.bookingId, hotelId: data.hotelId, screen: 'BookingDetails' }
        };

      case 'checkin_reminder':
        return {
          title: '⏰ Check-in Reminder',
          body: `Don't forget! Your check-in at ${data.hotelName} is tomorrow at ${data.checkinTime}`,
          data: { bookingId: data.bookingId, hotelId: data.hotelId, screen: 'BookingDetails' }
        };

      case 'booking_cancelled':
        return {
          title: '❌ Booking Cancelled',
          body: `Your booking at ${data.hotelName} has been cancelled. Refund will be processed soon.`,
          data: { bookingId: data.bookingId, hotelId: data.hotelId, screen: 'BookingDetails' }
        };

      case 'checkout_thankyou':
        return {
          title: '🙏 Thank You!',
          body: `Thank you for staying at ${data.hotelName}. We hope you had a great experience!`,
          data: { bookingId: data.bookingId, hotelId: data.hotelId, screen: 'ReviewScreen' }
        };

      case 'admin_new_booking':
        return {
          title: '🔔 New Booking Alert',
          body: `New booking received for ${data.hotelName} by ${data.guestName}. Amount: ₹${data.amount}`,
          data: { bookingId: data.bookingId, hotelId: data.hotelId, screen: 'AdminDashboard' }
        };

      case 'admin_booking_cancelled_by_user':
        return {
          title: '⚠️ Booking Cancelled by Guest',
          body: `Booking #${data.bookingId} at ${data.hotelName} was cancelled by ${data.guestName}`,
          data: { bookingId: data.bookingId, hotelId: data.hotelId, screen: 'AdminDashboard' }
        };

      default:
        return {
          title: 'Helpkey Notification',
          body: 'You have a new notification',
          data: {}
        };
    }
  }

  // Schedule notification for later
  async scheduleNotification(
    notification: PushNotificationData,
    triggerDate: Date
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate 
        },
      });

      console.log('📅 Notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('🗑️ Scheduled notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
    }
  }

  // Get current push token
  getCurrentPushToken(): string | null {
    return this.expoPushToken;
  }

  // Cleanup listeners
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;