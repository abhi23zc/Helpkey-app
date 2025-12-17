import whatsappNotificationService from './whatsappNotification';
import { getAdminPhoneWithFallback } from '../utils/adminPhoneResolver';
import pushNotificationService, { PushNotificationData } from './pushNotificationService';

export interface NotificationEvent {
  type: 'booking_confirmed' | 'payment_success' | 'checkin_reminder' | 'booking_cancelled' | 'checkout_thankyou' | 'admin_new_booking' | 'admin_booking_cancelled_by_user';
  data: any;
  adminPhone?: string; // Specific hotel admin phone
  userId?: string; // User ID for push notifications
  adminUserId?: string; // Admin user ID for push notifications
  sendPush?: boolean; // Whether to send push notification (default: true)
  sendWhatsApp?: boolean; // Whether to send WhatsApp notification (default: true)
}

class NotificationManager {
  // Global admin phones (for system-wide notifications, if needed)
  private globalAdminPhones: string[] = [
    '916389055071', // System admin phone (for emergencies/system issues)
  ];

  async handleEvent(event: NotificationEvent): Promise<boolean> {
    try {
      const sendPush = event.sendPush !== false; // Default to true
      const sendWhatsApp = event.sendWhatsApp !== false; // Default to true

      switch (event.type) {
        case 'booking_confirmed':
          return await this.handleBookingConfirmed(event.data, event.userId, sendPush, sendWhatsApp);
        
        case 'payment_success':
          return await this.handlePaymentSuccess(event.data, event.userId, sendPush, sendWhatsApp);
        
        case 'checkin_reminder':
          return await this.handleCheckinReminder(event.data, event.userId, sendPush, sendWhatsApp);
        
        case 'booking_cancelled':
          return await this.handleBookingCancelled(event.data, event.userId, sendPush, sendWhatsApp);
        
        case 'checkout_thankyou':
          return await this.handleCheckoutThankYou(event.data, event.userId, sendPush, sendWhatsApp);
        
        case 'admin_new_booking':
          return await this.handleAdminNewBooking(event.data, event.adminPhone, event.adminUserId, sendPush, sendWhatsApp);
        
        case 'admin_booking_cancelled_by_user':
          return await this.handleAdminBookingCancelledByUser(event.data, event.adminPhone, event.adminUserId, sendPush, sendWhatsApp);
        
        default:
          console.warn('Unknown notification event type:', event.type);
          return false;
      }
    } catch (error) {
      console.error('Error handling notification event:', error);
      return false;
    }
  }

  private async handleBookingConfirmed(data: any, userId?: string, sendPush = true, sendWhatsApp = true): Promise<boolean> {
    let whatsappSuccess = true;
    let pushSuccess = true;

    // Send WhatsApp notification to guest
    if (sendWhatsApp) {
      whatsappSuccess = await whatsappNotificationService.sendBookingConfirmation(data);
    }

    // Send push notification to guest
    if (sendPush && userId) {
      const template = pushNotificationService.getNotificationTemplate('booking_confirmed', data);
      pushSuccess = await pushNotificationService.sendPushNotification(userId, {
        type: 'booking_confirmed',
        title: template.title,
        body: template.body,
        data: template.data,
        userId,
        hotelId: data.hotelId,
        bookingId: data.bookingId,
      });
    }

    // Note: Hotel admin notification is handled separately via 'admin_new_booking' event
    return whatsappSuccess && pushSuccess;
  }

  private async handlePaymentSuccess(data: any, userId?: string, sendPush = true, sendWhatsApp = true): Promise<boolean> {
    let whatsappSuccess = true;
    let pushSuccess = true;

    // Send WhatsApp notification
    if (sendWhatsApp) {
      whatsappSuccess = await whatsappNotificationService.sendPaymentSuccess(data);
    }

    // Send push notification
    if (sendPush && userId) {
      const template = pushNotificationService.getNotificationTemplate('payment_success', data);
      pushSuccess = await pushNotificationService.sendPushNotification(userId, {
        type: 'payment_success',
        title: template.title,
        body: template.body,
        data: template.data,
        userId,
        hotelId: data.hotelId,
        bookingId: data.bookingId,
      });
    }

    return whatsappSuccess && pushSuccess;
  }

