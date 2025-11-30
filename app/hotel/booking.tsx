import GuestSelector from '@/components/hotel/GuestSelector';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  MapPin,
  MessageSquare,
  User
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
  const [additionalRequest, setAdditionalRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'online' | 'hotel'>('online');
  
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
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateGuestInfo()) {
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
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
        paymentMode,
        totalAmount: calculateTotalAmount().toString(),
        totalPrice: calculateTotalPrice().toString(),
        taxesAndFees: calculateTaxes().toString(),
        nights: calculateNights().toString(),
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
          <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Booking</Text>
        </View>
        
        <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
        
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Guest Info</Text>
        </View>
        
        <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
        
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= 3 && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= 3 && styles.stepNumberActive]}>3</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>Review</Text>
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
            {/* Check-in / Check-out */}
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
          <>
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
              {currentStep === 3 ? 'Continue to Payment' : 'Next'}
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
  guestCountInfo: {
    marginBottom: 16,
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
  guestCardTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: isSmallDevice ? 14 : 16,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
});
