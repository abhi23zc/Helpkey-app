import { useAuth } from '@/context/AuthContext';
import { createBooking } from '@/services/bookingService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Lock, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;

import { API_CONFIG, RAZORPAY_CONFIG } from '@/config/razorpay';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const hotelData = params.hotel ? JSON.parse(params.hotel as string) : null;
  const roomData = params.room ? JSON.parse(params.room as string) : null;
  const checkIn = params.checkIn ? new Date(params.checkIn as string) : null;
  const checkOut = params.checkOut ? new Date(params.checkOut as string) : null;
  const guests = parseInt(params.guests as string) || 1;
  const additionalRequest = params.additionalRequest as string || '';
  const totalAmount = parseFloat(params.totalAmount as string) || 0;
  const nights = parseInt(params.nights as string) || 0;
  const bookingType = (params.bookingType as string) || 'nightly';
  const hourlyDuration = params.hourlyDuration ? parseInt(params.hourlyDuration as string) : undefined;
  const totalPrice = parseFloat(params.totalPrice as string) || 0;
  const taxesAndFees = parseFloat(params.taxesAndFees as string) || 0;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'hotel'>('online');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const webViewRef = useRef<WebView>(null);
  
  // Debug mode - set to true to test without API
  const DEBUG_MODE = false;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to continue');
      return;
    }

    if (paymentMethod === 'hotel') {
      // Handle pay at hotel
      await createBookingWithPayAtHotel();
    } else {
      // Handle Razorpay payment
      await initiateRazorpayPayment();
    }
  };

  const createBookingWithPayAtHotel = async () => {
    setLoading(true);
    try {
      // Parse guest info from params
      const allGuestInfoParam = params.allGuestInfo ? JSON.parse(params.allGuestInfo as string) : [];
      // Parse customer preferences
      const customerPreferences = params.customerPreferences ? JSON.parse(params.customerPreferences as string) : {};
      
      // Get booking type from params (what user actually selected)
      const actualBookingType = (params.bookingType as string) || 'nightly';
      const hourlyDuration = params.hourlyDuration ? parseInt(params.hourlyDuration as string) : undefined;
      
      // Calculate prices based on actual booking type
      const totalPrice = parseFloat(params.totalPrice as string) || (roomData.price * nights);
      const taxesAndFees = parseFloat(params.taxesAndFees as string) || Math.round(totalPrice * 0.18);
      
      const bookingData = {
        bookingType: actualBookingType,
        checkIn: checkIn?.toISOString() || '',
        checkOut: checkOut?.toISOString() || '',
        nights: actualBookingType === 'nightly' ? nights : 0,
        guests,
        hotelId: hotelData.id,
        roomId: roomData.id,
        userId: user?.uid || '',
        userEmail: user?.email || '',
        hotelAdmin: hotelData.hotelAdmin || '',
        ...(actualBookingType === 'hourly' && hourlyDuration && { hourlyDuration }),
        hotelDetails: {
          hotelId: hotelData.id,
          name: hotelData.name,
          location: hotelData.location,
          image: hotelData.image ? hotelData.image.replace(/\.avif$/, '.jpg') : hotelData.image,
        },
        roomDetails: {
          roomId: roomData.id,
          type: roomData.type,
          roomNumber: null,
          price: parseFloat(params.totalPrice as string) / (actualBookingType === 'nightly' ? nights : 1) || roomData.price,
          image: roomData.image ? roomData.image.replace(/\.avif$/, '.jpg') : roomData.image,
          beds: roomData.beds || '2',
          size: roomData.size || '300',
        },
        guestInfo: allGuestInfoParam.map((guest: any) => ({
          firstName: guest.firstName || '',
          lastName: guest.lastName || '',
          email: guest.email || '',
          phone: guest.phone || '',
          aadhaarNumber: guest.aadhaarNumber || '',
          aadhaarVerified: guest.aadhaarVerified || false,
          aadhaarData: guest.aadhaarData || null,
          specialRequests: guest.specialRequests || '',
        })),
        guestVerifications: allGuestInfoParam.map((guest: any) => ({
          firstName: guest.firstName || '',
          lastName: guest.lastName || '',
          phoneNumber: guest.phone || '',
          aadhaarNumber: guest.aadhaarNumber || '',
          verified: guest.aadhaarVerified || false,
          verificationDetails: guest.aadhaarData || null,
        })),
        unitPrice: parseFloat(params.totalPrice as string) / (actualBookingType === 'nightly' ? nights : 1) || roomData.price,
        totalPrice,
        taxesAndFees,
        totalAmount,
        paymentInfo: {
          method: 'cash',
          status: 'pending',
          orderId: null,
          paymentId: null,
          signature: null,
        },
        status: 'pending',
        reference: `BK${Math.floor(Math.random() * 1000000)}`,
        customerPreferences: customerPreferences,
        customerVerification: {},
      };

      console.log('💾 Booking Data to Save (Pay at Hotel):', {
        hotelAdmin: bookingData.hotelAdmin,
        hotelDetailsImage: bookingData.hotelDetails.image,
        roomDetailsImage: bookingData.roomDetails.image,
        reference: bookingData.reference,
      });

      await createBooking(bookingData);

      Alert.alert(
        'Booking Confirmed!',
        `Your booking reference is ${bookingData.reference}. Please pay at the hotel during check-in.`,
        [
          {
            text: 'View Bookings',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initiateRazorpayPayment = async () => {
    setLoading(true);
    try {
      let orderId: string;

      if (DEBUG_MODE) {
        // Debug mode: Use a test order ID
        console.log('DEBUG MODE: Using test order ID');
        orderId = `order_test_${Date.now()}`;
      } else {
        // Production mode: Create order via your API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        console.log('Creating order with API:', {
          url: `${API_CONFIG.baseURL}${API_CONFIG.endpoints.createOrder}`,
          amount: totalAmount,
          currency: RAZORPAY_CONFIG.currency,
        });

        const orderResponse = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.createOrder}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: totalAmount,
            currency: RAZORPAY_CONFIG.currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
              hotelId: hotelData.id,
              roomId: roomData.id,
              userId: user?.uid || '',
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!orderResponse.ok) {
          const errorText = await orderResponse.text();
          console.error('API Error Response:', {
            status: orderResponse.status,
            statusText: orderResponse.statusText,
            body: errorText,
          });
          throw new Error(`API Error: ${orderResponse.status} - ${errorText || orderResponse.statusText}`);
        }

        const orderData = await orderResponse.json();
        console.log('Order created:', JSON.stringify(orderData, null, 2));

        if (!orderData.success) {
          throw new Error(orderData.error || 'Failed to create order');
        }

        // Handle both response formats: {orderId: "..."} or {order: {id: "..."}}
        orderId = orderData.orderId || orderData.order?.id;
        
        if (!orderId) {
          console.error('Order data received:', orderData);
          throw new Error('Order ID not found in response');
        }

        console.log('Extracted Order ID:', orderId);
        console.log('Order Amount:', orderData.order?.amount || orderData.amount);
        console.log('Payment Amount:', totalAmount * 100);
      }

      // Generate Razorpay checkout HTML
      const html = generateRazorpayHTML(orderId);
      setPaymentHtml(html);
      setShowPaymentModal(true);
      setLoading(false);
    } catch (error: any) {
      console.error('Razorpay error:', error);
      setLoading(false);
      
      // Show detailed error with options
      Alert.alert(
        'Payment Error',
        error.name === 'AbortError' 
          ? 'Request timed out. Please check your internet connection and try again.'
          : `Failed to initiate payment:\n\n${error.message}\n\nPlease check:\n• Your internet connection\n• API server is running at ${API_CONFIG.baseURL}\n• Razorpay API keys are configured\n\nWould you like to try "Pay at Hotel" instead?`,
        [
          {
            text: 'Try Again',
            onPress: () => initiateRazorpayPayment(),
          },
          {
            text: 'Pay at Hotel',
            onPress: () => {
              setPaymentMethod('hotel');
              Alert.alert(
                'Payment Method Changed',
                'You can now proceed with "Pay at Hotel" option.',
                [{ text: 'OK' }]
              );
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const generateRazorpayHTML = (orderId: string) => {
    // Escape special characters in user data to prevent XSS
    const escapeName = (user?.displayName || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapeEmail = (user?.email || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapePhone = (user?.phoneNumber || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapeHotelName = hotelData.name.replace(/'/g, "\\'").replace(/"/g, '\\"');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8f9fa;
          }
          .container {
            text-align: center;
            padding: 20px;
          }
          .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #00BFA6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .info {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <p>Opening Razorpay Checkout...</p>
          <p class="info">Please wait while we load the payment gateway</p>
        </div>
        <script>
          // Log configuration for debugging
          console.log('Razorpay Configuration:', {
            key: '${RAZORPAY_CONFIG.key_id}',
            amount: ${totalAmount * 100},
            currency: '${RAZORPAY_CONFIG.currency}',
            order_id: '${orderId}'
          });

          try {
            var options = {
              key: '${RAZORPAY_CONFIG.key_id}',
              amount: ${totalAmount * 100},
              currency: '${RAZORPAY_CONFIG.currency}',
              name: '${RAZORPAY_CONFIG.name}',
              description: 'Booking at ${escapeHotelName}',
              image: '${RAZORPAY_CONFIG.image}',
              order_id: '${orderId}',
              prefill: {
                name: '${escapeName}',
                email: '${escapeEmail}',
                contact: '${escapePhone}'
              },
              theme: {
                color: '${RAZORPAY_CONFIG.theme.color}'
              },
              handler: function (response) {
                console.log('Payment success:', response);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'success',
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature
                }));
              },
              modal: {
                ondismiss: function() {
                  console.log('Payment cancelled by user');
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'cancelled'
                  }));
                }
              }
            };
            
            console.log('Creating Razorpay instance...');
            var rzp = new Razorpay(options);
            
            rzp.on('payment.failed', function (response){
              console.error('Payment failed:', response.error);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'failed',
                error: response.error
              }));
            });
            
            // Open Razorpay checkout
            console.log('Opening Razorpay checkout...');
            rzp.open();
          } catch (error) {
            console.error('Razorpay initialization error:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: error.message || 'Failed to initialize Razorpay',
              details: error.toString()
            }));
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', data);
      
      setShowPaymentModal(false);
      
      if (data.type === 'success') {
        createBookingWithOnlinePayment(data.paymentId, data.orderId, data.signature);
      } else if (data.type === 'cancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
      } else if (data.type === 'failed') {
        Alert.alert(
          'Payment Failed', 
          data.error?.description || 'Something went wrong. Please try again.',
          [
            {
              text: 'Try Again',
              onPress: () => initiateRazorpayPayment(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else if (data.type === 'error') {
        Alert.alert(
          'Error',
          data.message || 'Failed to initialize payment gateway.',
          [
            {
              text: 'Try Again',
              onPress: () => initiateRazorpayPayment(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      setShowPaymentModal(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const createBookingWithOnlinePayment = async (paymentId: string, orderId: string, signature: string) => {
    setLoading(true);
    try {
      // Verify payment with your API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const verifyResponse = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.verifyPayment}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const verifyData = await verifyResponse.json();

      if (!verifyData.success || !verifyData.verified) {
        throw new Error('Payment verification failed');
      }

      // Payment verified, create booking
      const bookingReference = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Parse guest info from params
      const allGuestInfoParam = params.allGuestInfo ? JSON.parse(params.allGuestInfo as string) : [];
      // Parse customer preferences
      const customerPreferences = params.customerPreferences ? JSON.parse(params.customerPreferences as string) : {};
      
      // Get booking type from params (what user actually selected)
      const actualBookingType = (params.bookingType as string) || 'nightly';
      const hourlyDuration = params.hourlyDuration ? parseInt(params.hourlyDuration as string) : undefined;
      
      // Calculate prices based on actual booking type
      const totalPrice = parseFloat(params.totalPrice as string) || (roomData.price * nights);
      const taxesAndFees = parseFloat(params.taxesAndFees as string) || Math.round(totalPrice * 0.18);
      
      const bookingData = {
        bookingType: actualBookingType,
        checkIn: checkIn?.toISOString() || '',
        checkOut: checkOut?.toISOString() || '',
        nights: actualBookingType === 'nightly' ? nights : 0,
        guests,
        hotelId: hotelData.id,
        roomId: roomData.id,
        userId: user?.uid || '',
        userEmail: user?.email || '',
        hotelAdmin: hotelData.hotelAdmin || '',
        ...(actualBookingType === 'hourly' && hourlyDuration && { hourlyDuration }),
        hotelDetails: {
          hotelId: hotelData.id,
          name: hotelData.name,
          location: hotelData.location,
          image: hotelData.image ? hotelData.image.replace(/\.avif$/, '.jpg') : hotelData.image,
        },
        roomDetails: {
          roomId: roomData.id,
          type: roomData.type,
          roomNumber: null,
          price: parseFloat(params.totalPrice as string) / (actualBookingType === 'nightly' ? nights : 1) || roomData.price,
          image: roomData.image ? roomData.image.replace(/\.avif$/, '.jpg') : roomData.image,
          beds: roomData.beds || '2',
          size: roomData.size || '300',
        },
        guestInfo: allGuestInfoParam.map((guest: any) => ({
          firstName: guest.firstName || '',
          lastName: guest.lastName || '',
          email: guest.email || '',
          phone: guest.phone || '',
          aadhaarNumber: guest.aadhaarNumber || '',
          aadhaarVerified: guest.aadhaarVerified || false,
          aadhaarData: guest.aadhaarData || null,
          specialRequests: guest.specialRequests || '',
        })),
        guestVerifications: allGuestInfoParam.map((guest: any) => ({
          firstName: guest.firstName || '',
          lastName: guest.lastName || '',
          phoneNumber: guest.phone || '',
          aadhaarNumber: guest.aadhaarNumber || '',
          verified: guest.aadhaarVerified || false,
          verificationDetails: guest.aadhaarData || null,
        })),
        unitPrice: parseFloat(params.totalPrice as string) / (actualBookingType === 'nightly' ? nights : 1) || roomData.price,
        totalPrice,
        taxesAndFees,
        totalAmount,
        paymentInfo: {
          method: 'razorpay',
          status: 'completed',
          orderId: verifyData.order_id || orderId,
          paymentId: verifyData.payment_id || paymentId,
          signature: signature,
        },
        status: 'pending',
        reference: bookingReference,
        customerPreferences: customerPreferences,
        customerVerification: {},
      };

      console.log('💾 Booking Data to Save (Razorpay):', {
        hotelAdmin: bookingData.hotelAdmin,
        hotelDetailsImage: bookingData.hotelDetails.image,
        roomDetailsImage: bookingData.roomDetails.image,
        reference: bookingData.reference,
      });

      await createBooking(bookingData);

      Alert.alert(
        '🎉 Payment Successful!',
        `Your booking is confirmed!\n\nBooking Reference: ${bookingReference}\n\nA confirmation email has been sent to ${user?.email}`,
        [
          {
            text: 'View Bookings',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert(
        'Booking Error',
        error.name === 'AbortError'
          ? 'Verification timed out. Your payment was successful but booking creation failed. Please contact support with your payment ID: ' + paymentId
          : 'Payment verification failed. Please contact support with your payment ID: ' + paymentId,
        [
          {
            text: 'Copy Payment ID',
            onPress: () => {
              // You can add clipboard functionality here if needed
              Alert.alert('Payment ID', paymentId);
            },
          },
          {
            text: 'OK',
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (!hotelData || !roomData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Payment information not available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary Card */}
        <View style={styles.summaryCard}>
          <Image 
            source={{ uri: (roomData.image || hotelData.image).replace(/\.avif$/, '.jpg') }} 
            style={styles.hotelImage} 
          />
          <View style={styles.summaryInfo}>
            <Text style={styles.hotelName}>{hotelData.name}</Text>
            <Text style={styles.roomType}>{roomData.type}</Text>
            <Text style={styles.dates}>
              {checkIn?.toLocaleDateString()} - {checkOut?.toLocaleDateString()}
            </Text>
            <Text style={styles.nights}>
              {bookingType === 'hourly' 
                ? `${hourlyDuration} hour${hourlyDuration !== 1 ? 's' : ''}`
                : `${nights} night${nights !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          <View style={styles.securePaymentBadge}>
            <Lock size={16} color="#00BFA6" />
            <Text style={styles.securePaymentText}>Secure Payment with Razorpay</Text>
          </View>
          <Text style={styles.paymentDescription}>
            Your payment is processed securely through Razorpay. We accept all major credit cards, debit cards, UPI, net banking, and wallets.
          </Text>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'online' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('online')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'online' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>💳 Pay Online</Text>
              <Text style={styles.paymentOptionDesc}>Secure payment via Razorpay</Text>
              <Text style={styles.paymentOptionSubDesc}>Credit/Debit Cards, UPI, Net Banking, Wallets</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'hotel' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('hotel')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'hotel' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>🏨 Pay at Hotel</Text>
              <Text style={styles.paymentOptionDesc}>Pay cash directly at the hotel</Text>
              <Text style={styles.paymentOptionSubDesc}>Hotel will process fees separately</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {bookingType === 'hourly' 
                ? `Hourly Rate (${hourlyDuration} hour${hourlyDuration !== 1 ? 's' : ''})`
                : `Room Price (${nights} night${nights !== 1 ? 's' : ''})`}
            </Text>
            <Text style={styles.priceValue}>₹{totalPrice}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxes & Fees (18%)</Text>
            <Text style={styles.priceValue}>₹{taxesAndFees}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabelBold}>Total Amount</Text>
            <Text style={styles.priceValueBold}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Lock size={16} color="#666" />
          <Text style={styles.securityText}>Your payment information is secure and encrypted</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#1A1A1A" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <WebView
            ref={webViewRef}
            source={{ html: paymentHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#00BFA6" />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 12 : 20,
    paddingVertical: isSmallDevice ? 12 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 4,
    marginRight: isSmallDevice ? 8 : 12,
  },
  headerSpacer: {
    width: isSmallDevice ? 32 : 40,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  roomType: {
    fontSize: 13,
    color: '#666',
  },
  dates: {
    fontSize: 12,
    color: '#666',
  },
  nights: {
    fontSize: 12,
    color: '#00BFA6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1A1A1A',
  },
  securePaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F8F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  securePaymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00BFA6',
  },
  paymentDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    borderColor: '#00BFA6',
    backgroundColor: '#E8F8F5',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00BFA6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00BFA6',
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paymentOptionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  paymentOptionSubDesc: {
    fontSize: 12,
    color: '#999',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  priceLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00BFA6',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  payButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
    marginLeft: 16,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