  private async handleCheckinReminder(data: any, userId?: string, sendPush = true, sendWhatsApp = true): Promise<boolean> {
    let whatsappSuccess = true;
    let pushSuccess = true;

    // Send WhatsApp notification
    if (sendWhatsApp) {
      whatsappSuccess = await whatsappNotificationService.sendCheckinReminder(data);
    }

    // Send push notification
    if (sendPush && userId) {
      const template = pushNotificationService.getNotificationTemplate('checkin_reminder', data);
      pushSuccess = await pushNotificationService.sendPushNotification(userId, {
        type: 'checkin_reminder',
        title: template.title,
        body: template.body,
        data: template.data,
        userId,
        hotelId: data.hotelId,
        bookingId: data.bookingId,
      });
    }

    return whatsappSuccess && pushSuccess;
  }

  private async handleBookingCancelled(data: any, userId?: string, sendPush = true, sendWhatsApp = true): Promise<boolean> {
    let whatsappSuccess = true;
    let pushSuccess = true;

    // Send WhatsApp notification
    if (sendWhatsApp) {
      whatsappSuccess = await whatsappNotificationService.sendBookingCancellation(data);
    }

    // Send push notification
    if (sendPush && userId) {
      const template = pushNotificationService.getNotificationTemplate('booking_cancelled', data);
      pushSuccess = await pushNotificationService.sendPushNotification(userId, {
        type: 'booking_cancelled',
        title: template.title,
        body: template.body,
        data: template.data,
        userId,
        hotelId: data.hotelId,
        bookingId: data.bookingId,
      });
    }

    return whatsappSuccess && pushSuccess;
  }

  private async handleCheckoutThankYou(data: any, userId?: string, sendPush = true, sendWhatsApp = true): Promise<boolean> {
    let whatsappSuccess = true;
    let pushSuccess = true;

    // Send WhatsApp notification
    if (sendWhatsApp) {
      whatsappSuccess = await whatsappNotificationService.sendCheckoutThankYou(data);
    }

    // Send push notification
    if (sendPush && userId) {
      const template = pushNotificationService.getNotificationTemplate('checkout_thankyou', data);
      pushSuccess = await pushNotificationService.sendPushNotification(userId, {
        type: 'checkout_thankyou',
        title: template.title,
        body: template.body,
        data: template.data,
        userId,
        hotelId: data.hotelId,
        bookingId: data.bookingId,
      });
    }

    return whatsappSuccess && pushSuccess;
  }

