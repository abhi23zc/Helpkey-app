/**
 * Test script for Admin Phone Resolver
 * Tests the new approach of fetching admin phone from users collection
 */

import { getAdminPhoneById, getAdminPhoneByHotelId, getAdminPhoneWithFallback } from '../utils/adminPhoneResolver';

async function testAdminPhoneResolver() {
  console.log('🧪 Testing Admin Phone Resolver');
  console.log('='.repeat(50));

  // Test 1: Direct admin user ID lookup
  console.log('\n1️⃣ Testing direct admin user ID lookup...');
  const adminUserId = '0TgS3HwbSzMsyCOJQBf9sGB75it1'; // Your super-admin ID from schema
  
  try {
    const result1 = await getAdminPhoneById(adminUserId);
    
    if (result1.success) {
      console.log('✅ Success! Admin phone found:');
      console.log('   📱 Phone:', result1.phone);
      console.log('   📱 Formatted:', result1.formattedPhone);
      console.log('   👤 Admin:', result1.adminData?.fullName);
      console.log('   📧 Email:', result1.adminData?.email);
      console.log('   🎭 Role:', result1.adminData?.role);
    } else {
      console.log('❌ Failed:', result1.error);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 2: Hotel ID lookup (if you have a hotel ID)
  console.log('\n2️⃣ Testing hotel ID lookup...');
  console.log('ℹ️ This will only work if you have hotels with hotelAdmin field set');
  
  // You can replace this with an actual hotel ID from your database
  const testHotelId = 'test_hotel_id';
  
  try {
    const result2 = await getAdminPhoneByHotelId(testHotelId);
    
    if (result2.success) {
      console.log('✅ Success! Hotel admin phone found:');
      console.log('   📱 Phone:', result2.phone);
      console.log('   📱 Formatted:', result2.formattedPhone);
      console.log('   👤 Admin:', result2.adminData?.fullName);
    } else {
      console.log('❌ Failed (expected if hotel doesn\'t exist):', result2.error);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 3: Fallback method
  console.log('\n3️⃣ Testing fallback method...');
  
  try {
    const result3 = await getAdminPhoneWithFallback(
      'non_existent_hotel_id', // This will fail
      'non_existent_admin_id', // This will also fail
      [adminUserId] // But this should work as fallback
    );
    
    if (result3.success) {
      console.log('✅ Success! Fallback admin phone found:');
      console.log('   📱 Phone:', result3.phone);
      console.log('   📱 Formatted:', result3.formattedPhone);
      console.log('   👤 Admin:', result3.adminData?.fullName);
    } else {
      console.log('❌ Failed:', result3.error);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n📋 Summary:');
  console.log('✅ If Test 1 passed, your notification system will work!');
  console.log('📱 Your super-admin phone will be used for hotel notifications');
  console.log('🏨 To assign specific admins to hotels, add hotelAdmin field to hotel documents');
  console.log('💡 The hotelAdmin field should contain the user ID (not phone number)');
}

// Test notification flow for multi-tenant hotel platform
async function testNotificationFlow() {
  console.log('\n🎬 Testing Multi-Tenant Hotel Notification Flow');
  console.log('='.repeat(50));

  // Simulate different hotel booking scenarios
  const mockBookingScenarios = [
    {
      scenario: 'Hotel with specific admin',
      hotelId: 'hotel_with_admin', // Replace with real hotel ID that has hotelAdmin field
      hotelName: 'Grand Hotel with Admin',
      expectedResult: 'Hotel admin should receive notification'
    },
    {
      scenario: 'Hotel without admin (fallback)',
      hotelId: 'hotel_without_admin', // Hotel that doesn't exist or has no hotelAdmin
      hotelName: 'Hotel Without Admin',
      expectedResult: 'System admin (you) should receive notification'
    }
  ];

  for (const scenario of mockBookingScenarios) {
    console.log(`\n📋 Testing: ${scenario.scenario}`);
    console.log(`🏨 Hotel: ${scenario.hotelName} (${scenario.hotelId})`);
    console.log(`🎯 Expected: ${scenario.expectedResult}`);

    const mockBookingData = {
      hotelId: scenario.hotelId,
      hotelName: scenario.hotelName,
      roomType: 'Deluxe Suite',
      guestName: 'Test Customer',
      guestPhone: '919876543210', // Customer phone
      checkIn: 'Tomorrow, 2:00 PM',
      checkOut: 'Day after tomorrow, 11:00 AM',
      totalAmount: 3500,
      bookingId: `TEST_${scenario.hotelId.toUpperCase()}`,
      nights: 1,
      guests: 2
    };

    // Test admin phone resolution for this booking
    try {
      const adminPhoneResult = await getAdminPhoneWithFallback(
        mockBookingData.hotelId,
        undefined, // No direct admin ID
        ['0TgS3HwbSzMsyCOJQBf9sGB75it1'] // Your super-admin ID as fallback
      );

      if (adminPhoneResult.success) {
        console.log('✅ Admin phone resolved:');
        console.log('   📱 Admin phone:', adminPhoneResult.formattedPhone);
        console.log('   👤 Admin name:', adminPhoneResult.adminData?.fullName || 'Unknown');
        console.log('   🎭 Admin role:', adminPhoneResult.adminData?.role || 'Unknown');
        
        // Check if it's hotel-specific admin or system admin
        if (adminPhoneResult.adminData?.uid === '0TgS3HwbSzMsyCOJQBf9sGB75it1') {
          console.log('   ⚠️ Using system admin fallback (you will receive notification)');
          console.log('   💡 To fix: Add hotelAdmin field to hotel document');
        } else {
          console.log('   ✅ Using hotel-specific admin (perfect!)');
        }
        
        console.log('');
        console.log('🎯 Notification Flow:');
        console.log('   📱 Guest gets booking confirmation');
        console.log('   📱 Admin gets new booking alert');
      } else {
        console.log('❌ Admin phone resolution failed:', adminPhoneResult.error);
        console.log('💡 Admin notification will fail for this booking');
        console.log('💡 Guest notification will still work');
      }
    } catch (error) {
      console.log('❌ Error in notification flow test:', error);
    }
    
    console.log('-'.repeat(40));
  }

  console.log('\n📊 Multi-Tenant Summary:');
  console.log('✅ Each hotel can have its own admin');
  console.log('📱 Customers booking Hotel A → Admin A gets notified');
  console.log('📱 Customers booking Hotel B → Admin B gets notified');
  console.log('🔄 System admin (you) gets notified only as fallback');
  console.log('💡 Add hotelAdmin field to hotel documents for specific admins');
}

// Main test function
async function runAllTests() {
  try {
    await testAdminPhoneResolver();
    await testNotificationFlow();
    
    console.log('\n🏁 All tests completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. If tests passed, your notification system is ready to use');
    console.log('2. Test with a real booking to verify end-to-end flow');
    console.log('3. Add hotelAdmin field to hotel documents for specific admin assignments');
    console.log('4. Use NotificationTester component for manual testing');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export for use in other scripts
export {
  testAdminPhoneResolver,
  testNotificationFlow,
  runAllTests
};

// Uncomment to run tests directly
// runAllTests();