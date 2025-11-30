// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  key_id: 'rzp_test_HQ4tZ6kBqnghIu', // Your Razorpay Test Key ID
  name: 'HelpKey Hotels',
  description: 'Hotel Booking Payment',
  image: 'https://helpkey.in/logo.png', // Your logo URL
  currency: 'INR',
  theme: {
    color: '#00BFA6',
  },
};

// API Configuration
export const API_CONFIG = {
  baseURL: 'https://helpkey.in',
  endpoints: {
    createOrder: '/api/razorpay/create-order',
    verifyPayment: '/api/razorpay/verify-payment',
  },
  timeout: 30000, // 30 seconds
};

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  error?: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  verified: boolean;
  order_id: string;
  payment_id: string;
  error?: string;
}
