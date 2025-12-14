import PhoneValidator from '@/utils/phoneValidation';

interface WhatsAppNotificationConfig {
  apiKey: string;
  baseUrl: string;
}

interface NotificationData {
  to: string;
  message: string;
}

interface BookingData {
  hotelName: string;
  roomType: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  bookingId?: string;
  guestPhone: string;
  nights?: number;
  guests?: number;
  additionalRequests?: string;
}

class WhatsAppNotificationService {
  private config: WhatsAppNotificationConfig;

  constructor() {
    this.config = {
      apiKey: 'dev_a4682328eef2',
      baseUrl: 'https://api.webifyit.in/api/v1/dev/create-message'
    };
  }

  private async sendMessage(data: NotificationData): Promise<boolean> {
    try {
      // Validate and format phone number
      const phoneValidation = PhoneValidator.validateAndFormat(data.to);
      
      if (!phoneValidation.isValid) {
        console.error('❌ Invalid phone number:', phoneValidation.error);
        console.error('📱 Phone validation details:', PhoneValidator.getValidationSummary(data.to));
        return false;
      }

      const validatedPhone = phoneValidation.formattedNumber;
      console.log('📱 Phone number validated:', {
        original: data.to,
        formatted: validatedPhone,
        display: PhoneValidator.formatForDisplay(data.to)
      });

      const url = `${this.config.baseUrl}?apikey=${this.config.apiKey}&to=${validatedPhone}&message=${encodeURIComponent(data.message)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.status === true) {
        console.log('✅ WhatsApp message sent successfully to', PhoneValidator.formatForDisplay(data.to));
        console.log('📨 API Response:', result.message);
        return true;
      } else {
        console.error('❌ Failed to send WhatsApp message:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Booking Confirmation Message
  async sendBookingConfirmation(bookingData: BookingData): Promise<boolean> {
    const message = `🎉 *Booking Confirmed!*

Dear ${bookingData.guestName},

Your booking has been confirmed! Here are the details:

🏨 *Hotel:* ${bookingData.hotelName}
🛏️ *Room:* ${bookingData.roomType}
📅 *Check-in:* ${bookingData.checkIn}
📅 *Check-out:* ${bookingData.checkOut}
👥 *Guests:* ${bookingData.guests || 1}
${bookingData.nights ? `🌙 *Nights:* ${bookingData.nights}` : ''}
💰 *Total Amount:* ₹${bookingData.totalAmount}
${bookingData.bookingId ? `🆔 *Booking ID:* ${bookingData.bookingId}` : ''}

${bookingData.additionalRequests ? `📝 *Special Requests:* ${bookingData.additionalRequests}` : ''}

Thank you for choosing us! We look forward to hosting you.

For any queries, please contact our support team.

*Helpkey Team* 🏨✨`;

    return await this.sendMessage({
      to: bookingData.guestPhone,
      message: message
    });
  }

  // Payment Success Message
  async sendPaymentSuccess(bookingData: BookingData & { paymentId?: string }): Promise<boolean> {
    const message = `✅ *Payment Successful!*

Dear ${bookingData.guestName},

Your payment has been processed successfully!

💳 *Payment Details:*
${bookingData.paymentId ? `🆔 Payment ID: ${bookingData.paymentId}` : ''}
💰 Amount Paid: ₹${bookingData.totalAmount}
🏨 Hotel: ${bookingData.hotelName}
📅 Check-in: ${bookingData.checkIn}

Your booking is now confirmed. You'll receive a separate confirmation message with all booking details.

*Helpkey Team* 🏨✨`;

    return await this.sendMessage({
      to: bookingData.guestPhone,
      message: message
    });
  }

  // Check-in Reminder (1 day before)
  async sendCheckinReminder(bookingData: BookingData): Promise<boolean> {
    const message = `⏰ *Check-in Reminder*

Dear ${bookingData.guestName},

This is a friendly reminder that your check-in is tomorrow!

🏨 *Hotel:* ${bookingData.hotelName}
📅 *Check-in:* ${bookingData.checkIn}
🛏️ *Room:* ${bookingData.roomType}
${bookingData.bookingId ? `🆔 *Booking ID:* ${bookingData.bookingId}` : ''}

📋 *What to bring:*
• Valid ID proof
• Booking confirmation
• Payment receipt

We're excited to welcome you!

*Helpkey Team* 🏨✨`;

    return await this.sendMessage({
      to: bookingData.guestPhone,
      message: message
    });
  }

  // Booking Cancellation
  async sendBookingCancellation(bookingData: BookingData & { cancellationReason?: string }): Promise<boolean> {
    const message = `❌ *Booking Cancelled*

Dear ${bookingData.guestName},

Your booking has been cancelled.

🏨 *Hotel:* ${bookingData.hotelName}
📅 *Check-in Date:* ${bookingData.checkIn}
${bookingData.bookingId ? `🆔 *Booking ID:* ${bookingData.bookingId}` : ''}
${bookingData.cancellationReason ? `📝 *Reason:* ${bookingData.cancellationReason}` : ''}

If you have any questions about refunds or need assistance with a new booking, please contact our support team.

We hope to serve you in the future!

*Helpkey Team* 🏨✨`;

    return await this.sendMessage({
      to: bookingData.guestPhone,
      message: message
    });
  }

  // Check-out Thank You Message
  async sendCheckoutThankYou(bookingData: BookingData): Promise<boolean> {
    const message = `🙏 *Thank You for Staying with Us!*

Dear ${bookingData.guestName},

We hope you had a wonderful stay at ${bookingData.hotelName}!

⭐ *Rate Your Experience:*
We'd love to hear about your stay. Please take a moment to rate and review your experience.

🎁 *Special Offer:*
Book your next stay with us and get 10% off!

Thank you for choosing Helpkey. We look forward to welcoming you again soon!

*Helpkey Team* 🏨✨`;

    return await this.sendMessage({
      to: bookingData.guestPhone,
      message: message
    });
  }

  // Admin Notification for New Booking
  async sendAdminNewBookingAlert(bookingData: BookingData, adminPhone: string): Promise<boolean> {
    console.log('🔔 Preparing admin notification for hotel:', bookingData.hotelName);
    console.log('📱 Target hotel admin phone:', adminPhone);

    const message = `🔔 *New Booking Alert*

A new booking has been received for your hotel!

👤 *Guest:* ${bookingData.guestName}
📱 *Guest Phone:* ${bookingData.guestPhone}
🏨 *Hotel:* ${bookingData.hotelName}
🛏️ *Room:* ${bookingData.roomType}
📅 *Check-in:* ${bookingData.checkIn}
📅 *Check-out:* ${bookingData.checkOut}
👥 *Guests:* ${bookingData.guests || 1}
💰 *Amount:* ₹${bookingData.totalAmount}
${bookingData.bookingId ? `🆔 *Booking ID:* ${bookingData.bookingId}` : ''}

${bookingData.additionalRequests ? `📝 *Special Requests:* ${bookingData.additionalRequests}` : ''}

Please ensure the booking is processed and the guest is contacted if needed.

*Helpkey Hotel Management* 🏨`;

    const success = await this.sendMessage({
      to: adminPhone,
      message: message
    });

    if (success) {
      console.log('✅ Hotel admin notification sent successfully');
    } else {
      console.error('❌ Failed to send hotel admin notification');
    }

    return success;
  }

  // Custom Message
  async sendCustomMessage(phone: string, message: string): Promise<boolean> {
    return await this.sendMessage({
      to: phone,
      message: message
    });
  }

  // Bulk Message (for promotions, updates, etc.)
  async sendBulkMessage(phoneNumbers: string[], message: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const phone of phoneNumbers) {
      const result = await this.sendMessage({ to: phone, message });
      if (result) {
        success++;
      } else {
        failed++;
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { success, failed };
  }

  // Admin notification for user-initiated booking cancellation
  async sendAdminBookingCancelledByUser(bookingData: BookingData & { reason?: string }, adminPhone: string): Promise<boolean> {
    console.log('🔔 Preparing admin notification for user cancellation:', bookingData.hotelName);
    console.log('📱 Target hotel admin phone:', adminPhone);

    const message = `❌ *Booking Cancelled by Guest*

A guest has cancelled their booking at your hotel.

👤 *Guest:* ${bookingData.guestName}
📱 *Guest Phone:* ${bookingData.guestPhone}
🏨 *Hotel:* ${bookingData.hotelName}
🛏️ *Room:* ${bookingData.roomType}
📅 *Check-in:* ${bookingData.checkIn}
📅 *Check-out:* ${bookingData.checkOut}
👥 *Guests:* ${bookingData.guests || 1}
💰 *Amount:* ₹${bookingData.totalAmount}
${bookingData.bookingId ? `🆔 *Booking ID:* ${bookingData.bookingId}` : ''}

${bookingData.reason ? `📝 *Cancellation Reason:* ${bookingData.reason}\n\n` : ''}⏰ *Cancelled:* ${new Date().toLocaleString('en-IN')}

💡 *Action Required:*
• Update room availability
• Process any refunds if applicable
• Contact guest if needed

*Helpkey Hotel Management* 🏨`;

    const success = await this.sendMessage({
      to: adminPhone,
      message: message
    });

    if (success) {
      console.log('✅ Admin cancellation notification sent successfully');
    } else {
      console.error('❌ Failed to send admin cancellation notification');
    }

    return success;
  }
}

// Export singleton instance
export const whatsappNotificationService = new WhatsAppNotificationService();
export default whatsappNotificationService;