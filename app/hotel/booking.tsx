import GuestSelector from '@/components/hotel/GuestSelector';
import TravelerTypeSelector from '@/components/booking/TravelerTypeSelector';
import DynamicTravelerTypeSelector from '@/components/booking/DynamicTravelerTypeSelector';
import DynamicPreferences from '@/components/booking/DynamicPreferences';
import SavedGuestSelector from '@/components/booking/SavedGuestSelector';
import AadhaarVerificationButton from '@/components/booking/AadhaarVerificationButton';
import { CustomerPreferences } from '@/types/booking';
import { useAuth } from '@/context/AuthContext';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  MapPin,
  MessageSquare,
  User,
  Clock,
  Check,
  CreditCard,
  Briefcase,
  Users as UsersIcon,
  Heart,
  UserPlus,
  X,
  CheckCircle
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, MotiText } from 'moti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  specialRequests: string;
  aadhaarVerified?: boolean;
  aadhaarData?: any;
}

interface SavedGuest {
  id: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  aadhaarNumber: string;
  aadhaarVerified?: boolean;
  aadhaarData?: any;
}

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Dates', 'Guests', 'Preferences', 'Review'];

  return (
    <View style={styles.stepsContainer}>
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum <= currentStep;
        const isCurrent = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <View key={index} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isCurrent && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted
              ]}>
                {isCompleted ? (
                  isActive /* Already handled by isCompleted */ ? <Check size={14} color="#FFF" /> : null
                ) : (
                  <Text style={[styles.stepNumber, isCurrent && styles.stepNumberActive]}>{stepNum}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>{step}</Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.stepLine, isActive && currentStep > stepNum && styles.stepLineActive]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userData } = useAuth();

  const hotelData = params.hotel ? (() => {
    try {
      return JSON.parse(params.hotel as string);
    } catch (e) {
      console.error('Error parsing hotel data:', e);
      return null;
    }
  })() : null;

  const roomData = params.room ? (() => {
    try {
      return JSON.parse(params.room as string);
    } catch (e) {
      console.error('Error parsing room data:', e);
      return null;
    }
  })() : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [guests, setGuests] = useState(1);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [showTravelerTypeSelector, setShowTravelerTypeSelector] = useState(false);
  const [showDynamicTravelerTypeSelector, setShowDynamicTravelerTypeSelector] = useState(false);
  const [additionalRequest, setAdditionalRequest] = useState('');

  // Predefined request options
  const predefinedRequests = [
    'Early check-in', 'Late check-out', 'High floor room', 'Quiet room',
    'Non-smoking room', 'Extra towels', 'Extra pillows', 'Room service'
  ];

  // Helper function to get current requests as array
  const getCurrentRequests = () => {
    if (!additionalRequest.trim()) return [];
    return additionalRequest.split(',').map(req => req.trim()).filter(req => req.length > 0);
  };

  // Helper function to check if a request is selected
  const isRequestSelected = (request: string) => {
    const currentRequests = getCurrentRequests();
    return currentRequests.includes(request);
  };

  // Helper function to toggle request selection
  const toggleRequest = (request: string) => {
    const currentRequests = getCurrentRequests();
    let newRequests;

    if (currentRequests.includes(request)) {
      newRequests = currentRequests.filter(req => req !== request);
    } else {
      newRequests = [...currentRequests, request];
    }

    setAdditionalRequest(newRequests.join(', '));
  };

  const [paymentMode, setPaymentMode] = useState<'online' | 'hotel'>('online');
  const [savedGuests, setSavedGuests] = useState<SavedGuest[]>([]);
  const [showSavedGuestSelector, setShowSavedGuestSelector] = useState(false);
  const [selectingGuestIndex, setSelectingGuestIndex] = useState<number>(0);

  // Hourly booking states
  const [bookingType, setBookingType] = useState<'nightly' | 'hourly'>(
    roomData?.bookingType === 'hourly' ? 'hourly' : 'nightly'
  );
  const [selectedHourlyRate, setSelectedHourlyRate] = useState<{ hours: number; price: number } | null>(null);

  // Customer preferences
  const [customerPreferences, setCustomerPreferences] = useState<CustomerPreferences>({});
  const [preferencesPrice, setPreferencesPrice] = useState<number>(0);
  const [preferencesPriceBreakdown, setPreferencesPriceBreakdown] = useState<Array<{ label: string; price: number; quantity?: number }>>([]);

  // Pre-checkin verification helpers
  const checkCustomerVerified = () => {
    return userData?.aadhaarData?.verified === true;
  };

  const checkAllGuestsVerified = () => {
    return guestInfoList.every(guest => guest.aadhaarVerified === true);
  };

  const checkAllVerificationComplete = () => {
    const customerVerified = checkCustomerVerified();
    const allGuestsVerified = checkAllGuestsVerified();
    return customerVerified && allGuestsVerified;
  };

  const getVerificationStatus = () => {
    const customerVerified = checkCustomerVerified();
    const allGuestsVerified = checkAllGuestsVerified();
    const unverifiedGuests = guestInfoList.filter(guest => !guest.aadhaarVerified);

    return {
      customerVerified,
      allGuestsVerified,
      unverifiedGuests,
      allComplete: customerVerified && allGuestsVerified
    };
  };

  const handlePreCheckinToggle = (enabled: boolean) => {
    if (enabled) {
      const verificationStatus = getVerificationStatus();

      if (!verificationStatus.customerVerified) {
        Alert.alert(
          'Aadhaar Verification Required',
          'Your Aadhaar verification is required to enable pre-checkin. Please verify your identity in your profile first.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!verificationStatus.allGuestsVerified) {
        const unverifiedNames = verificationStatus.unverifiedGuests
          .map(guest => `${guest.firstName} ${guest.lastName || ''}`.trim())
          .join(', ');
        Alert.alert(
          'Guest Verification Required',
          `The following guests need Aadhaar verification to enable pre-checkin: ${unverifiedNames}. Please verify all guest Aadhaar numbers first.`,
          [{ text: 'OK' }]
        );
        return;
      }

      if (verificationStatus.allComplete) {
        setCustomerPreferences(prev => ({ ...prev, preCheckinEnabled: true }));
      }
    } else {
      setCustomerPreferences(prev => ({ ...prev, preCheckinEnabled: false }));
    }
  };

  const handleGuestVerificationComplete = (guestIndex: number, verificationData: any) => {
    const updatedGuests = [...guestInfoList];
    updatedGuests[guestIndex] = {
      ...updatedGuests[guestIndex],
      aadhaarVerified: true,
      aadhaarData: verificationData,
      aadhaarNumber: verificationData.aadhaarNumber,
    };
    setGuestInfoList(updatedGuests);

    Alert.alert(
      'Verification Successful',
      `${updatedGuests[guestIndex].firstName} ${updatedGuests[guestIndex].lastName}'s Aadhaar has been verified successfully.`,
      [{ text: 'OK' }]
    );
  };

  const handleCustomerVerification = () => {
    Alert.alert(
      'Customer Verification',
      'This would redirect you to your profile to complete Aadhaar verification. Please complete your verification in the Profile section.',
      [{ text: 'OK' }]
    );
  };

  // Guest information for each guest
  const [guestInfoList, setGuestInfoList] = useState<GuestInfo[]>([
    {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      aadhaarNumber: '',
      specialRequests: '',
    },
  ]);

  const calculateNights = () => {
    if (checkInDate && checkOutDate) {
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const calculateTotalPrice = () => {
    if (bookingType === 'hourly' && selectedHourlyRate) {
      return selectedHourlyRate.price + preferencesPrice;
    }
    const nights = calculateNights();
    return (roomData?.price || 0) * nights + preferencesPrice;
  };

  const calculateTaxes = () => {
    const totalPrice = calculateTotalPrice();
    return Math.round(totalPrice * 0.18); // 18% tax
  };

  const calculateTotalAmount = () => {
    return calculateTotalPrice() + calculateTaxes();
  };

  const getCheckOutDateTime = () => {
    if (bookingType === 'hourly' && selectedHourlyRate && checkInDate) {
      const checkOut = new Date(checkInDate);
      checkOut.setHours(checkOut.getHours() + selectedHourlyRate.hours);
      return checkOut;
    }
    return checkOutDate;
  };

  const showCheckInDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: checkInDate || new Date(),
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            if (bookingType === 'hourly') {
              const now = new Date();
              const roundedTime = new Date(now);
              const minutes = now.getMinutes();
              const roundedMinutes = minutes <= 30 ? 30 : 0;
              if (minutes > 30) {
                roundedTime.setHours(roundedTime.getHours() + 1);
              }
              roundedTime.setMinutes(roundedMinutes);
              roundedTime.setSeconds(0);

              DateTimePickerAndroid.open({
                value: roundedTime,
                mode: 'time',
                is24Hour: false,
                onChange: (timeEvent, selectedTime) => {
                  if (timeEvent.type === 'set' && selectedTime) {
                    const combinedDateTime = new Date(selectedDate);
                    combinedDateTime.setHours(selectedTime.getHours());
                    combinedDateTime.setMinutes(selectedTime.getMinutes());
                    combinedDateTime.setSeconds(0);

                    setCheckInDate(combinedDateTime);
                    if (checkOutDate && combinedDateTime >= checkOutDate) {
                      setCheckOutDate(null);
                    }
                  }
                },
              });
            } else {
              setCheckInDate(selectedDate);
              if (checkOutDate && selectedDate >= checkOutDate) {
                setCheckOutDate(null);
              }
            }
          }
        },
      });
    } else {
      setShowCheckInPicker(true);
    }
  };

  const showCheckOutDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: checkOutDate || new Date((checkInDate?.getTime() || Date.now()) + 86400000),
        mode: 'date',
        minimumDate: checkInDate ? new Date(checkInDate.getTime() + 86400000) : new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            if (checkInDate && selectedDate > checkInDate) {
              setCheckOutDate(selectedDate);
            } else if (checkInDate && selectedDate <= checkInDate) {
              Alert.alert('Invalid Date', 'Check-out date must be after check-in date');
            }
          }
        },
      });
    } else {
      setShowCheckOutPicker(true);
    }
  };

  const updateGuestInfo = (index: number, field: keyof GuestInfo, value: string) => {
    const updatedGuests = [...guestInfoList];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setGuestInfoList(updatedGuests);
  };

  // Load saved guests
  useEffect(() => {
    if (userData?.savedGuests) {
      setSavedGuests(userData.savedGuests);
    }
  }, [userData]);

  const handleGuestCountChange = (count: number) => {
    setGuests(count);
    const newGuestList = Array.from({ length: count }, (_, index) => {
      return guestInfoList[index] || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        aadhaarNumber: '',
        specialRequests: '',
      };
    });
    setGuestInfoList(newGuestList);
  };

  const handleSelectSavedGuest = (guest: SavedGuest) => {
    const updatedGuests = [...guestInfoList];
    updatedGuests[selectingGuestIndex] = {
      firstName: guest.firstName,
      lastName: guest.lastName || '',
      email: selectingGuestIndex === 0 ? updatedGuests[selectingGuestIndex].email : '',
      phone: guest.phoneNumber || '',
      aadhaarNumber: guest.aadhaarNumber,
      specialRequests: updatedGuests[selectingGuestIndex].specialRequests || '',
      aadhaarVerified: guest.aadhaarVerified || false,
      aadhaarData: guest.aadhaarData,
    };
    setGuestInfoList(updatedGuests);
    setShowSavedGuestSelector(false);

    // Show success message
    Alert.alert(
      'Guest Selected',
      `${guest.firstName} ${guest.lastName || ''} has been selected for Guest ${selectingGuestIndex + 1}.${guest.aadhaarVerified ? ' Aadhaar verification is already complete.' : ' Please complete Aadhaar verification.'}`,
      [{ text: 'OK' }]
    );
  };

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentStep]);

  const validateGuestInfo = () => {
    for (let i = 0; i < guestInfoList.length; i++) {
      const guest = guestInfoList[i];
      if (!guest.firstName.trim() || !guest.lastName.trim()) {
        Alert.alert('Required', 'Please enter full names for all guests');
        return false;
      }
    }
    return true;
  };

  const handleTravelerTypeSelect = (type: 'corporate' | 'family' | 'couple' | 'transit' | 'event') => {
    setCustomerPreferences({
      ...customerPreferences,
      travelerType: type,
    });
    setShowTravelerTypeSelector(false);
    setCurrentStep(2);
  };

  const handleDynamicTravelerTypeSelect = (typeId: string) => {
    setCustomerPreferences({
      ...customerPreferences,
      travelerTypeId: typeId,
      dynamicPreferences: {}, // Reset preferences when type changes
    });
    setShowDynamicTravelerTypeSelector(false);
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!checkInDate) {
        Alert.alert('Required', 'Please select check-in date');
        return;
      }
      if (bookingType === 'hourly') {
        if (!selectedHourlyRate) {
          Alert.alert('Required', 'Please select duration for hourly booking');
          return;
        }
      } else {
        if (!checkOutDate) {
          Alert.alert('Required', 'Please select check-out date');
          return;
        }
      }
      if (guests < 1) {
        Alert.alert('Required', 'Please select number of guests');
        return;
      }
      // Show dynamic traveler type selector
      setShowDynamicTravelerTypeSelector(true);
    } else if (currentStep === 2) {
      if (!validateGuestInfo()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      handlePayment();
    }
  };

  const handlePayment = () => {
    const checkOut = bookingType === 'hourly' ? getCheckOutDateTime() : checkOutDate;

    router.push({
      pathname: '/hotel/payment' as any,
      params: {
        hotel: JSON.stringify(hotelData),
        room: JSON.stringify(roomData),
        checkIn: checkInDate?.toISOString(),
        checkOut: checkOut?.toISOString(),
        guests: guests.toString(),
        guestInfo: JSON.stringify(guestInfoList[0]),
        allGuestInfo: JSON.stringify(guestInfoList),
        customerPreferences: JSON.stringify(customerPreferences),
        paymentMode,
        totalAmount: calculateTotalAmount().toString(),
        totalPrice: calculateTotalPrice().toString(),
        taxesAndFees: calculateTaxes().toString(),
        preferencesPrice: preferencesPrice.toString(),
        preferencesPriceBreakdown: JSON.stringify(preferencesPriceBreakdown),
        nights: bookingType === 'nightly' ? calculateNights().toString() : '0',
        bookingType: bookingType,
        hourlyDuration: bookingType === 'hourly' && selectedHourlyRate ? selectedHourlyRate.hours.toString() : undefined,
        additionalRequest: additionalRequest,
      },
    });
  };

  if (!hotelData || !roomData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Booking information not available</Text>
      </View>
    );
  }

  // --- Render Sections ---

  const renderDateSelection = () => (
    <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100 }}>
      {roomData?.bookingType === 'both' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, bookingType === 'nightly' && styles.tabButtonActive]}
            onPress={() => { setBookingType('nightly'); setSelectedHourlyRate(null); }}
          >
            <Text style={[styles.tabText, bookingType === 'nightly' && styles.tabTextActive]}>Nightly Stay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, bookingType === 'hourly' && styles.tabButtonActive]}
            onPress={() => { setBookingType('hourly'); setCheckOutDate(null); }}
          >
            <Text style={[styles.tabText, bookingType === 'hourly' && styles.tabTextActive]}>Hourly Stay</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Select Dates</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateInput} onPress={showCheckInDatePicker}>
            <Text style={styles.inputLabel}>Check-in</Text>
            <View style={styles.inputContent}>
              <Calendar size={20} color="#111827" />
              <Text style={styles.inputValue}>
                {checkInDate ? checkInDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
              </Text>
            </View>
            {bookingType === 'hourly' && checkInDate && (
              <Text style={styles.inputSubtext}>
                {checkInDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            )}
          </TouchableOpacity>

          {bookingType === 'nightly' ? (
            <TouchableOpacity style={styles.dateInput} onPress={showCheckOutDatePicker}>
              <Text style={styles.inputLabel}>Check-out</Text>
              <View style={styles.inputContent}>
                <Calendar size={20} color="#111827" />
                <Text style={styles.inputValue}>
                  {checkOutDate ? checkOutDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>Checkout Time</Text>
              <View style={styles.inputContent}>
                <Clock size={20} color="#6B7280" />
                <Text style={styles.inputValue}>
                  {selectedHourlyRate && checkInDate
                    ? getCheckOutDateTime()?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    : '--:--'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {bookingType === 'hourly' && roomData.hourlyRates && (
        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Select Duration</Text>
          <View style={styles.hourlyRatesContainer}>
            {roomData.hourlyRates.map((rate: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.hourlyRateCard,
                  selectedHourlyRate?.hours === rate.hours && styles.hourlyRateCardActive
                ]}
                onPress={() => setSelectedHourlyRate(rate)}
              >
                <Text style={[styles.hourlyRateTime, selectedHourlyRate?.hours === rate.hours && styles.textWhite]}>
                  {rate.hours} Hours
                </Text>
                <Text style={[styles.hourlyRatePrice, selectedHourlyRate?.hours === rate.hours && styles.textWhite]}>
                  ₹{rate.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Guests & Rooms</Text>
        <TouchableOpacity
          style={styles.guestSelector}
          onPress={() => setShowGuestSelector(true)}
        >
          <UsersIcon size={20} color="#111827" />
          <Text style={styles.guestCountText}>{guests} Guest{guests > 1 ? 's' : ''}, 1 Room</Text>
          <ChevronRight size={20} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  const renderGuestDetails = () => (
    <MotiView from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }}>
      {guestInfoList.map((guest, index) => (
        <View key={index} style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>{index === 0 ? 'Primary Guest' : `Guest ${index + 1}`}</Text>
            <View style={styles.cardHeaderActions}>
              {savedGuests.length > 0 && (
                <TouchableOpacity onPress={() => { setSelectingGuestIndex(index); setShowSavedGuestSelector(true); }}>
                  <Text style={styles.linkText}>Select Saved</Text>
                </TouchableOpacity>
              )}
              {!guest.aadhaarVerified && guest.firstName && guest.lastName && (
                <AadhaarVerificationButton
                  guestIndex={index}
                  guestName={`${guest.firstName} ${guest.lastName}`}
                  onVerificationComplete={(data) => handleGuestVerificationComplete(index, data)}
                  style={styles.smallVerifyButton}
                />
              )}
              {guest.aadhaarVerified && (
                <View style={styles.verifiedBadge}>
                  <Check size={12} color="#059669" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.formGap}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelSmall}>First Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter first name"
                value={guest.firstName}
                onChangeText={(text) => updateGuestInfo(index, 'firstName', text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelSmall}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter last name"
                value={guest.lastName}
                onChangeText={(text) => updateGuestInfo(index, 'lastName', text)}
              />
            </View>
            {/* Phone field for all guests */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelSmall}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
                value={guest.phone}
                onChangeText={(text) => updateGuestInfo(index, 'phone', text)}
              />
            </View>

            {/* Email field only for primary guest */}
            {index === 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelSmall}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  value={guest.email}
                  onChangeText={(text) => updateGuestInfo(index, 'email', text)}
                />
              </View>
            )}

            {/* Aadhaar number field for all guests */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelSmall}>Aadhaar Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="XXXX XXXX XXXX"
                keyboardType="numeric"
                value={guest.aadhaarNumber}
                onChangeText={(text) => {
                  // Format Aadhaar number with spaces
                  const value = text.replace(/\D/g, '').slice(0, 12);
                  const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                  updateGuestInfo(index, 'aadhaarNumber', formatted);
                }}
                maxLength={14} // 12 digits + 2 spaces
              />
              <Text style={styles.inputHelperText}>
                Enter 12-digit Aadhaar number for identity verification
              </Text>

              {/* Verification status and button */}
              <View style={styles.guestVerificationStatusContainer}>
                {guest.aadhaarVerified ? (
                  <View style={styles.verificationSuccessContainer}>
                    <Check size={14} color="#059669" />
                    <Text style={styles.verificationSuccessText}>Aadhaar Verified</Text>
                  </View>
                ) : (
                  guest.firstName && guest.lastName && guest.aadhaarNumber && guest.aadhaarNumber.replace(/\s/g, '').length === 12 && (
                    <AadhaarVerificationButton
                      guestIndex={index}
                      guestName={`${guest.firstName} ${guest.lastName}`}
                      onVerificationComplete={(data) => handleGuestVerificationComplete(index, data)}
                      style={styles.guestVerificationButton}
                    />
                  )
                )}
              </View>
            </View>

            {/* Special requests only for primary guest */}
            {index === 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabelSmall}>Special Requests</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="Any special needs or preferences..."
                  value={guest.specialRequests}
                  onChangeText={(text) => updateGuestInfo(index, 'specialRequests', text)}
                />
              </View>
            )}
          </View>
        </View>
      ))}
    </MotiView>
  );

  const renderPreferences = () => (
    <MotiView from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }}>
      {/* Traveler Type Selection */}
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Room Preferences</Text>
        <Text style={styles.subtext}>Select your traveler type to customize preferences</Text>

        <TouchableOpacity
          style={styles.travelerTypeButton}
          onPress={() => setShowDynamicTravelerTypeSelector(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.travelerTypeButtonText}>
            {customerPreferences.travelerTypeId ? 'Change Traveler Type' : 'Select Traveler Type'}
          </Text>
          <ChevronRight size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Dynamic Preferences - Show when traveler type is selected */}
      {customerPreferences.travelerTypeId && (
        <DynamicPreferences
          travelerTypeId={customerPreferences.travelerTypeId}
          preferences={customerPreferences.dynamicPreferences || {}}
          onPreferencesChange={(prefs, totalPrice, breakdown) => {
            setCustomerPreferences(prev => ({
              ...prev,
              dynamicPreferences: prefs
            }));
            if (totalPrice !== undefined) {
              setPreferencesPrice(totalPrice);
            }
            if (breakdown) {
              setPreferencesPriceBreakdown(breakdown);
            }
          }}
        />
      )}

      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Additional Requests</Text>
        <Text style={styles.subtext}>Select any special requests (subject to availability)</Text>
        <View style={styles.chipsContainer}>
          {predefinedRequests.map((req, idx) => {
            const isSelected = isRequestSelected(req);
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => toggleRequest(req)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{req}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabelSmall}>Other Requests</Text>
          <TextInput
            style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
            multiline
            placeholder="Any other preferences..."
          />
        </View>
      </View>

      {/* Pre-checkin Section */}
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Pre-Checkin Option</Text>
        <Text style={styles.subtext}>Skip the front desk and go directly to your room</Text>

        {/* Verification Status */}
        <View style={styles.verificationStatusContainer}>
          <View style={styles.verificationItem}>
            <View style={styles.verificationIconContainer}>
              {checkCustomerVerified() ? (
                <Check size={16} color="#059669" />
              ) : (
                <X size={16} color="#DC2626" />
              )}
            </View>
            <Text style={[styles.verificationText, checkCustomerVerified() && styles.verificationTextSuccess]}>
              Your Aadhaar Verification
            </Text>
            {!checkCustomerVerified() && (
              <TouchableOpacity style={styles.verifyButton} onPress={handleCustomerVerification}>
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.verificationItem}>
            <View style={styles.verificationIconContainer}>
              {checkAllGuestsVerified() ? (
                <Check size={16} color="#059669" />
              ) : (
                <X size={16} color="#DC2626" />
              )}
            </View>
            <Text style={[styles.verificationText, checkAllGuestsVerified() && styles.verificationTextSuccess]}>
              All Guests Aadhaar Verification
            </Text>
            {!checkAllGuestsVerified() && (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => {
                  const unverifiedGuests = guestInfoList
                    .map((guest, index) => ({ guest, index }))
                    .filter(({ guest }) => !guest.aadhaarVerified);

                  if (unverifiedGuests.length > 0) {
                    const { guest, index } = unverifiedGuests[0];
                    Alert.alert(
                      'Guest Verification',
                      `Verify Aadhaar for ${guest.firstName} ${guest.lastName}`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Verify',
                          onPress: () => {
                            // Simulate verification for demo
                            handleGuestVerificationComplete(index, {
                              aadhaarNumber: '1234567890XX',
                              fullName: `${guest.firstName} ${guest.lastName}`,
                              verified: true,
                              verifiedAt: new Date(),
                              dateOfBirth: '01/01/1990',
                              address: 'Sample Address, City, State - 123456',
                              phoneNumber: guest.phone || '+91 9876543210'
                            });
                          }
                        }
                      ]
                    );
                  }
                }}
              >
                <Text style={styles.verifyButtonText}>Verify Guests</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Pre-checkin Toggle */}
        <View style={[styles.preCheckinToggleContainer, !checkAllVerificationComplete() && styles.preCheckinDisabled]}>
          <TouchableOpacity
            style={styles.preCheckinToggle}
            onPress={() => handlePreCheckinToggle(!customerPreferences.preCheckinEnabled)}
            disabled={!checkAllVerificationComplete()}
          >
            <View style={styles.preCheckinContent}>
              <View style={styles.preCheckinIcon}>
                <UserPlus size={20} color={customerPreferences.preCheckinEnabled ? "#059669" : "#6B7280"} />
              </View>
              <View style={styles.preCheckinTextContainer}>
                <Text style={[styles.preCheckinTitle, customerPreferences.preCheckinEnabled && styles.preCheckinTitleActive]}>
                  Enable Pre-Checkin
                </Text>
                <Text style={styles.preCheckinDescription}>
                  Skip front desk verification and go directly to your room
                </Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, customerPreferences.preCheckinEnabled && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, customerPreferences.preCheckinEnabled && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {customerPreferences.preCheckinEnabled && (
          <View style={styles.preCheckinSuccessContainer}>
            <CheckCircle size={16} color="#059669" />
            <Text style={styles.preCheckinSuccessText}>
              Pre-checkin activated! You'll receive confirmation details after booking.
            </Text>
          </View>
        )}

        {!checkAllVerificationComplete() && (
          <View style={styles.preCheckinWarningContainer}>
            <Text style={styles.preCheckinWarningText}>
              Complete Aadhaar verification for all guests to enable pre-checkin
            </Text>
          </View>
        )}
      </View>
    </MotiView>
  );

  // Helper function to render dynamic preferences summary
  const renderDynamicPreferencesSummary = () => {
    if (!customerPreferences.dynamicPreferences || Object.keys(customerPreferences.dynamicPreferences).length === 0) {
      return null;
    }

    const preferences = customerPreferences.dynamicPreferences;
    const hasAnyPreferences = Object.values(preferences).some(category =>
      category && Object.values(category).some(value =>
        value !== null && value !== undefined && value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true)
      )
    );

    if (!hasAnyPreferences) {
      return null;
    }

    return (
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Selected Preferences</Text>
        {Object.entries(preferences).map(([categoryId, categoryPrefs]) => {
          if (!categoryPrefs || Object.keys(categoryPrefs).length === 0) return null;

          const hasValidPrefs = Object.values(categoryPrefs).some(value =>
            value !== null && value !== undefined && value !== '' &&
            (Array.isArray(value) ? value.length > 0 : true)
          );

          if (!hasValidPrefs) return null;

          return (
            <View key={categoryId} style={styles.preferenceCategoryContainer}>
              <Text style={styles.preferenceCategoryTitle}>
                {categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              {Object.entries(categoryPrefs).map(([optionId, value]) => {
                if (value === null || value === undefined || value === '' ||
                  (Array.isArray(value) && value.length === 0)) {
                  return null;
                }

                return (
                  <View key={optionId} style={styles.preferenceItem}>
                    <Text style={styles.preferenceLabel}>
                      {optionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </Text>
                    <Text style={styles.preferenceValue}>
                      {Array.isArray(value) ? value.join(', ') :
                        typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                          value.toString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  };

  const renderReview = () => (
    <MotiView from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }}>
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Review Booking</Text>
        <View style={styles.reviewRow}>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Check-in</Text>
            <Text style={styles.reviewValue}>
              {checkInDate ? checkInDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '-'}
            </Text>
            <Text style={styles.reviewSubValue}>
              {checkInDate?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Check-out</Text>
            <Text style={styles.reviewValue}>
              {bookingType === 'hourly'
                ? getCheckOutDateTime()?.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                : checkOutDate?.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
              }
            </Text>
            <Text style={styles.reviewSubValue}>
              {bookingType === 'hourly'
                ? getCheckOutDateTime()?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : '11:00 AM'
              }
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.reviewDetailRow}>
          <Text style={styles.reviewDetailLabel}>Room Type</Text>
          <Text style={styles.reviewDetailValue}>{roomData.type}</Text>
        </View>
        <View style={styles.reviewDetailRow}>
          <Text style={styles.reviewDetailLabel}>Guests</Text>
          <Text style={styles.reviewDetailValue}>{guests} Guests, 1 Room</Text>
        </View>
        <View style={styles.reviewDetailRow}>
          <Text style={styles.reviewDetailLabel}>Primary Guest</Text>
          <Text style={styles.reviewDetailValue}>{guestInfoList[0].firstName} {guestInfoList[0].lastName}</Text>
        </View>
        {customerPreferences.preCheckinEnabled && (
          <View style={styles.reviewDetailRow}>
            <Text style={styles.reviewDetailLabel}>Check-in Type</Text>
            <Text style={[styles.reviewDetailValue, { color: '#059669' }]}>Pre-checkin ✓</Text>
          </View>
        )}
      </View>

      {/* Dynamic Preferences Summary */}
      {renderDynamicPreferencesSummary()}

      {/* Pre-checkin Confirmation */}
      {customerPreferences.preCheckinEnabled && (
        <View style={styles.cardContainer}>
          <View style={styles.preCheckinConfirmationHeader}>
            <CheckCircle size={20} color="#059669" />
            <Text style={styles.preCheckinConfirmationTitle}>Pre-checkin Activated</Text>
          </View>
          <Text style={styles.preCheckinConfirmationText}>
            Skip the front desk and go directly to your room! You'll receive pre-checkin confirmation details after booking completion.
          </Text>
          <View style={styles.preCheckinBenefits}>
            <View style={styles.preCheckinBenefit}>
              <Check size={14} color="#059669" />
              <Text style={styles.preCheckinBenefitText}>No waiting at reception</Text>
            </View>
            <View style={styles.preCheckinBenefit}>
              <Check size={14} color="#059669" />
              <Text style={styles.preCheckinBenefitText}>Direct room access</Text>
            </View>
            <View style={styles.preCheckinBenefit}>
              <Check size={14} color="#059669" />
              <Text style={styles.preCheckinBenefitText}>Faster check-in process</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <View style={styles.priceRowItem}>
          <Text style={styles.priceLabel}>
            Room Charges {bookingType === 'hourly'
              ? `(${selectedHourlyRate?.hours || 0} hrs)`
              : `(${calculateNights()} nights)`}
          </Text>
          <Text style={styles.priceValue}>
            ₹{bookingType === 'hourly' && selectedHourlyRate
              ? selectedHourlyRate.price
              : (roomData?.price || 0) * calculateNights()}
          </Text>
        </View>
        {preferencesPrice > 0 && (
          <View style={styles.priceRowItem}>
            <Text style={styles.priceLabel}>Preferences & Add-ons</Text>
            <Text style={[styles.priceValue, { color: '#059669' }]}>₹{preferencesPrice}</Text>
          </View>
        )}
        <View style={styles.priceRowItem}>
          <Text style={styles.priceLabel}>Taxes & Fees (18%)</Text>
          <Text style={styles.priceValue}>₹{calculateTaxes()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceRowTotal}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{calculateTotalAmount()}</Text>
        </View>
      </View>

      <View style={styles.paymentNote}>
        <CreditCard size={16} color="#6B7280" />
        <Text style={styles.paymentNoteText}>Payment will be collected at the hotel or via online options in next step.</Text>
      </View>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (currentStep > 1) setCurrentStep(currentStep - 1);
            else router.back();
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      {/* Stepper */}
      <StepIndicator currentStep={currentStep} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hotel Summary Card - Always Visible */}
        <View style={styles.hotelSummary}>
          <Image
            source={{ uri: (roomData?.image || hotelData?.image || '').replace(/\.avif$/, '.jpg') }}
            style={styles.hotelThumb}
          />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName} numberOfLines={1}>{hotelData?.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>{hotelData?.location}</Text>
            </View>
            <Text style={styles.roomTypeChip}>{roomData?.type}</Text>
          </View>
          <View style={styles.hotelPriceCol}>
            <Text style={styles.priceMain}>₹{roomData?.price}</Text>
            <Text style={styles.pricePer}>/night</Text>
          </View>
        </View>

        {/* Render Step Content */}
        {currentStep === 1 && renderDateSelection()}
        {currentStep === 2 && renderGuestDetails()}
        {currentStep === 3 && renderPreferences()}
        {currentStep === 4 && renderReview()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerTotalLabel}>Total Price</Text>
          <Text style={styles.footerTotalValue}>₹{calculateTotalAmount()}</Text>
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === 4 ? 'Confirm Booking' : 'Continue'}
          </Text>
          <ChevronRight size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <GuestSelector
        visible={showGuestSelector}
        onClose={() => setShowGuestSelector(false)}
        guests={guests}
        onGuestsChange={handleGuestCountChange}
        rooms={1}
        onRoomsChange={() => { }}
      />

      <TravelerTypeSelector
        visible={showTravelerTypeSelector}
        onClose={() => setShowTravelerTypeSelector(false)}
        selectedType={customerPreferences.travelerType || 'couple'}
        onSelect={handleTravelerTypeSelect}
      />

      <SavedGuestSelector
        visible={showSavedGuestSelector}
        onClose={() => setShowSavedGuestSelector(false)}
        guests={savedGuests}
        onSelect={handleSelectSavedGuest}
        guestIndex={selectingGuestIndex}
      />

      <DynamicTravelerTypeSelector
        visible={showDynamicTravelerTypeSelector}
        onClose={() => setShowDynamicTravelerTypeSelector(false)}
        selectedType={customerPreferences.travelerTypeId || ''}
        onSelect={handleDynamicTravelerTypeSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },

  // Steps
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#111827', // Black for active
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  stepCircleCompleted: {
    backgroundColor: '#111827',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#111827', // Black label
    fontWeight: '700',
  },
  stepLine: {
    position: 'absolute',
    top: 13,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: '#111827', // Black line
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Hotel Summary
  hotelSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  hotelThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  hotelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  roomTypeChip: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    marginTop: 4,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotelPriceCol: {
    alignItems: 'flex-end',
  },
  priceMain: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pricePer: {
    fontSize: 11,
    color: '#6B7280',
  },

  // Common Card
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },

  // Date Inputs
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  inputSubtext: {
    fontSize: 11,
    color: '#374151',
    marginTop: 4,
    fontWeight: '500',
  },

  // Guest Selector
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  guestCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  // Inputs
  formGap: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  smallVerifyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600',
  },

  // Preferences
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#F1F5F9', // Slate 100
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#1E293B', // Slate 800
    borderColor: '#1E293B',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  // Review Section
  reviewRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  reviewItem: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  reviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  reviewSubValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  reviewDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  priceRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  priceRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  paymentNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  paymentNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },

  // Hourly Rate Cards
  hourlyRatesContainer: {
    gap: 12,
  },
  hourlyRateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hourlyRateCardActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  hourlyRateTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  hourlyRatePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  textWhite: {
    color: '#FFF',
  },

  // Pre-checkin Styles
  verificationStatusContainer: {
    marginBottom: 20,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  verificationIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  verificationText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  verificationTextSuccess: {
    color: '#059669',
  },
  verifyButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  preCheckinToggleContainer: {
    marginBottom: 16,
  },
  preCheckinDisabled: {
    opacity: 0.5,
  },
  preCheckinToggle: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preCheckinContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  preCheckinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preCheckinTextContainer: {
    flex: 1,
  },
  preCheckinTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  preCheckinTitleActive: {
    color: '#059669',
  },
  preCheckinDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
    alignSelf: 'flex-end',
  },
  toggleSwitchActive: {
    backgroundColor: '#059669',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  preCheckinSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  preCheckinSuccessText: {
    flex: 1,
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
  },
  preCheckinWarningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
  },
  preCheckinWarningText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  preCheckinConfirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  preCheckinConfirmationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  preCheckinConfirmationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
    lineHeight: 20,
  },
  preCheckinBenefits: {
    gap: 8,
  },
  preCheckinBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preCheckinBenefitText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
  },
  inputHelperText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  guestVerificationStatusContainer: {
    marginTop: 8,
  },
  verificationSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  verificationSuccessText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  guestVerificationButton: {
    alignSelf: 'flex-start',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerPrice: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  nextButton: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Traveler Type Button
  travelerTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  travelerTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F293B',
  },

  // Dynamic Preferences Summary
  preferenceCategoryContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 12,
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
});
