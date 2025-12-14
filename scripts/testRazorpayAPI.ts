/**
 * Test script to verify Razorpay API endpoints
 * Run this to check if your backend API is working correctly
 * 
 * Usage: npx ts-node scripts/testRazorpayAPI.ts
 */

const API_BASE_URL = 'https://helpkey.in';

async function testCreateOrder() {
  console.log('\n🧪 Testing Create Order API...');
  console.log(`URL: ${API_BASE_URL}/api/razorpay/create-order`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1000,
        currency: 'INR',
        receipt: `test_receipt_${Date.now()}`,
        notes: {
          test: true,
        },
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success && (data.orderId || data.order?.id)) {
      const orderId = data.orderId || data.order.id;
      console.log('✅ Create Order API is working!');
      console.log(`Order ID: ${orderId}`);
      return orderId;
    } else {
      console.log('❌ Create Order API returned error:', data.error);
      return null;
    }
  } catch (error: any) {
    console.log('❌ Create Order API failed:', error.message);
    return null;
  }
}

async function testVerifyPayment(orderId: string) {
  console.log('\n🧪 Testing Verify Payment API...');
  console.log(`URL: ${API_BASE_URL}/api/razorpay/verify-payment`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'test_signature',
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Verify Payment API is working!');
      return true;
    } else {
      console.log('❌ Verify Payment API returned error:', data.error);
      return false;
    }
  } catch (error: any) {
    console.log('❌ Verify Payment API failed:', error.message);
    return false;
  }
}

async function testAPIHealth() {
  console.log('\n🧪 Testing API Health...');
  console.log(`URL: ${API_BASE_URL}`);
  
  try {
    const response = await fetch(API_BASE_URL);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ API server is reachable!');
      return true;
    } else {
      console.log('⚠️  API server returned non-OK status');
      return false;
    }
  } catch (error: any) {
    console.log('❌ API server is not reachable:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Razorpay API Tests...');
  console.log('='.repeat(50));

  // Test 1: API Health
  const healthOk = await testAPIHealth();
  
  if (!healthOk) {
    console.log('\n❌ API server is not reachable. Please check:');
    console.log('   1. Is your backend server running?');
    console.log('   2. Is the URL correct?');
    console.log('   3. Is there a firewall blocking the connection?');
    console.log('   4. Are you connected to the internet?');
    return;
  }

  // Test 2: Create Order
  const orderId = await testCreateOrder();
  
  if (!orderId) {
    console.log('\n❌ Create Order API is not working. Please check:');
    console.log('   1. Does the endpoint exist?');
    console.log('   2. Are Razorpay credentials configured?');
    console.log('   3. Check backend logs for errors');
    return;
  }

  // Test 3: Verify Payment
  await testVerifyPayment(orderId);

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('\nIf any tests failed, check RAZORPAY_SETUP.md for solutions.');
}

// Run the tests
runTests().catch(console.error);
