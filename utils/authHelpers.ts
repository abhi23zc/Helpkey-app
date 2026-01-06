/**
 * Auth Helper Utilities
 * Common functions for authentication validation and formatting
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password is too long' };
  }
  return { valid: true };
};

/**
 * Validate phone number (basic validation)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Format Firebase auth error messages to user-friendly text
 */
export const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/requires-recent-login': 'Please logout and login again to perform this action.',
    // Google Sign-In specific errors
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
    'auth/credential-already-in-use': 'This credential is already associated with a different user account.',
    'auth/popup-blocked': 'The popup was blocked by the browser.',
    'auth/popup-closed-by-user': 'The popup was closed before completing sign-in.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

/**
 * Extract first name from full name
 */
export const getFirstName = (fullName: string): string => {
  return fullName.trim().split(' ')[0];
};

/**
 * Format display name
 */
export const formatDisplayName = (fullName: string): string => {
  return fullName
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Check if user has admin role
 */
export const isAdmin = (role?: string): boolean => {
  return role === 'admin';
};

/**
 * Check if user is banned
 */
export const isUserBanned = (isBanned?: boolean): boolean => {
  return isBanned === true;
};

/**
 * Check if Aadhaar is verified
 */
export const isAadhaarVerified = (aadhaarVerified?: boolean): boolean => {
  return aadhaarVerified === true;
};
