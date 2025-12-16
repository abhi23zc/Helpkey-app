import GuestSelector from '@/components/hotel/GuestSelector';
import TravelerTypeSelector from '@/components/booking/TravelerTypeSelector';
import SavedGuestSelector from '@/components/booking/SavedGuestSelector';
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
      email: selectingGuestIndex === 0 ? updatedGuests[0].email : '',
      phone: guest.phoneNumber || '',
      aadhaarNumber: guest.aadhaarNumber,
      specialRequests: '',
      aadhaarVerified: guest.aadhaarVerified || false,
      aadhaarData: guest.aadhaarData,
    };
    setGuestInfoList(updatedGuests);
    setShowSavedGuestSelector(false);
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
      // Skip traveler type for now for better UX flow, or implement a better modal
      setShowTravelerTypeSelector(true);
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
            {index === 0 && savedGuests.length > 0 && (
              <TouchableOpacity onPress={() => { setSelectingGuestIndex(0); setShowSavedGuestSelector(true); }}>
                <Text style={styles.linkText}>Select Saved</Text>
              </TouchableOpacity>
            )}
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
            {index === 0 && (
              <>
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
              </>
            )}
          </View>
        </View>
      ))}
    </MotiView>
  );

  const renderPreferences = () => (
    <MotiView from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }}>
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Make Your Stay Special</Text>
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
    </MotiView>
  );

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
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <View style={styles.priceRowItem}>
          <Text style={styles.priceLabel}>Room Charges</Text>
          <Text style={styles.priceValue}>₹{calculateTotalPrice()}</Text>
        </View>
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
    backgroundColor: '#111827', // Black for completed too? Or keep green? User asked for Black & White. Let's stick to Black for active/completed to be safe or maybe Dark Gray.
    // Actually standard UI often uses Primary color for completed. User said "upper indicators colors make it black and white".
    // I will use Black for Active/Completed to strictly follow "Black and White".
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
  linkText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },

  // Preferences
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#111827',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#111827',
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
});
