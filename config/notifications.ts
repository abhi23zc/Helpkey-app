export const NOTIFICATION_CONFIG = {
  // WhatsApp API Configuration
  whatsapp: {
    apiKey: 'dev_a4682328eef2',
    baseUrl: 'https://api.webifyit.in/api/v1/dev/create-message',
    timeout: 10000, // 10 seconds
  },
  
  // Admin phone numbers for notifications
  adminPhones: [
    '916389055071', // Primary admin
    // Add more admin numbers here
  ],
  
  // Notification settings
  settings: {
    enableGuestNotifications: true,
    enableAdminNotifications: true,
    enablePaymentNotifications: true,
    enableReminderNotifications: true,
    
    // Timing settings
    checkinReminderHours: 24, // Send reminder 24 hours before check-in
    checkoutFollowupHours: 2,  // Send thank you message 2 hours after checkout
    
    // Rate limiting
    maxRetries: 3,
    retryDelay: 1000, // 1 second between retries
    bulkMessageDelay: 1000, // 1 second delay between bulk messages
  },
  
  // Message templates (can be customized)
  templates: {
    bookingConfirmed: {
      title: '🎉 Booking Confirmed!',
      includeBookingDetails: true,
      includeSpecialRequests: true,
    },
    paymentSuccess: {
      title: '✅ Payment Successful!',
      includePaymentId: true,
    },
    checkinReminder: {
      title: '⏰ Check-in Reminder',
      includeWhatToBring: true,
    },
    checkoutThankYou: {
      title: '🙏 Thank You for Staying with Us!',
      includeReviewRequest: true,
      includeSpecialOffer: true,
    },
    adminNewBooking: {
      title: '🔔 New Booking Alert',
      includeGuestDetails: true,
      includeSpecialRequests: true,
    }
  }
};

// Environment-specific overrides
export const getNotificationConfig = () => {
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    return {
      ...NOTIFICATION_CONFIG,
      // In development, you might want to use different settings
      settings: {
        ...NOTIFICATION_CONFIG.settings,
        enableAdminNotifications: false, // Disable admin notifications in dev
      }
    };
  }
  
  return NOTIFICATION_CONFIG;
};

export default NOTIFICATION_CONFIG;