  private async handleAdminNewBooking(data: any, adminPhone?: string, adminUserId?: string, sendPush = true, sendWhatsApp = true): Promise<boolean> {
    // If admin phone is explicitly provided, use it directly
    if (adminPhone) {
      console.log('📱 Using explicitly provided admin phone:', adminPhone);
      
      let whatsappSuccess = true;
      let pushSuccess = true;

      // Send WhatsApp notification
      if (sendWhatsApp) {
        whatsappSuccess = await whatsappNotificationService.sendAdminNewBookingAlert(data, adminPhone);
      }

      // Send push notification if admin user ID is provided
      if (sendPush && adminUserId) {
        const template = pushNotificationService.getNotificationTemplate('admin_new_booking', data);
        pushSuccess = await pushNotificationService.sendPushNotification(adminUserId, {
          type: 'admin_new_booking',
          title: template.title,
          body: template.body,
          data: template.data,
          userId: adminUserId,
          hotelId: data.hotelId,
          bookingId: data.bookingId,
        });
      }

      return whatsappSuccess && pushSuccess;
    }

    // If hotelAdminPhone is provided in data, use it
    if (data.hotelAdminPhone) {
      console.log('📱 Using admin phone from data:', data.hotelAdminPhone);
      
      let whatsappSuccess = true;
      let pushSuccess = true;

      // Send WhatsApp notification
      if (sendWhatsApp) {
        whatsappSuccess = await whatsappNotificationService.sendAdminNewBookingAlert(data, data.hotelAdminPhone);
      }

      // Send push notification if admin user ID is provided
      if (sendPush && adminUserId) {
        const template = pushNotificationService.getNotificationTemplate('admin_new_booking', data);
        pushSuccess = await pushNotificationService.sendPushNotification(adminUserId, {
          type: 'admin_new_booking',
          title: template.title,
          body: template.body,
          data: template.data,
          userId: adminUserId,
          hotelId: data.hotelId,
          bookingId: data.bookingId,
        });
      }

      return whatsappSuccess && pushSuccess;
    }

    // Fetch admin phone from users collection using hotelId or hotelAdmin ID
    console.log('🔍 Resolving admin phone from database...');
    console.log('� Avaiilable data:', {
      hotelId: data.hotelId,
      hotelName: data.hotelName,
      hotelAdmin: data.hotelAdmin
    });

    try {
      const adminPhoneResult = await getAdminPhoneWithFallback(
        data.hotelId,     // Hotel ID to lookup hotel admin
        data.hotelAdmin,  // Direct admin user ID if available
        ['0TgS3HwbSzMsyCOJQBf9sGB75it1'] // System admin fallback (your super-admin ID)
      );

      if (!adminPhoneResult.success) {
        console.error('❌ Failed to resolve admin phone:', adminPhoneResult.error);
        console.error('💡 Make sure hotel document has hotelAdmin field with valid user ID');
        console.error('💡 Or ensure the admin user exists in users collection with phoneNumber field');
        return false;
      }

      const targetPhone = adminPhoneResult.formattedPhone!;
      const resolvedAdminUserId = adminPhoneResult.adminData?.id || adminUserId;
      
      console.log('✅ Admin phone resolved successfully:', targetPhone);
      console.log('👤 Admin details:', {
        name: adminPhoneResult.adminData?.fullName,
        email: adminPhoneResult.adminData?.email,
        role: adminPhoneResult.adminData?.role,
        userId: resolvedAdminUserId
      });

      let whatsappSuccess = true;
      let pushSuccess = true;

      // Send WhatsApp notification
      if (sendWhatsApp) {
        whatsappSuccess = await whatsappNotificationService.sendAdminNewBookingAlert(data, targetPhone);
      }

      // Send push notification
      if (sendPush && resolvedAdminUserId) {
        const template = pushNotificationService.getNotificationTemplate('admin_new_booking', data);
        pushSuccess = await pushNotificationService.sendPushNotification(resolvedAdminUserId, {
          type: 'admin_new_booking',
          title: template.title,
          body: template.body,
          data: template.data,
          userId: resolvedAdminUserId,
          hotelId: data.hotelId,
          bookingId: data.bookingId,
        });
      }

      return whatsappSuccess && pushSuccess;

    } catch (error) {
      console.error('❌ Error resolving admin phone:', error);
      return false;
    }
  }



