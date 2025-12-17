import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationManager, NotificationEvent } from '../services/notificationManager';

export interface BookingNotificationData {
  bookingId: string;
  hotelId: string;
  hotelName: string;
  guestName: string;
  guestPhone: string;
  amount: number;
  checkinDate: string;
  checkoutDate: string;
  checkinTime?: string;
  roomType?: string;
  nights?: number;
  hotelAdmin?: string; // Admin user ID
  hotelAdminPhone?: string; // Admin phone number
}

export const useNotificationHandler = () => {
  const { user } = useAuth();

  // Send booking confirmation notification
  const sendBookingConfirmation = useCallback(async (bookingData: BookingNotificationData) => {
    try {
      const event: NotificationEvent = {
        type: 'booking_confirmed',
        data: bookingData,
        userId: user?.uid,
        sendPush: true,
        sendWhatsApp: true,
      };

      const success = await notificationManager.handleEvent(event);
      console.log('📧 Booking confirmation sent:', success);
      return success;
    } catch (error) {
      console.error('❌ Error sending booking confirmation:', error);
      return false;
    }
  }, [user?.uid]);

  // Send payment success notification
  const sendPaymentSuccess = useCallback(async (bookingData: BookingNotificationData) => {
    try {
      const event: NotificationEvent = {
        type: 'payment_success',
        data: bookingData,
        userId: user?.uid,
        sendPush: true,
        sendWhatsApp: true,
      };

      const success = await notificationManager.handleEvent(event);
      console.log('💳 Payment success notification sent:', success);
      return success;
    } catch (error) {
      console.error('❌ Error sending payment success notification:', error);
      return false;
    }
  }, [user?.uid]);

  // Send booking cancellation notification
  const sendBookingCancellation = useCallback(async (bookingData: BookingNotificationData) => {
    try {
      const event: NotificationEvent = {
        type: 'booking_cancelled',
        data: bookingData,
        userId: user?.uid,
        sendPush: true,
        sendWhatsApp: true,
      };

      const success = await notificationManager.handleEvent(event);
      console.log('❌ Booking cancellation notification sent:', success);
      return success;
    } catch (error) {
      console.error('❌ Error sending booking cancellation notification:', error);
      return false;
    }
  }, [user?.uid]);

  // Send check-in reminder notification
  const sendCheckinReminder = useCallback(async (bookingData: BookingNotificationData) => {
    try {
      const event: NotificationEvent = {
        type: 'checkin_reminder',
        data: bookingData,
        userId: user?.uid,
        sendPush: true,
        sendWhatsApp: true,
      };

      const success = await notificationManager.handleEvent(event);
      console.log('⏰ Check-in reminder sent:', success);
      return success;
    } catch (error) {
      console.error('❌ Error sending check-in reminder:', error);
      return false;
    }
  }, [user?.uid]);

  // Send checkout thank you notification
  const sendCheckoutThankYou = useCallback(async (bookingData: BookingNotificationData) => {
    try {
      const event: NotificationEvent = {
        type: 'checkout_thankyou',
        data: bookingData,
        userId: user?.uid,
        sendPush: true,
        sendWhatsApp: true,
      };

      const success = await notificationManager.handleEvent(event);
      console.log('🙏 Checkout thank you notification sent:', success);
      return success;
    } catch (error) {
      console.error('❌ Error sending checkout thank you notification:', error);
      return false;
    }
  }, [user?.uid]);

  // Send admin new booking alert
  const sendAdminNewBookingAlert = useCallback(async (
    bookingData: BookingNotificationData,
    options?: {
      adminPhone?: string;
      adminUserId?: string;
      sendPush?: boolean;
      sendWhatsApp?: boolean;
    }
  ) => {
    try {
      const event: NotificationEvent = {
        type: 'admin_new_booking',
        data: bookingData,
        adminPhone: options?.adminPhone || bookingData.hotelAdminPhone,
        adminUserId: options?.adminUserId || bookingData.hotelAdmin,
        sendPush: options?.sendPush !== false,
        sendWhatsApp: options?.sendWhatsApp !== false,
      };

      const success = await notificationManager.handleEvent(event);
      console.log('🔔 Admin new booking alert sent:', success);
      return success;
    } catch (error) {
      console.error('❌ Error sending admin new booking alert:', error);
      return false;
    }
  }, []);

  // Send admin booking cancelled by user alert
  const sendAdminBookingCancelledAlert = useCallback(async (
    bookingData: BookingNotificationData,
    options?: {
      adminPhone?: string;
      adminUserId?: string;
      sendPush?: boolean;
      sendWhatsApp?: boolean;
    }
  ) => {
    try {
      const event: NotificationEvent = {
        type: 'admin_booking_cancelled_by_user',
        data: bookingData,
        adminPhone: options?.adminPhone || bookingData.hotelAdminPhone,
        adminUserId: options?.adminUserId || bookingData.hotelAdmin,
        sendPush: options?.sendPush !== false,
        sendWhatsApp: options?.sendWhatsApp !== false,
      };

      const success = await notificationManager.handleEvent(event);
      console.log('⚠️ Admin booking cancelled alert sent:', success);
      return success;
    } catch (error) {
      console.error('❌ Error sending admin booking cancelled alert:', error);
      return false;
    }
  }, []);

  // Send complete booking flow notifications (booking + admin alert)
  const sendCompleteBookingNotifications = useCallback(async (
    bookingData: BookingNotificationData,
    options?: {
      skipAdminNotification?: boolean;
      adminPhone?: string;
      adminUserId?: string;
    }
  ) => {
    try {
      // Send user booking confirmation
      const userSuccess = await sendBookingConfirmation(bookingData);

      // Send admin new booking alert (unless skipped)
      let adminSuccess = true;
      if (!options?.skipAdminNotification) {
        adminSuccess = await sendAdminNewBookingAlert(bookingData, {
          adminPhone: options?.adminPhone,
          adminUserId: options?.adminUserId,
        });
      }

      const overallSuccess = userSuccess && adminSuccess;
      console.log('📋 Complete booking notifications sent:', overallSuccess);
      return overallSuccess;
    } catch (error) {
      console.error('❌ Error sending complete booking notifications:', error);
      return false;
    }
  }, [sendBookingConfirmation, sendAdminNewBookingAlert]);

  // Send complete cancellation flow notifications (user + admin alert)
  const sendCompleteCancellationNotifications = useCallback(async (
    bookingData: BookingNotificationData,
    options?: {
      skipAdminNotification?: boolean;
      adminPhone?: string;
      adminUserId?: string;
    }
  ) => {
    try {
      // Send user cancellation notification
      const userSuccess = await sendBookingCancellation(bookingData);

      // Send admin cancellation alert (unless skipped)
      let adminSuccess = true;
      if (!options?.skipAdminNotification) {
        adminSuccess = await sendAdminBookingCancelledAlert(bookingData, {
          adminPhone: options?.adminPhone,
          adminUserId: options?.adminUserId,
        });
      }

      const overallSuccess = userSuccess && adminSuccess;
      console.log('📋 Complete cancellation notifications sent:', overallSuccess);
      return overallSuccess;
    } catch (error) {
      console.error('❌ Error sending complete cancellation notifications:', error);
      return false;
    }
  }, [sendBookingCancellation, sendAdminBookingCancelledAlert]);

  return {
    // Individual notification methods
    sendBookingConfirmation,
    sendPaymentSuccess,
    sendBookingCancellation,
    sendCheckinReminder,
    sendCheckoutThankYou,
    sendAdminNewBookingAlert,
    sendAdminBookingCancelledAlert,
    
    // Complete flow methods
    sendCompleteBookingNotifications,
    sendCompleteCancellationNotifications,
  };
};

export default useNotificationHandler;