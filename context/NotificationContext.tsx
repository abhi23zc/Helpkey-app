import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import pushNotificationService from '../services/pushNotificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isNotificationPermissionGranted: boolean;
  initializeNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<boolean>;
  scheduleCheckinReminder: (bookingData: any, checkinDate: Date) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState(false);

  // Initialize notifications when user is available
  useEffect(() => {
    if (user?.uid) {
      initializeNotifications();
    }
  }, [user?.uid]);

  const initializeNotifications = async (): Promise<void> => {
    try {
      console.log('🔔 Initializing push notifications...');
      
      // Initialize push notification service
      const token = await pushNotificationService.initialize(user?.uid);
      
      if (token) {
        setExpoPushToken(token);
        setIsNotificationPermissionGranted(true);
        console.log('✅ Push notifications initialized successfully');
      } else {
        console.warn('⚠️ Push notifications not available');
        setIsNotificationPermissionGranted(false);
      }

      // Set up notification listener
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('📨 Notification received in context:', notification);
        setNotification(notification);
      });

      // Note: Cleanup is handled in useEffect cleanup
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
      setIsNotificationPermissionGranted(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      if (!isNotificationPermissionGranted) {
        throw new Error('Notification permission not granted');
      }

      await pushNotificationService.sendLocalNotification({
        type: 'general',
        title: '🎉 Test Notification',
        body: 'This is a test notification from Helpkey!',
        data: { test: true },
      });

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  };

  const scheduleCheckinReminder = async (bookingData: any, checkinDate: Date) => {
    try {
      if (!isNotificationPermissionGranted) {
        console.warn('Notifications not permitted for reminder');
        return;
      }

      // Schedule reminder 1 day before check-in at 10 AM
      const reminderDate = new Date(checkinDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(10, 0, 0, 0);

      // Only schedule if the reminder date is in the future
      if (reminderDate > new Date()) {
        const template = pushNotificationService.getNotificationTemplate('checkin_reminder', bookingData);
        
        await pushNotificationService.scheduleNotification(
          {
            type: 'checkin_reminder',
            title: template.title,
            body: template.body,
            data: template.data,
            userId: user?.uid,
            hotelId: bookingData.hotelId,
            bookingId: bookingData.bookingId,
          },
          reminderDate
        );

        console.log('📅 Check-in reminder scheduled for:', reminderDate);
      } else {
        console.log('⏰ Check-in is too soon, no reminder scheduled');
      }
    } catch (error) {
      console.error('❌ Error scheduling check-in reminder:', error);
    }
  };

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    isNotificationPermissionGranted,
    initializeNotifications,
    sendTestNotification,
    scheduleCheckinReminder,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;