  // Schedule reminder notifications (this would typically be handled by a background service)
  async scheduleCheckinReminder(bookingData: any, checkinDate: Date): Promise<void> {
    const reminderDate = new Date(checkinDate);
    reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before
    reminderDate.setHours(10, 0, 0, 0); // 10 AM

    const now = new Date();
    const timeUntilReminder = reminderDate.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      setTimeout(async () => {
        await this.handleEvent({
          type: 'checkin_reminder',
          data: bookingData
        });
      }, timeUntilReminder);
    }
  }

  private async handleAdminBookingCancelledByUser(data: any, adminPhone?: string, adminUserId?: string, sendPush = true, sendWhatsApp = true): Promise<boolean> {
    // If admin phone is explicitly provided, use it directly
    if (adminPhone) {
      console.log('📱 Using explicitly provided admin phone for user cancellation:', adminPhone);
      
      let whatsappSuccess = true;
      let pushSuccess = true;

      // Send WhatsApp notification
      if (sendWhatsApp) {
        whatsappSuccess = await whatsappNotificationService.sendAdminBookingCancelledByUser(data, adminPhone);
      }

      // Send push notification if admin user ID is provided
      if (sendPush && adminUserId) {
        const template = pushNotificationService.getNotificationTemplate('admin_booking_cancelled_by_user', data);
        pushSuccess = await pushNotificationService.sendPushNotification(adminUserId, {
          type: 'admin_booking_cancelled_by_user',
          title: template.title,
          body: template.body,
          data: template.data,
          userId: adminUserId,
          hotelId: data.hotelId,
          bookingId: data.bookingId,
        });
      }

      return whatsappSuccess && pushSuccess;
    }

    // If hotelAdminPhone is provided in data, use it
    if (data.hotelAdminPhone) {
      console.log('📱 Using admin phone from data for user cancellation:', data.hotelAdminPhone);
      
      let whatsappSuccess = true;
      let pushSuccess = true;

      // Send WhatsApp notification
      if (sendWhatsApp) {
        whatsappSuccess = await whatsappNotificationService.sendAdminBookingCancelledByUser(data, data.hotelAdminPhone);
      }

      // Send push notification if admin user ID is provided
      if (sendPush && adminUserId) {
        const template = pushNotificationService.getNotificationTemplate('admin_booking_cancelled_by_user', data);
        pushSuccess = await pushNotificationService.sendPushNotification(adminUserId, {
          type: 'admin_booking_cancelled_by_user',
          title: template.title,
          body: template.body,
          data: template.data,
          userId: adminUserId,
          hotelId: data.hotelId,
          bookingId: data.bookingId,
        });
      }

      return whatsappSuccess && pushSuccess;
    }

    // Fetch admin phone from users collection using hotelId or hotelAdmin ID
    console.log('🔍 Resolving admin phone for user cancellation notification...');
    console.log('📊 Available data:', {
      hotelId: data.hotelId,
      hotelName: data.hotelName,
      hotelAdmin: data.hotelAdmin
    });

    try {
      const adminPhoneResult = await getAdminPhoneWithFallback(
        data.hotelId,     // Hotel ID to lookup hotel admin
        data.hotelAdmin,  // Direct admin user ID if available
        ['0TgS3HwbSzMsyCOJQBf9sGB75it1'] // System admin fallback (your super-admin ID)
      );

      if (!adminPhoneResult.success) {
        console.error('❌ Failed to resolve admin phone for user cancellation:', adminPhoneResult.error);
        return false;
      }

      const targetPhone = adminPhoneResult.formattedPhone!;
      const resolvedAdminUserId = adminPhoneResult.adminData?.id || adminUserId;
      
      console.log('✅ Admin phone resolved for user cancellation:', targetPhone);

      let whatsappSuccess = true;
      let pushSuccess = true;

      // Send WhatsApp notification
      if (sendWhatsApp) {
        whatsappSuccess = await whatsappNotificationService.sendAdminBookingCancelledByUser(data, targetPhone);
      }

      // Send push notification
      if (sendPush && resolvedAdminUserId) {
        const template = pushNotificationService.getNotificationTemplate('admin_booking_cancelled_by_user', data);
        pushSuccess = await pushNotificationService.sendPushNotification(resolvedAdminUserId, {
          type: 'admin_booking_cancelled_by_user',
          title: template.title,
          body: template.body,
          data: template.data,
          userId: resolvedAdminUserId,
          hotelId: data.hotelId,
          bookingId: data.bookingId,
        });
      }

      return whatsappSuccess && pushSuccess;

    } catch (error) {
      console.error('❌ Error resolving admin phone for user cancellation:', error);
      return false;
    }
  }

  // Add global admin phone numbers (for system admins)
  addGlobalAdminPhone(phone: string): void {
    if (!this.globalAdminPhones.includes(phone)) {
      this.globalAdminPhones.push(phone);
    }
  }

  // Remove global admin phone numbers
  removeGlobalAdminPhone(phone: string): void {
    this.globalAdminPhones = this.globalAdminPhones.filter(p => p !== phone);
  }

  // Get current global admin phones
  getGlobalAdminPhones(): string[] {
    return [...this.globalAdminPhones];
  }

  // Validate hotel admin phone from hotel data
  validateHotelAdminPhone(hotelData: any): { isValid: boolean; phone?: string; error?: string } {
    const hotelAdminPhone = hotelData?.hotelAdmin;
    
    if (!hotelAdminPhone) {
      return {
        isValid: false,
        error: `No hotel admin phone found for hotel: ${hotelData?.name || 'Unknown'} (ID: ${hotelData?.id || 'Unknown'})`
      };
    }

    // Use phone validation utility
    const validation = require('../utils/phoneValidation').default.validateAndFormat(hotelAdminPhone);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        phone: hotelAdminPhone,
        error: `Invalid hotel admin phone for ${hotelData?.name || 'Unknown'}: ${validation.error}`
      };
    }

    return {
      isValid: true,
      phone: validation.formattedNumber
    };
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
export default notificationManager;