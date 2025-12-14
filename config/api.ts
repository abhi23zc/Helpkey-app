// API Configuration
// Update this with your actual API URL

// For development (local testing):
// - If testing on Android emulator: use 'http://10.0.2.2:3000'
// - If testing on iOS simulator: use 'http://localhost:3000'
// - If testing on physical device: use your computer's IP (e.g., 'http://192.168.1.100:3000')

// For production:
// - Use your deployed web app URL (e.g., 'https://helpkey.com')

export const API_CONFIG = {
  // Change this to your actual API URL
  baseURL: 'https://helpkey.in', // Default for Android emulator
  
  // Alternative URLs (uncomment the one you need):
  // baseURL: 'http://localhost:3000', // iOS simulator
  // baseURL: 'http://192.168.1.100:3000', // Physical device (replace with your IP)
  // baseURL: 'https://your-domain.com', // Production
};

// API Endpoints
export const API_ENDPOINTS = {
  aadhaar: {
    sendOTP: `${API_CONFIG.baseURL}/api/aadhaar/send-otp`,
    verifyOTP: `${API_CONFIG.baseURL}/api/aadhaar/verify-otp`,
  },
};
