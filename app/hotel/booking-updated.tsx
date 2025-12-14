// UPDATED BOOKING SCREEN WITH TRAVELER TYPE & PREFERENCES
// This file shows the complete integration of new features
// Replace the content of booking.tsx with this file

import GuestSelector from '@/components/hotel/GuestSelector';
import TravelerTypeSelector from '@/components/booking/TravelerTypeSelector';
import CorporatePreferences from '@/components/booking/CorporatePreferences';
import CouplePreferences from '@/components/booking/CouplePreferences';
import FamilyPreferences from '@/components/booking/FamilyPreferences';
import TransitSoloPreferences from '@/components/booking/TransitSoloPreferences';
import EventGroupPreferences from '@/components/booking/EventGroupPreferences';
import { CustomerPreferences } from '@/types/booking';
import DateTimePicker from '@react-native-community/datetimepicker';
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
}

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
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

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCheckInChange = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(false);
    if (selectedDate) {
      setCheckInDate(selectedDate);
      if (checkOutDate && selectedDate >= checkOutDate) {
        setCheckOutDate(null);
      }
    }
  };

  const handleCheckOutChange = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(false);
    if (selectedDate && checkInDate && selectedDate > checkInDate) {
      setCheckOutDate(selectedDate);
    } else if (selectedDate && checkInDate && selectedDate <= checkInDate) {
      Alert.alert('Invalid Date', 'Check-out date must be after check-in date');
    }
  };

  const updateGuestInfo = (index: number, field: keyof GuestInfo, value: string) => {
    const updatedGuests = [...guestInfoList];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setGuestInfoList(updatedGuests);
  };

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

  const handleTravelerTypeSelect = (type: 'corporate' | 'family' | 'couple' | 'transit' | 'event') => {
    setCustomerPreferences({
      ...customerPreferences,
      travelerType: type,
    });
    setShowTravelerTypeSelector(false);
    setCurrentStep(2);
  };

  useEffect(() => {
    const backAction = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [currentStep]);

  const validateGuestInfo = () => {
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
      if (i === 0) {
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

  const handleNext = () => {
    if (currentStep === 1) {
      if (!checkInDate || !checkOutDate) {
        Alert.alert('Required', 'Please select check-in and check-out dates');
        return;
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
    router.push({
      pathname: '/hotel/payment' as any,
      params: {
        hotel: JSON.stringify(hotelData),
        room: JSON.stringify(roomData),
        checkIn: checkInDate?.toISOString(),
        checkOut: checkOutDate?.toISOString(),
        guests: guests.toString(),
        guestInfo: JSON.stringify(guestInfoList[0]),
        allGuestInfo: JSON.stringify(guestInfoList),
        customerPreferences: JSON.stringify(customerPreferences),
        paymentMode,
        totalAmount: calculateTotalAmount().toString(),
        totalPrice: calculateTotalPrice().toString(),
        taxesAndFees: calculateTaxes().toString(),
        nights: calculateNights().toString(),
        additionalRequest: additionalRequest,
      },
    });
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
            </View>
          </View>
        </View>

        {/* Step 1: Dates & Guests */}
        {currentStep === 1 && (
          <>
            <View style={styles.section}>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.fieldLabel}>Check in</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowCheckInPicker(true)}
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
                    onPress={() => setShowCheckOutPicker(true)}
                    disabled={!checkInDate}
                  >
                    <Calendar size={20} color="#999" />
                    <Text style={[styles.dateText, checkOutDate && styles.dateTextSelected]}>
                      {formatDate(checkOutDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

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

        {/* Step 2: Guest Information */}
        {currentStep === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Information</Text>
            <View style={styles.guestCountInfo}>
              <Text style={styles.sectionSubtitle}>Number of Guests: {guests}</Text>
              <Text style={styles.infoNote}>Please provide details for all guests</Text>
            </View>
            
            {guestInfoList.map((guest, index) => (
              <View key={index} style={styles.guestCard}>
                <Text style={styles.guestCardTitle}>
                  {index === 0 ? '👤 Primary Guest' : `👤 Guest ${index + 1}`}
                </Text>
                
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
                  <Text style={styles.fieldLabel}>Aadhaar Number *</Text>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="Enter 12-digit Aadhaar number" 
                    keyboardType="number-pad"
                    maxLength={12}
                    value={guest.aadhaarNumber}
                    onChangeText={(text) => updateGuestInfo(index, 'aadhaarNumber', text)}
                  />
                  <Text style={styles.helperText}>Required for identity verification at check-in</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Step 3: Preferences */}
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
          </View>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <>
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
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Check-in</Text>
                <Text style={styles.summaryValue}>{formatDate(checkInDate)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Check-out</Text>
                <Text style={styles.summaryValue}>{formatDate(checkOutDate)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nights</Text>
                <Text style={styles.summaryValue}>{calculateNights()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Room Type</Text>
                <Text style={styles.summaryValue}>{roomData.type}</Text>
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

      {/* Date Pickers */}
      {showCheckInPicker && (
        <DateTimePicker
          value={checkInDate || new Date()}
          mode="date"
          display="default"
          onChange={handleCheckInChange}
          minimumDate={new Date()}
        />
      )}

      {showCheckOutPicker && (
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
    </SafeAreaView>
  );
}

// Styles remain the same as original booking.tsx
// Add these new styles:

const additionalStyles = StyleSheet.create({
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
  guestCountInfo: {
    marginBottom: 16,
  },
  infoNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  guestCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  guestCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  helperText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
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
  },
  guestSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
});

// Note: Merge additionalStyles with your existing styles object
