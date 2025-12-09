import GuestSelector from '@/components/hotel/GuestSelector';
import TravelerTypeSelector from '@/components/booking/TravelerTypeSelector';
import CorporatePreferences from '@/components/booking/CorporatePreferences';
import CouplePreferences from '@/components/booking/CouplePreferences';
import FamilyPreferences from '@/components/booking/FamilyPreferences';
import TransitSoloPreferences from '@/components/booking/TransitSoloPreferences';
import EventGroupPreferences from '@/components/booking/EventGroupPreferences';
import SavedGuestSelector from '@/components/booking/SavedGuestSelector';
import { CustomerPreferences } from '@/types/booking';
import { useAuth } from '@/context/AuthContext';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  MapPin,
  MessageSquare,
  User,
  Heart,
  Briefcase,
  Users as UsersIcon,
  UserPlus
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;

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

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userData } = useAuth();
  
  const hotelData = params.hotel ? JSON.parse(params.hotel as string) : null;
  const roomData = params.room ? JSON.parse(params.room as string) : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [guests, setGuests] = useState(1);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [showTravelerTypeSelector, setShowTravelerTypeSelector] = useState(false);
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'online' | 'hotel'>('online');
  
  // Saved guests
  const [savedGuests, setSavedGuests] = useState<SavedGuest[]>([]);
  const [showSavedGuestSelector, setShowSavedGuestSelector] = useState(false);
  const [selectingGuestIndex, setSelectingGuestIndex] = useState<number>(0);
  
  // Hourly booking states
  const [bookingType, setBookingType] = useState<'nightly' | 'hourly'>(
    roomData?.bookingType === 'hourly' ? 'hourly' : 'nightly'
  );
  const [selectedHourlyRate, setSelectedHourlyRate] = useState<{ hours: number; price: number } | null>(null);
  const [showTimeSlotPicker, setShowTimeSlotPicker] = useState(false);
  
  // Customer preferences
  const [customerPreferences, setCustomerPreferences] = useState<CustomerPreferences>({});
  
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
      return selectedHourlyRate.price;
    }
    const nights = calculateNights();
    return (roomData?.price || 0) * nights;
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

  // Check if hourly booking extends beyond same day
  const checkSameDayBooking = (hours: number): { isValid: boolean; maxHours: number; message: string } => {
    if (!checkInDate) {
      return { isValid: true, maxHours: hours, message: '' };
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkInDate);
    checkOut.setHours(checkOut.getHours() + hours);

    // Check if checkout is on a different day
    const isSameDay = checkIn.toDateString() === checkOut.toDateString();

    if (!isSameDay) {
      // Calculate maximum hours allowed for same day
      const endOfDay = new Date(checkIn);
      endOfDay.setHours(23, 59, 59, 999);
      const maxHours = Math.floor((endOfDay.getTime() - checkIn.getTime()) / (1000 * 60 * 60));

      const checkInTime = checkIn.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      return {
        isValid: false,
        maxHours,
        message: `Selected duration extends beyond the same day. Maximum duration from ${checkInTime} is ${maxHours} hour${maxHours !== 1 ? 's' : ''}.`
      };
    }

    return { isValid: true, maxHours: hours, message: '' };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Generate time slots for check-in (every 30 minutes from next available slot to 11:30 PM)
  const generateTimeSlots = (): Array<{ value: Date; display: string }> => {
    const slots: Array<{ value: Date; display: string }> = [];
    const now = new Date();
    const selectedDate = checkInDate || now;
    
    // Check if selected date is today
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    let startHour = isToday ? now.getHours() : 0;
    let startMinute = 0;
    
    if (isToday) {
      // For today, start from the next 30-minute slot after current time
      const currentMinute = now.getMinutes();
      if (currentMinute < 30) {
        startMinute = 30;
      } else {
        // If past 30 minutes, move to next hour
        startHour += 1;
        startMinute = 0;
      }
      
      // If we've gone past 11:30 PM, no slots available for today
      if (startHour > 23 || (startHour === 23 && startMinute > 30)) {
        return slots; // Return empty array
      }
    }

    // Generate slots until 11:30 PM (23:30)
    for (let hour = startHour; hour <= 23; hour++) {
      const startMin = hour === startHour ? startMinute : 0;
      for (let minute = startMin; minute < 60; minute += 30) {
        if (hour === 23 && minute > 30) break; // Stop at 11:30 PM

        const slotDate = new Date(selectedDate);
        slotDate.setHours(hour, minute, 0, 0);
        
        const displayTime = slotDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        slots.push({ value: slotDate, display: displayTime });
      }
    }

    return slots;
  };

  const showCheckInDatePicker = () => {
    if (Platform.OS === 'android') {
      // For Android, show date picker first
      DateTimePickerAndroid.open({
        value: checkInDate || new Date(),
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            // If hourly booking, show time picker after date selection
            if (bookingType === 'hourly') {
              // Round to next 30-minute slot
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
                    // Combine selected date with selected time
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
        value: checkOutDate || new Date(checkInDate!.getTime() + 86400000),
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

  const handleCheckInChange = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(false);
    if (event.type === 'set' && selectedDate) {
      setCheckInDate(selectedDate);
      if (checkOutDate && selectedDate >= checkOutDate) {
        setCheckOutDate(null);
      }
    }
  };

  const handleCheckOutChange = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(false);
    if (event.type === 'set' && selectedDate) {
      if (checkInDate && selectedDate > checkInDate) {
        setCheckOutDate(selectedDate);
      } else if (checkInDate && selectedDate <= checkInDate) {
        Alert.alert('Invalid Date', 'Check-out date must be after check-in date');
      }
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

  // Update guest list when guest count changes
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

  // Handle saved guest selection
  const handleSelectSavedGuest = (guest: SavedGuest) => {
    const updatedGuests = [...guestInfoList];
    updatedGuests[selectingGuestIndex] = {
      firstName: guest.firstName,
      lastName: guest.lastName || '',
      email: selectingGuestIndex === 0 ? updatedGuests[0].email : '',
      phone: guest.phoneNumber || '',
      aadhaarNumber: guest.aadhaarNumber,
      specialRequests: '',
      aadhaarVerified: guest.aadhaarVerified || false,
      aadhaarData: guest.aadhaarData,
    };
    setGuestInfoList(updatedGuests);
  };

  // Pre-checkin verification helpers (matching web app exactly)
  const checkCustomerVerified = () => {
    return userData?.aadhaarData?.verified === true;
  };

  const checkAllGuestsVerified = () => {
    // Check if ALL guests have aadhaarVerified === true
    return guestInfoList.every(guest => guest.aadhaarVerified === true);
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
      
      // Check customer verification first
      if (!verificationStatus.customerVerified) {
        Alert.alert(
          'Verification Required',
          'Your Aadhaar verification is required to enable pre-checkin. Would you like to verify now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Verify Now',
              onPress: () => router.push('/profile/verification' as any)
            }
          ]
        );
        return;
      }

      // Check all guests verification
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

      // All verified, enable pre-checkin
      if (verificationStatus.allComplete) {
        setCustomerPreferences(prev => ({ ...prev, preCheckinEnabled: true }));
      }
    } else {
      // Disable pre-checkin
      setCustomerPreferences(prev => ({ ...prev, preCheckinEnabled: false }));
    }
  };

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior (go to previous screen)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentStep]);

  const validateGuestInfo = () => {
    // Validate all guests
    for (let i = 0; i < guestInfoList.length; i++) {
      const guest = guestInfoList[i];
      const guestLabel = i === 0 ? 'Primary Guest' : `Guest ${i + 1}`;
      
      if (!guest.firstName.trim()) {
        Alert.alert('Required', `Please enter first name for ${guestLabel}`);
        return false;
      }
      if (!guest.lastName.trim()) {
        Alert.alert('Required', `Please enter last name for ${guestLabel}`);
        return false;
      }
      if (i === 0) { // Only primary guest needs email and phone
        if (!guest.email.trim()) {
          Alert.alert('Required', 'Please enter email for Primary Guest');
          return false;
        }
        if (!guest.phone.trim()) {
          Alert.alert('Required', 'Please enter phone number for Primary Guest');
          return false;
        }
      }
      if (!guest.aadhaarNumber.trim()) {
        Alert.alert('Required', `Please enter Aadhaar number for ${guestLabel}`);
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

  const getTravelerTypeLabel = (type: string) => {
    const labels = {
      corporate: 'Corporate & Business',
      family: 'Family & Friends',
      couple: 'Couples & Romantic',
      transit: 'Transit & Solo',
      event: 'Event & Group',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTravelerTypeIcon = (type: string) => {
    const icons = {
      corporate: Briefcase,
      family: UsersIcon,
      couple: Heart,
      transit: User,
      event: Calendar,
    };
    return icons[type as keyof typeof icons] || User;
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
      setShowTravelerTypeSelector(true);
    } else if (currentStep === 2) {
      if (!validateGuestInfo()) {
        return;
      }
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
        guestInfo: JSON.stringify(guestInfoList[0]), // Primary guest info
        allGuestInfo: JSON.stringify(guestInfoList), // All guests info
        customerPreferences: JSON.stringify(customerPreferences), // Customer preferences
        paymentMode,
        totalAmount: calculateTotalAmount().toString(),
        totalPrice: calculateTotalPrice().toString(),
        taxesAndFees: calculateTaxes().toString(),
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
            } else {
              router.back();
            }
          }} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>1</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Dates</Text>
        </View>
        
        <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
        
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Guests</Text>
        </View>
        
        <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
        
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= 3 && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= 3 && styles.stepNumberActive]}>3</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>Preferences</Text>
        </View>
        
        <View style={[styles.stepLine, currentStep >= 4 && styles.stepLineActive]} />
        
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= 4 && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= 4 && styles.stepNumberActive]}>4</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= 4 && styles.stepLabelActive]}>Review</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hotel Card */}
        <View style={styles.hotelCard}>
          <View style={styles.hotelImageWrapper}>
            <Image 
              source={{ uri: (roomData.image || hotelData.image).replace(/\.avif$/, '.jpg') }} 
              style={styles.hotelImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName} numberOfLines={1}>{hotelData.name}</Text>
            <View style={styles.hotelMetaRow}>
              <MapPin size={isSmallDevice ? 12 : 14} color="#666" strokeWidth={2} />
              <Text style={styles.hotelLocation} numberOfLines={1}>{hotelData.location}</Text>
            </View>
            <Text style={styles.roomType} numberOfLines={1}>{roomData.type}</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>₹{roomData.price}</Text>
                <Text style={styles.priceUnit}>/night</Text>
              </View>
              {hotelData.rating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {hotelData.rating}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {currentStep === 1 && (
          <>
            {/* Booking Type Selector */}
            {roomData?.bookingType === 'both' && (
              <View style={styles.section}>
                <Text style={styles.fieldLabel}>Booking Type</Text>
                <View style={styles.bookingTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.bookingTypeButton,
                      bookingType === 'nightly' && styles.bookingTypeButtonActive
                    ]}
                    onPress={() => {
                      setBookingType('nightly');
                      setSelectedHourlyRate(null);
                    }}
                  >
                    <Text style={[
                      styles.bookingTypeText,
                      bookingType === 'nightly' && styles.bookingTypeTextActive
                    ]}>
                      Per Night
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bookingTypeButton,
                      bookingType === 'hourly' && styles.bookingTypeButtonActive
                    ]}
                    onPress={() => {
                      setBookingType('hourly');
                      setCheckOutDate(null);
                    }}
                  >
                    <Text style={[
                      styles.bookingTypeText,
                      bookingType === 'hourly' && styles.bookingTypeTextActive
                    ]}>
                      Per Hour
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Check-in / Check-out */}
            <View style={styles.section}>
              {bookingType === 'nightly' ? (
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.fieldLabel}>Check in</Text>
                    <TouchableOpacity 
                      style={styles.dateInput}
                      onPress={showCheckInDatePicker}
                    >
                      <Calendar size={20} color="#999" />
                      <Text style={[styles.dateText, checkInDate && styles.dateTextSelected]}>
                        {formatDate(checkInDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateField}>
                    <Text style={styles.fieldLabel}>Check out</Text>
                    <TouchableOpacity 
                      style={styles.dateInput}
                      onPress={showCheckOutDatePicker}
                      disabled={!checkInDate}
                    >
                      <Calendar size={20} color="#999" />
                      <Text style={[styles.dateText, checkOutDate && styles.dateTextSelected]}>
                        {formatDate(checkOutDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Hourly Booking - Check-in Date */}
                  <View style={styles.dateField}>
                    <Text style={styles.fieldLabel}>Check-in Date</Text>
                    <TouchableOpacity 
                      style={styles.dateInput}
                      onPress={() => {
                        if (Platform.OS === 'android') {
                          DateTimePickerAndroid.open({
                            value: checkInDate || new Date(),
                            mode: 'date',
                            minimumDate: new Date(),
                            onChange: (event, selectedDate) => {
                              if (event.type === 'set' && selectedDate) {
                                setCheckInDate(selectedDate);
                                // Show time slot picker after date selection
                                setTimeout(() => setShowTimeSlotPicker(true), 300);
                              }
                            },
                          });
                        } else {
                          setShowCheckInPicker(true);
                        }
                      }}
                    >
                      <Calendar size={20} color="#999" />
                      <Text style={[styles.dateText, checkInDate && styles.dateTextSelected]}>
                        {checkInDate ? checkInDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Select date'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Check-in Time Selection */}
                  {checkInDate && (
                    <View style={styles.dateField}>
                      <Text style={styles.fieldLabel}>Check-in Time</Text>
                      <TouchableOpacity 
                        style={styles.dateInput}
                        onPress={() => setShowTimeSlotPicker(true)}
                      >
                        <Calendar size={20} color="#999" />
                        <Text style={[styles.dateText, checkInDate && styles.dateTextSelected]}>
                          {checkInDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Hourly Duration Selection */}
                  {roomData?.hourlyRates && roomData.hourlyRates.length > 0 && (
                    <View style={styles.hourlyRatesContainer}>
                      <Text style={styles.fieldLabel}>Select Duration</Text>
                      <View style={styles.hourlyRatesGrid}>
                        {roomData.hourlyRates.map((rate: { hours: number; price: number }, index: number) => {
                          const validation = checkSameDayBooking(rate.hours);
                          const isDisabled = !validation.isValid;
                          
                          return (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.hourlyRateCard,
                                selectedHourlyRate?.hours === rate.hours && styles.hourlyRateCardActive,
                                isDisabled && styles.hourlyRateCardDisabled
                              ]}
                              onPress={() => {
                                if (isDisabled) {
                                  Alert.alert('Invalid Duration', validation.message);
                                } else {
                                  setSelectedHourlyRate(rate);
                                }
                              }}
                              disabled={isDisabled}
                            >
                              <Text style={[
                                styles.hourlyRateHours,
                                selectedHourlyRate?.hours === rate.hours && styles.hourlyRateHoursActive,
                                isDisabled && styles.hourlyRateTextDisabled
                              ]}>
                                {rate.hours} {rate.hours === 1 ? 'Hour' : 'Hours'}
                              </Text>
                              <Text style={[
                                styles.hourlyRatePrice,
                                selectedHourlyRate?.hours === rate.hours && styles.hourlyRatePriceActive,
                                isDisabled && styles.hourlyRateTextDisabled
                              ]}>
                                ₹{rate.price}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {selectedHourlyRate && !checkSameDayBooking(selectedHourlyRate.hours).isValid && (
                        <View style={styles.sameDayWarning}>
                          <Text style={styles.sameDayWarningText}>
                            ⚠️ {checkSameDayBooking(selectedHourlyRate.hours).message}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Check-out Time Display */}
                  {selectedHourlyRate && checkInDate && (
                    <View style={styles.checkOutInfo}>
                      <Text style={styles.checkOutLabel}>Check-out Time:</Text>
                      <Text style={styles.checkOutTime}>
                        {getCheckOutDateTime()?.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Rooms and Guests */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Rooms and Guests</Text>
              <TouchableOpacity 
                style={styles.selectInput}
                onPress={() => setShowGuestSelector(true)}
              >
                <User size={20} color="#999" />
                <Text style={styles.selectText}>{guests} Guest{guests > 1 ? 's' : ''}</Text>
                <ChevronRight size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Additional Request */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Additional Request</Text>
              <TouchableOpacity style={styles.requestInput}>
                <MessageSquare size={20} color="#999" />
                <TextInput
                  style={styles.requestTextInput}
                  placeholder="Add request"
                  placeholderTextColor="#999"
                  value={additionalRequest}
                  onChangeText={setAdditionalRequest}
                  multiline
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        {currentStep === 2 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Guest Information</Text>
                <View style={styles.guestCountInfo}>
                  <Text style={styles.sectionSubtitle}>Number of Guests: {guests}</Text>
                  <Text style={styles.infoNote}>Please provide details for all guests</Text>
                </View>
              </View>
              {savedGuests.length > 0 && (
                <TouchableOpacity
                  style={styles.manageSavedGuestsButton}
                  onPress={() => router.push('/profile/saved-guests' as any)}
                >
                  <UserPlus size={16} color="#00BFA6" strokeWidth={2} />
                  <Text style={styles.manageSavedGuestsText}>Manage</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {guestInfoList.map((guest, index) => (
              <View key={index} style={styles.guestCard}>
                <View style={styles.guestCardHeader}>
                  <Text style={styles.guestCardTitle}>
                    {index === 0 ? '👤 Primary Guest' : `👤 Guest ${index + 1}`}
                  </Text>
                  {savedGuests.length > 0 && (
                    <TouchableOpacity
                      style={styles.selectSavedGuestButton}
                      onPress={() => {
                        setSelectingGuestIndex(index);
                        setShowSavedGuestSelector(true);
                      }}
                    >
                      <User size={14} color="#00BFA6" strokeWidth={2} />
                      <Text style={styles.selectSavedGuestText}>Select Saved</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>First Name *</Text>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="Enter first name" 
                    value={guest.firstName}
                    onChangeText={(text) => updateGuestInfo(index, 'firstName', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Last Name *</Text>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="Enter last name" 
                    value={guest.lastName}
                    onChangeText={(text) => updateGuestInfo(index, 'lastName', text)}
                  />
                </View>

                {index === 0 && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>Email *</Text>
                      <TextInput 
                        style={styles.textInput} 
                        placeholder="Enter email" 
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={guest.email}
                        onChangeText={(text) => updateGuestInfo(index, 'email', text)}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.fieldLabel}>Phone Number *</Text>
                      <TextInput 
                        style={styles.textInput} 
                        placeholder="Enter phone number" 
                        keyboardType="phone-pad"
                        value={guest.phone}
                        onChangeText={(text) => updateGuestInfo(index, 'phone', text)}
                      />
                    </View>
                  </>
                )}

                <View style={styles.inputGroup}>
                  <View style={styles.aadhaarLabelRow}>
                    <Text style={styles.fieldLabel}>Aadhaar Number *</Text>
                    {guest.aadhaarVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                      </View>
                    )}
                  </View>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="Enter 12-digit Aadhaar number" 
                    keyboardType="number-pad"
                    maxLength={12}
                    value={guest.aadhaarNumber}
                    onChangeText={(text) => updateGuestInfo(index, 'aadhaarNumber', text)}
                  />
                  <View style={styles.aadhaarFooter}>
                    <Text style={styles.helperText}>Required for identity verification at check-in</Text>
                    {!guest.aadhaarVerified && guest.aadhaarNumber.length === 12 && (
                      <TouchableOpacity
                        style={styles.verifyAadhaarButton}
                        onPress={() => {
                          Alert.alert(
                            'Verify Aadhaar',
                            'To verify this guest\'s Aadhaar, please add them as a saved guest and verify from your profile.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Go to Saved Guests',
                                onPress: () => router.push('/profile/saved-guests' as any)
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.verifyAadhaarButtonText}>Verify Aadhaar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {index === 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>Special Requests (Optional)</Text>
                    <TextInput 
                      style={[styles.textInput, styles.textArea]} 
                      placeholder="Any special needs or preferences" 
                      multiline
                      numberOfLines={3}
                      value={guest.specialRequests}
                      onChangeText={(text) => updateGuestInfo(index, 'specialRequests', text)}
                    />
                  </View>
                )}
              </View>
            ))}

            <View style={styles.importantInfo}>
              <Text style={styles.importantTitle}>📋 Important Information</Text>
              <Text style={styles.importantText}>• Valid ID required at check-in for all guests</Text>
              <Text style={styles.importantText}>• Booking confirmation will be sent to primary guest's email</Text>
              <Text style={styles.importantText}>• Free cancellation until 24 hours before check-in</Text>
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Preferences</Text>
            <Text style={styles.sectionSubtitle}>
              Customize your stay based on your travel type
            </Text>
            
            {customerPreferences.travelerType && (
              <TouchableOpacity
                style={styles.changeTravelerType}
                onPress={() => setShowTravelerTypeSelector(true)}
              >
                <View style={styles.travelerTypeDisplay}>
                  {(() => {
                    const Icon = getTravelerTypeIcon(customerPreferences.travelerType);
                    return <Icon size={20} color="#00BFA6" strokeWidth={2} />;
                  })()}
                  <Text style={styles.travelerTypeText}>
                    {getTravelerTypeLabel(customerPreferences.travelerType)}
                  </Text>
                </View>
                <Text style={styles.changeTravelerTypeLink}>Change</Text>
              </TouchableOpacity>
            )}
            
            {customerPreferences.travelerType === 'corporate' && (
              <CorporatePreferences
                preferences={customerPreferences}
                onUpdate={setCustomerPreferences}
              />
            )}
            {customerPreferences.travelerType === 'couple' && (
              <CouplePreferences
                preferences={customerPreferences}
                onUpdate={setCustomerPreferences}
              />
            )}
            {customerPreferences.travelerType === 'family' && (
              <FamilyPreferences
                preferences={customerPreferences}
                onUpdate={setCustomerPreferences}
              />
            )}
            {customerPreferences.travelerType === 'transit' && (
              <TransitSoloPreferences
                preferences={customerPreferences}
                onUpdate={setCustomerPreferences}
              />
            )}
            {customerPreferences.travelerType === 'event' && (
              <EventGroupPreferences
                preferences={customerPreferences}
                onUpdate={setCustomerPreferences}
              />
            )}

            {/* Pre-checkin Feature */}
            <View style={styles.preCheckinSection}>
              <View style={styles.preCheckinHeader}>
                <View style={styles.preCheckinTitleRow}>
                  <Text style={styles.preCheckinTitle}>🛡️ Pre-checkin</Text>
                  <TouchableOpacity
                    style={[
                      styles.preCheckinToggle,
                      customerPreferences.preCheckinEnabled && styles.preCheckinToggleActive
                    ]}
                    onPress={() => handlePreCheckinToggle(!customerPreferences.preCheckinEnabled)}
                  >
                    <View style={[
                      styles.preCheckinToggleThumb,
                      customerPreferences.preCheckinEnabled && styles.preCheckinToggleThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.preCheckinSubtitle}>
                  Skip the front desk queue with pre-verified identity
                </Text>
              </View>

              {customerPreferences.preCheckinEnabled ? (
                <View style={styles.preCheckinEnabledCard}>
                  <View style={styles.preCheckinBenefitsList}>
                    <View style={styles.preCheckinBenefitItem}>
                      <Text style={styles.preCheckinBenefitIcon}>✓</Text>
                      <Text style={styles.preCheckinBenefitText}>Aadhaar verified</Text>
                    </View>
                    <View style={styles.preCheckinBenefitItem}>
                      <Text style={styles.preCheckinBenefitIcon}>✓</Text>
                      <Text style={styles.preCheckinBenefitText}>Identity pre-verified</Text>
                    </View>
                    <View style={styles.preCheckinBenefitItem}>
                      <Text style={styles.preCheckinBenefitIcon}>✓</Text>
                      <Text style={styles.preCheckinBenefitText}>Faster check-in process</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.preCheckinDisabledCard}>
                  <Text style={styles.preCheckinDisabledTitle}>Enable Pre-checkin Benefits:</Text>
                  <View style={styles.preCheckinBenefitsList}>
                    <View style={styles.preCheckinBenefitItem}>
                      <Text style={styles.preCheckinBenefitIcon}>•</Text>
                      <Text style={styles.preCheckinBenefitTextDisabled}>Skip front desk queues</Text>
                    </View>
                    <View style={styles.preCheckinBenefitItem}>
                      <Text style={styles.preCheckinBenefitIcon}>•</Text>
                      <Text style={styles.preCheckinBenefitTextDisabled}>Pre-verified identity</Text>
                    </View>
                    <View style={styles.preCheckinBenefitItem}>
                      <Text style={styles.preCheckinBenefitIcon}>•</Text>
                      <Text style={styles.preCheckinBenefitTextDisabled}>Express check-in</Text>
                    </View>
                  </View>
                  
                  {!checkCustomerVerified() && (
                    <View style={styles.verificationWarning}>
                      <Text style={styles.verificationWarningText}>
                        ⚠️ Your Aadhaar verification is required
                      </Text>
                      <TouchableOpacity
                        style={styles.verifyNowButton}
                        onPress={() => router.push('/profile/verification' as any)}
                      >
                        <Text style={styles.verifyNowButtonText}>Verify Now</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {checkCustomerVerified() && !checkAllGuestsVerified() && (
                    <View style={styles.verificationWarning}>
                      <Text style={styles.verificationWarningText}>
                        ⚠️ Guest verification required
                      </Text>
                      <Text style={styles.verificationWarningSubtext}>
                        {getVerificationStatus().unverifiedGuests.length} guest(s) need Aadhaar verification:
                      </Text>
                      {getVerificationStatus().unverifiedGuests.map((guest, idx) => (
                        <Text key={idx} style={styles.unverifiedGuestName}>
                          • {guest.firstName} {guest.lastName || ''}
                        </Text>
                      ))}
                      <Text style={styles.verificationWarningSubtext}>
                        Add them as saved guests and verify their Aadhaar to enable pre-checkin.
                      </Text>
                      <TouchableOpacity
                        style={styles.verifyNowButton}
                        onPress={() => router.push('/profile/saved-guests' as any)}
                      >
                        <Text style={styles.verifyNowButtonText}>Go to Saved Guests</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {currentStep === 4 && (
          <>
            {/* Pre-checkin Status Banner */}
            {customerPreferences.preCheckinEnabled && (
              <View style={styles.preCheckinBanner}>
                <View style={styles.preCheckinBannerHeader}>
                  <Text style={styles.preCheckinBannerIcon}>🛡️</Text>
                  <Text style={styles.preCheckinBannerTitle}>Pre-checkin Enabled</Text>
                </View>
                <Text style={styles.preCheckinBannerText}>
                  Skip the front desk queue with pre-verified identity!
                </Text>
                <View style={styles.preCheckinBannerBenefits}>
                  <View style={styles.preCheckinBannerBenefit}>
                    <Text style={styles.preCheckinBannerBenefitIcon}>✓</Text>
                    <Text style={styles.preCheckinBannerBenefitText}>Aadhaar verified</Text>
                  </View>
                  <View style={styles.preCheckinBannerBenefit}>
                    <Text style={styles.preCheckinBannerBenefitIcon}>✓</Text>
                    <Text style={styles.preCheckinBannerBenefitText}>Identity pre-verified</Text>
                  </View>
                  <View style={styles.preCheckinBannerBenefit}>
                    <Text style={styles.preCheckinBannerBenefitIcon}>✓</Text>
                    <Text style={styles.preCheckinBannerBenefitText}>Faster check-in</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Guest Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Guest Details</Text>
              <View style={styles.guestSummaryCard}>
                <View style={styles.guestSummaryRow}>
                  <Text style={styles.guestSummaryLabel}>Primary Guest:</Text>
                  <Text style={styles.guestSummaryValue}>
                    {guestInfoList[0].firstName} {guestInfoList[0].lastName}
                  </Text>
                </View>
                <View style={styles.guestSummaryRow}>
                  <Text style={styles.guestSummaryLabel}>Email:</Text>
                  <Text style={styles.guestSummaryValue}>{guestInfoList[0].email}</Text>
                </View>
                <View style={styles.guestSummaryRow}>
                  <Text style={styles.guestSummaryLabel}>Phone:</Text>
                  <Text style={styles.guestSummaryValue}>{guestInfoList[0].phone}</Text>
                </View>
                <View style={styles.guestSummaryRow}>
                  <Text style={styles.guestSummaryLabel}>Total Guests:</Text>
                  <Text style={styles.guestSummaryValue}>{guests}</Text>
                </View>
                {guests > 1 && (
                  <View style={styles.additionalGuestsInfo}>
                    <Text style={styles.additionalGuestsLabel}>Additional Guests:</Text>
                    {guestInfoList.slice(1).map((guest, index) => (
                      <Text key={index} style={styles.additionalGuestName}>
                        • {guest.firstName} {guest.lastName}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Booking Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Check-in</Text>
                <Text style={styles.summaryValue}>
                  {bookingType === 'hourly' 
                    ? checkInDate?.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    : formatDate(checkInDate)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Check-out</Text>
                <Text style={styles.summaryValue}>
                  {bookingType === 'hourly'
                    ? getCheckOutDateTime()?.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    : formatDate(checkOutDate)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {bookingType === 'hourly' ? 'Duration' : 'Nights'}
                </Text>
                <Text style={styles.summaryValue}>
                  {bookingType === 'hourly' 
                    ? `${selectedHourlyRate?.hours} hours`
                    : calculateNights()}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Room Type</Text>
                <Text style={styles.summaryValue}>{roomData.type}</Text>
              </View>

              {customerPreferences.preCheckinEnabled && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Check-in Type</Text>
                  <Text style={[styles.summaryValue, styles.preCheckinValue]}>
                    Pre-checkin ✓
                  </Text>
                </View>
              )}

              {additionalRequest && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.summaryColumn}>
                    <Text style={styles.summaryLabel}>Special Requests</Text>
                    <Text style={styles.summaryValueText}>{additionalRequest}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Price Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Details</Text>
              <View style={styles.priceSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {bookingType === 'hourly' ? 'Hourly Rate' : 'Room Rate'}
                  </Text>
                  <Text style={styles.summaryValue}>
                    ₹{bookingType === 'hourly' && selectedHourlyRate 
                      ? selectedHourlyRate.price 
                      : roomData.price} × {bookingType === 'hourly' 
                      ? `${selectedHourlyRate?.hours} hour${selectedHourlyRate?.hours !== 1 ? 's' : ''}`
                      : `${calculateNights()} night${calculateNights() !== 1 ? 's' : ''}`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{calculateTotalPrice()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Taxes & Fees (18%)</Text>
                  <Text style={styles.summaryValue}>₹{calculateTaxes()}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Total Amount</Text>
                  <Text style={styles.summaryValueBold}>₹{calculateTotalAmount()}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.nextButtonFull} 
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 4 ? 'Continue to Payment' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Pickers - iOS only (Android uses native API) */}
      {Platform.OS === 'ios' && showCheckInPicker && (
        <DateTimePicker
          value={checkInDate || new Date()}
          mode={bookingType === 'hourly' ? 'datetime' : 'date'}
          display="default"
          onChange={handleCheckInChange}
          minimumDate={new Date()}
        />
      )}

      {Platform.OS === 'ios' && showCheckOutPicker && bookingType === 'nightly' && (
        <DateTimePicker
          value={checkOutDate || new Date(checkInDate!.getTime() + 86400000)}
          mode="date"
          display="default"
          onChange={handleCheckOutChange}
          minimumDate={checkInDate ? new Date(checkInDate.getTime() + 86400000) : new Date()}
        />
      )}

      {/* Guest Selector Modal */}
      <GuestSelector
        visible={showGuestSelector}
        guests={guests}
        onClose={() => setShowGuestSelector(false)}
        onConfirm={handleGuestCountChange}
      />

      {/* Traveler Type Selector Modal */}
      <TravelerTypeSelector
        visible={showTravelerTypeSelector}
        selectedType={customerPreferences.travelerType}
        onSelect={handleTravelerTypeSelect}
        onClose={() => setShowTravelerTypeSelector(false)}
      />

      {/* Saved Guest Selector Modal */}
      <SavedGuestSelector
        visible={showSavedGuestSelector}
        savedGuests={savedGuests}
        onSelect={handleSelectSavedGuest}
        onClose={() => setShowSavedGuestSelector(false)}
      />

      {/* Time Slot Picker Modal */}
      {showTimeSlotPicker && bookingType === 'hourly' && (
        <View style={styles.modalOverlay}>
          <View style={styles.timeSlotModal}>
            <View style={styles.timeSlotHeader}>
              <Text style={styles.timeSlotTitle}>Select Check-in Time</Text>
              <TouchableOpacity onPress={() => setShowTimeSlotPicker(false)}>
                <Text style={styles.timeSlotClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeSlotList} showsVerticalScrollIndicator={false}>
              {generateTimeSlots().length > 0 ? (
                generateTimeSlots().map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlotItem,
                      checkInDate?.getTime() === slot.value.getTime() && styles.timeSlotItemActive
                    ]}
                    onPress={() => {
                      setCheckInDate(slot.value);
                      setShowTimeSlotPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      checkInDate?.getTime() === slot.value.getTime() && styles.timeSlotTextActive
                    ]}>
                      {slot.display}
                    </Text>
                    {checkInDate?.getTime() === slot.value.getTime() && (
                      <View style={styles.timeSlotCheck}>
                        <Text style={styles.timeSlotCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Text style={styles.noSlotsText}>
                    No time slots available for the selected date.
                  </Text>
                  <Text style={styles.noSlotsSubtext}>
                    Please select a different date.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#666',
    textAlign: 'center',
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
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#00BFA6',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
  },
  stepLabelActive: {
    color: '#00BFA6',
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
    marginBottom: 26,
  },
  stepLineActive: {
    backgroundColor: '#00BFA6',
  },
  content: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 24 : 20,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: isSmallDevice ? 12 : 16,
    padding: isSmallDevice ? 10 : 12,
    marginBottom: isSmallDevice ? 16 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  hotelImageWrapper: {
    width: isSmallDevice ? 90 : isTablet ? 120 : 100,
    aspectRatio: 1,
    borderRadius: isSmallDevice ? 10 : 12,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  hotelInfo: {
    flex: 1,
    marginLeft: isSmallDevice ? 10 : 12,
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: isSmallDevice ? 15 : isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  hotelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#666',
    flex: 1,
  },
  roomType: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#00BFA6',
    fontWeight: '600',
    marginBottom: isSmallDevice ? 6 : 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#00BFA6',
  },
  priceUnit: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#666',
    marginLeft: 2,
  },
  ratingBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: isSmallDevice ? 6 : 8,
    paddingVertical: isSmallDevice ? 3 : 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: isSmallDevice ? 11 : 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  section: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallDevice ? 6 : 8,
  },
  sectionSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#666',
    marginBottom: isSmallDevice ? 12 : 16,
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: isSmallDevice ? 6 : 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: isSmallDevice ? 8 : 12,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: isSmallDevice ? 10 : 12,
    padding: isSmallDevice ? 12 : 16,
    gap: isSmallDevice ? 8 : 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateText: {
    flex: 1,
    fontSize: isSmallDevice ? 13 : 14,
    color: '#999',
  },
  dateTextSelected: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: isSmallDevice ? 10 : 12,
    padding: isSmallDevice ? 12 : 16,
    gap: isSmallDevice ? 8 : 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  selectText: {
    flex: 1,
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  requestInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    minHeight: 60,
  },
  requestTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    padding: 0,
  },
  inputGroup: {
    marginBottom: isSmallDevice ? 14 : 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: isSmallDevice ? 10 : 12,
    padding: isSmallDevice ? 12 : 16,
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryColumn: {
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  summaryValueText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 20,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00BFA6',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingTop: isSmallDevice ? 12 : 16,
    paddingBottom: Platform.OS === 'ios' ? (isSmallDevice ? 24 : 30) : (isSmallDevice ? 12 : 16),
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
  priceInfo: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
    marginLeft: 16,
  },
  nextButtonFull: {
    flex: 1,
    backgroundColor: '#00BFA6',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#00BFA6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  nextButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  manageSavedGuestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageSavedGuestsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00BFA6',
  },
  guestCountInfo: {
    marginBottom: 0,
  },
  infoNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderRadius: isSmallDevice ? 12 : 16,
    padding: isSmallDevice ? 14 : 16,
    marginBottom: isSmallDevice ? 14 : 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  guestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 14 : 16,
  },
  guestCardTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  selectSavedGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectSavedGuestText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00BFA6',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    flex: 1,
  },
  aadhaarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  aadhaarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  verifyAadhaarButton: {
    backgroundColor: '#00BFA6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyAadhaarButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  importantInfo: {
    backgroundColor: '#E8F5F3',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA6',
  },
  importantTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  importantText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  guestSummaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  guestSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  guestSummaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  guestSummaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  additionalGuestsInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  additionalGuestsLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  additionalGuestName: {
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paymentOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    borderColor: '#00BFA6',
    backgroundColor: '#E8F5F3',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonActive: {
    borderColor: '#00BFA6',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00BFA6',
  },
  paymentOptionText: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paymentOptionDesc: {
    fontSize: 13,
    color: '#666',
  },
  changeTravelerType: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00BFA6',
  },
  travelerTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  travelerTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00BFA6',
  },
  changeTravelerTypeLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00BFA6',
    textDecorationLine: 'underline',
  },
  bookingTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingTypeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  bookingTypeButtonActive: {
    borderColor: '#00BFA6',
    backgroundColor: '#E8F5F3',
  },
  bookingTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  bookingTypeTextActive: {
    color: '#00BFA6',
  },
  hourlyRatesContainer: {
    marginTop: 16,
  },
  hourlyRatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hourlyRateCard: {
    width: isSmallDevice ? '47%' : '30%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  hourlyRateCardActive: {
    borderColor: '#00BFA6',
    backgroundColor: '#E8F5F3',
  },
  hourlyRateHours: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  hourlyRateHoursActive: {
    color: '#00BFA6',
  },
  hourlyRatePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
  },
  hourlyRatePriceActive: {
    color: '#00BFA6',
  },
  hourlyRateCardDisabled: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  hourlyRateTextDisabled: {
    color: '#999',
  },
  sameDayWarning: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  sameDayWarningText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  checkOutInfo: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA6',
  },
  checkOutLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  checkOutTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  // Time Slot Picker Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  timeSlotModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_WIDTH * 1.2,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeSlotTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  timeSlotClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  timeSlotList: {
    maxHeight: SCREEN_WIDTH * 1.0,
  },
  timeSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeSlotItemActive: {
    backgroundColor: '#E8F5F3',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: '#00BFA6',
    fontWeight: '700',
  },
  timeSlotCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00BFA6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotCheckText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  noSlotsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Pre-checkin styles
  preCheckinSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  preCheckinHeader: {
    marginBottom: 16,
  },
  preCheckinTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preCheckinTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  preCheckinSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  preCheckinToggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    padding: 2,
    justifyContent: 'center',
  },
  preCheckinToggleActive: {
    backgroundColor: '#00BFA6',
  },
  preCheckinToggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  preCheckinToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  preCheckinEnabledCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  preCheckinDisabledCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  preCheckinDisabledTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  preCheckinBenefitsList: {
    gap: 8,
  },
  preCheckinBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preCheckinBenefitIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  preCheckinBenefitText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
  },
  preCheckinBenefitTextDisabled: {
    fontSize: 13,
    color: '#666',
  },
  verificationWarning: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  verificationWarningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 8,
  },
  verificationWarningSubtext: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    marginTop: 4,
  },
  unverifiedGuestName: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 8,
  },
  verifyNowButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyNowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  preCheckinBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  preCheckinBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  preCheckinBannerIcon: {
    fontSize: 24,
  },
  preCheckinBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },
  preCheckinBannerText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 12,
    lineHeight: 20,
  },
  preCheckinBannerBenefits: {
    gap: 6,
  },
  preCheckinBannerBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preCheckinBannerBenefitIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  preCheckinBannerBenefitText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
  },
  priceSummaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  preCheckinValue: {
    color: '#10B981',
    fontWeight: '700',
  },
});
