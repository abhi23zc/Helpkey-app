/**
 * Direct Razorpay API Test
 * This script tests Razorpay API directly without your backend
 * 
 * Usage: node scripts/testRazorpayDirect.js
 * 
 * Note: You need to install razorpay package first:
 * npm install razorpay
 */

const Razorpay = require('razorpay');

// Replace with your actual Razorpay credentials
const RAZORPAY_KEY_ID = 'rzp_live_RkQnwEw618QPs3';
const RAZORPAY_KEY_SECRET = 'YOUR_SECRET_KEY_HERE'; // ⚠️ NEVER commit this to git!

async function testRazorpayDirect() {
  console.log('🚀 Testing Razorpay API Directly...');
  console.log('='.repeat(50));

  try {
    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    console.log('\n✅ Razorpay instance created');

    // Create a test order
    console.log('\n🧪 Creating test order...');
    const order = await razorpay.orders.create({
      amount: 100000, // Amount in paise (1000 INR)
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        test: true,
        description: 'Test order from React Native app',
      },
    });

    console.log('✅ Order created successfully!');
    console.log('Order Details:', JSON.stringify(order, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Razorpay API is working correctly!');
    console.log('\nThis means:');
    console.log('  • Your Razorpay credentials are valid');
    console.log('  • Razorpay API is accessible');
    console.log('  • The issue is with your backend API implementation');
    console.log('\nNext steps:');
    console.log('  1. Check if your backend API endpoints exist');
    console.log('  2. Verify backend has correct Razorpay credentials');
    console.log('  3. Check backend logs for errors');
    console.log('  4. See RAZORPAY_SETUP.md for backend implementation');

  } catch (error) {
    console.log('\n❌ Razorpay API test failed!');
    console.log('Error:', error.message);
    
    if (error.message.includes('Authentication failed')) {
      console.log('\n⚠️  Authentication Error:');
      console.log('  • Your Razorpay Key ID or Secret is incorrect');
      console.log('  • Check your Razorpay dashboard for correct credentials');
      console.log('  • Make sure you\'re using the right mode (test/live)');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.log('\n⚠️  Network Error:');
      console.log('  • Check your internet connection');
      console.log('  • Razorpay API might be down (unlikely)');
      console.log('  • Firewall might be blocking the connection');
    } else {
      console.log('\n⚠️  Unknown Error:');
      console.log('  • Check the error message above');
      console.log('  • See Razorpay documentation for more details');
    }
  }
}

// Check if secret key is set
if (RAZORPAY_KEY_SECRET === 'YOUR_SECRET_KEY_HERE') {
  console.log('❌ Error: Please set your Razorpay Key Secret in this file');
  console.log('\nSteps:');
  console.log('  1. Open scripts/testRazorpayDirect.js');
  console.log('  2. Replace YOUR_SECRET_KEY_HERE with your actual secret key');
  console.log('  3. Get your secret key from: https://dashboard.razorpay.com/app/keys');
  console.log('\n⚠️  WARNING: Never commit your secret key to git!');
  process.exit(1);
}

// Run the test
testRazorpayDirect().catch(console.error);
