import whatsappNotificationService from './whatsappNotification';
import { getAdminPhoneWithFallback } from '../utils/adminPhoneResolver';

export interface NotificationEvent {
  type: 'booking_confirmed' | 'payment_success' | 'checkin_reminder' | 'booking_cancelled' | 'checkout_thankyou' | 'admin_new_booking' | 'admin_booking_cancelled_by_user';
  data: any;
  adminPhone?: string; // Specific hotel admin phone
}

class NotificationManager {
  // Global admin phones (for system-wide notifications, if needed)
  private globalAdminPhones: string[] = [
    '916389055071', // System admin phone (for emergencies/system issues)
  ];

  async handleEvent(event: NotificationEvent): Promise<boolean> {
    try {
      switch (event.type) {
        case 'booking_confirmed':
          return await this.handleBookingConfirmed(event.data);
        
        case 'payment_success':
          return await this.handlePaymentSuccess(event.data);
        
        case 'checkin_reminder':
          return await this.handleCheckinReminder(event.data);
        
        case 'booking_cancelled':
          return await this.handleBookingCancelled(event.data);
        
        case 'checkout_thankyou':
          return await this.handleCheckoutThankYou(event.data);
        
        case 'admin_new_booking':
          return await this.handleAdminNewBooking(event.data, event.adminPhone);
        
        case 'admin_booking_cancelled_by_user':
          return await this.handleAdminBookingCancelledByUser(event.data, event.adminPhone);
        
        default:
          console.warn('Unknown notification event type:', event.type);
          return false;
      }
    } catch (error) {
      console.error('Error handling notification event:', error);
      return false;
    }
  }

  private async handleBookingConfirmed(data: any): Promise<boolean> {
    // Send booking confirmation to guest
    const success = await whatsappNotificationService.sendBookingConfirmation(data);
    
    // Note: Hotel admin notification is handled separately via 'admin_new_booking' event
    // This allows for better control over when and how admin notifications are sent
    
    return success;
  }

  private async handlePaymentSuccess(data: any): Promise<boolean> {
    return await whatsappNotificationService.sendPaymentSuccess(data);
  }

  private async handleCheckinReminder(data: any): Promise<boolean> {
    return await whatsappNotificationService.sendCheckinReminder(data);
  }

  private async handleBookingCancelled(data: any): Promise<boolean> {
    return await whatsappNotificationService.sendBookingCancellation(data);
  }

  private async handleCheckoutThankYou(data: any): Promise<boolean> {
    return await whatsappNotificationService.sendCheckoutThankYou(data);
  }

  private async handleAdminNewBooking(data: any, adminPhone?: string): Promise<boolean> {
    // If admin phone is explicitly provided, use it directly
    if (adminPhone) {
      console.log('📱 Using explicitly provided admin phone:', adminPhone);
      return await whatsappNotificationService.sendAdminNewBookingAlert(data, adminPhone);
    }

    // If hotelAdminPhone is provided in data, use it
    if (data.hotelAdminPhone) {
      console.log('📱 Using admin phone from data:', data.hotelAdminPhone);
      return await whatsappNotificationService.sendAdminNewBookingAlert(data, data.hotelAdminPhone);
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
      console.log('✅ Admin phone resolved successfully:', targetPhone);
      console.log('👤 Admin details:', {
        name: adminPhoneResult.adminData?.fullName,
        email: adminPhoneResult.adminData?.email,
        role: adminPhoneResult.adminData?.role
      });

      return await whatsappNotificationService.sendAdminNewBookingAlert(data, targetPhone);

    } catch (error) {
      console.error('❌ Error resolving admin phone:', error);
      return false;
    }
  }

  // Notify global system admins (for system-wide issues, not hotel-specific bookings)
  private async notifyGlobalAdmins(eventType: string, data: any): Promise<void> {
    console.log('📢 Sending system-wide notification to global admins');
    for (const adminPhone of this.globalAdminPhones) {
      try {
        await whatsappNotificationService.sendAdminNewBookingAlert(data, adminPhone);
        // Add delay between admin notifications
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to notify global admin ${adminPhone}:`, error);
      }
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

  private async handleAdminBookingCancelledByUser(data: any, adminPhone?: string): Promise<boolean> {
    // If admin phone is explicitly provided, use it directly
    if (adminPhone) {
      console.log('📱 Using explicitly provided admin phone for user cancellation:', adminPhone);
      return await whatsappNotificationService.sendAdminBookingCancelledByUser(data, adminPhone);
    }

    // If hotelAdminPhone is provided in data, use it
    if (data.hotelAdminPhone) {
      console.log('📱 Using admin phone from data for user cancellation:', data.hotelAdminPhone);
      return await whatsappNotificationService.sendAdminBookingCancelledByUser(data, data.hotelAdminPhone);
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
      console.log('✅ Admin phone resolved for user cancellation:', targetPhone);

      return await whatsappNotificationService.sendAdminBookingCancelledByUser(data, targetPhone);

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