/**
 * Admin Phone Resolver Utility
 * Fetches admin phone numbers from users collection using admin user IDs
 * This works with existing database structure without requiring changes
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import PhoneValidator from './phoneValidation';

interface AdminPhoneResult {
  success: boolean;
  phone?: string;
  formattedPhone?: string;
  error?: string;
  adminData?: any;
}

/**
 * Fetch admin phone number from users collection using admin user ID
 */
export async function getAdminPhoneById(adminUserId: string): Promise<AdminPhoneResult> {
  try {
    if (!adminUserId || adminUserId.trim() === '') {
      return {
        success: false,
        error: 'Admin user ID is empty or undefined'
      };
    }

    console.log('🔍 Fetching admin phone for user ID:', adminUserId);

    // Fetch admin user document from users collection
    const adminDoc = await getDoc(doc(db, 'users', adminUserId));

    if (!adminDoc.exists()) {
      return {
        success: false,
        error: `Admin user not found with ID: ${adminUserId}`
      };
    }

    const adminData = adminDoc.data();
    const phoneNumber = adminData?.phoneNumber;

    if (!phoneNumber) {
      return {
        success: false,
        error: `Admin user ${adminUserId} has no phoneNumber field`,
        adminData: {
          uid: adminData?.uid,
          email: adminData?.email,
          fullName: adminData?.fullName,
          role: adminData?.role
        }
      };
    }

    // Validate and format the phone number
    const phoneValidation = PhoneValidator.validateAndFormat(phoneNumber);

    if (!phoneValidation.isValid) {
      return {
        success: false,
        error: `Invalid phone number for admin ${adminUserId}: ${phoneValidation.error}`,
        phone: phoneNumber,
        adminData: {
          uid: adminData?.uid,
          email: adminData?.email,
          fullName: adminData?.fullName,
          role: adminData?.role
        }
      };
    }

    console.log('✅ Admin phone resolved:', {
      adminId: adminUserId,
      adminName: adminData?.fullName,
      phone: PhoneValidator.formatForDisplay(phoneNumber),
      formattedPhone: phoneValidation.formattedNumber
    });

    return {
      success: true,
      phone: phoneNumber,
      formattedPhone: phoneValidation.formattedNumber,
      adminData: {
        uid: adminData?.uid,
        email: adminData?.email,
        fullName: adminData?.fullName,
        role: adminData?.role,
        phoneNumber: phoneNumber
      }
    };

  } catch (error) {
    console.error('❌ Error fetching admin phone:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Fetch admin phone number from hotel document
 * This function gets the hotelAdmin ID from hotel document, then fetches phone from users collection
 */
export async function getAdminPhoneByHotelId(hotelId: string): Promise<AdminPhoneResult> {
  try {
    if (!hotelId || hotelId.trim() === '') {
      return {
        success: false,
        error: 'Hotel ID is empty or undefined'
      };
    }

    console.log('🏨 Fetching hotel admin phone for hotel ID:', hotelId);

    // Fetch hotel document
    const hotelDoc = await getDoc(doc(db, 'hotels', hotelId));

    if (!hotelDoc.exists()) {
      return {
        success: false,
        error: `Hotel not found with ID: ${hotelId}`
      };
    }

    const hotelData = hotelDoc.data();
    const hotelAdmin = hotelData?.hotelAdmin || hotelData?.userId;

    if (!hotelAdmin) {
      return {
        success: false,
        error: `Hotel ${hotelId} has no hotelAdmin or userId field`,
        adminData: {
          hotelName: hotelData?.name,
          hotelLocation: hotelData?.location
        }
      };
    }

    console.log('🔗 Found hotel admin ID:', hotelAdmin, 'for hotel:', hotelData?.name);

    // Now fetch the admin's phone number from users collection
    return await getAdminPhoneById(hotelAdmin);

  } catch (error) {
    console.error('❌ Error fetching hotel admin phone:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Batch fetch admin phones for multiple admin IDs
 */
export async function getAdminPhonesBatch(adminUserIds: string[]): Promise<{ [adminId: string]: AdminPhoneResult }> {
  const results: { [adminId: string]: AdminPhoneResult } = {};

  for (const adminId of adminUserIds) {
    results[adminId] = await getAdminPhoneById(adminId);
    // Add small delay to avoid overwhelming Firebase
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get admin phone with fallback options
 * Tries multiple methods to find a hotel-specific admin phone number
 * For multi-tenant hotel booking platform - each hotel should have its own admin
 */
export async function getAdminPhoneWithFallback(
  hotelId?: string, 
  adminUserId?: string,
  fallbackAdminIds: string[] = [] // No default fallback - hotel-specific admins should be used
): Promise<AdminPhoneResult> {
  
  // Method 1: Try with provided admin user ID (direct hotel admin)
  if (adminUserId) {
    console.log('🎯 Method 1: Looking up hotel admin by user ID:', adminUserId);
    const result = await getAdminPhoneById(adminUserId);
    if (result.success) {
      console.log('✅ Found hotel admin phone via direct user ID');
      return result;
    }
    console.log('❌ Method 1 failed:', result.error);
  }

  // Method 2: Try with hotel ID to get hotel admin (most common scenario)
  if (hotelId) {
    console.log('🎯 Method 2: Looking up hotel admin via hotel document:', hotelId);
    const result = await getAdminPhoneByHotelId(hotelId);
    if (result.success) {
      console.log('✅ Found hotel-specific admin phone via hotel lookup');
      return result;
    }
    console.log('❌ Method 2 failed:', result.error);
  }

  // Method 3: Try fallback admin IDs (only if explicitly provided - should be rare)
  if (fallbackAdminIds.length > 0) {
    console.log('🎯 Method 3: Trying fallback system admins (this should be rare)');
    console.warn('⚠️ Using system admin fallback - hotel admin should be configured properly');
    
    for (const fallbackId of fallbackAdminIds) {
      const result = await getAdminPhoneById(fallbackId);
      if (result.success) {
        console.log('⚠️ Using system admin fallback:', fallbackId);
        console.log('💡 Consider adding hotelAdmin field to hotel document for proper admin assignment');
        return result;
      }
    }
  }

  return {
    success: false,
    error: 'No hotel admin phone found. Please ensure hotel document has hotelAdmin field with valid user ID.'
  };
}

export default {
  getAdminPhoneById,
  getAdminPhoneByHotelId,
  getAdminPhonesBatch,
  getAdminPhoneWithFallback
};