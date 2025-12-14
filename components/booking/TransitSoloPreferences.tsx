import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { User } from 'lucide-react-native';
import { CustomerPreferences } from '@/types/booking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface TransitSoloPreferencesProps {
  preferences: CustomerPreferences;
  onUpdate: (preferences: CustomerPreferences) => void;
}

export default function TransitSoloPreferences({
  preferences,
  onUpdate,
}: TransitSoloPreferencesProps) {
  const attractionOptions = [
    'Local markets',
    'Historical sites',
    'Restaurants & cafes',
    'Shopping areas',
    'Parks & gardens',
    'Museums',
    'Nightlife spots',
    'Public transport',
  ];

  const roomTypeOptions = [
    { value: 'quiet', label: 'Quiet room away from elevator' },
    { value: 'view', label: 'Room with a view' },
    { value: 'compact', label: 'Compact & efficient' },
    { value: 'standard', label: 'Standard room' },
  ];

  const checkInFlexibilityOptions = [
    { value: 'early', label: 'Early check-in (before 12 PM)' },
    { value: 'standard', label: 'Standard (2-3 PM)' },
    { value: 'late', label: 'Late check-in (after 6 PM)' },
    { value: 'flexible', label: 'Flexible timing' },
  ];

  const toggleAttraction = (attraction: string) => {
    const current = preferences.transitSoloEssentials?.nearbyAttractions || [];
    const updated = current.includes(attraction)
      ? current.filter((item) => item !== attraction)
      : [...current, attraction];

    onUpdate({
      ...preferences,
      transitSoloEssentials: {
        ...preferences.transitSoloEssentials,
        nearbyAttractions: updated,
      },
    });
  };

  const updateTransitSoloEssential = (key: string, value: any) => {
    onUpdate({
      ...preferences,
      transitSoloEssentials: {
        ...preferences.transitSoloEssentials,
        [key]: value,
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <User size={24} color="#F59E0B" strokeWidth={2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Transit & Solo Travel</Text>
          <Text style={styles.headerSubtitle}>
            🎒 Perfect for solo travelers and short stays
          </Text>
        </View>
      </View>

      {/* Check-in Flexibility */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Check-in Flexibility</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your preferred check-in time
        </Text>
        <View style={styles.radioGroup}>
          {checkInFlexibilityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioOption,
                preferences.transitSoloEssentials?.checkInFlexibility ===
                  option.value && styles.radioOptionSelected,
              ]}
              onPress={() =>
                updateTransitSoloEssential('checkInFlexibility', option.value)
              }
            >
              <View style={styles.radioButton}>
                {preferences.transitSoloEssentials?.checkInFlexibility ===
                  option.value && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Breakfast Takeaway */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Breakfast Takeaway</Text>
            <Text style={styles.switchSubtitle}>
              Grab-and-go breakfast option
            </Text>
          </View>
          <Switch
            value={
              preferences.transitSoloEssentials?.breakfastTakeaway || false
            }
            onValueChange={(value) =>
              updateTransitSoloEssential('breakfastTakeaway', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#FDE68A' }}
            thumbColor={
              preferences.transitSoloEssentials?.breakfastTakeaway
                ? '#F59E0B'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Nearby Attractions */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Nearby Attractions</Text>
        <Text style={styles.sectionSubtitle}>
          What would you like to explore nearby?
        </Text>
        <View style={styles.chipContainer}>
          {attractionOptions.map((attraction) => {
            const isSelected =
              preferences.transitSoloEssentials?.nearbyAttractions?.includes(
                attraction
              ) || false;
            return (
              <TouchableOpacity
                key={attraction}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleAttraction(attraction)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {isSelected ? '✓ ' : ''}
                  {attraction}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Cab/Shuttle Required */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Cab/Shuttle Service</Text>
            <Text style={styles.switchSubtitle}>
              Transportation assistance needed
            </Text>
          </View>
          <Switch
            value={
              preferences.transitSoloEssentials?.cabShuttleRequired || false
            }
            onValueChange={(value) =>
              updateTransitSoloEssential('cabShuttleRequired', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#FDE68A' }}
            thumbColor={
              preferences.transitSoloEssentials?.cabShuttleRequired
                ? '#F59E0B'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Room Type Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Room Type Preference</Text>
        <Text style={styles.sectionSubtitle}>
          Select your preferred room type
        </Text>
        <View style={styles.radioGroup}>
          {roomTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioOption,
                preferences.transitSoloEssentials?.roomTypePreference ===
                  option.value && styles.radioOptionSelected,
              ]}
              onPress={() =>
                updateTransitSoloEssential('roomTypePreference', option.value)
              }
            >
              <View style={styles.radioButton}>
                {preferences.transitSoloEssentials?.roomTypePreference ===
                  option.value && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Noise Isolation */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Noise Isolation Priority</Text>
            <Text style={styles.switchSubtitle}>
              Quiet room for better rest
            </Text>
          </View>
          <Switch
            value={preferences.transitSoloEssentials?.noiseIsolation || false}
            onValueChange={(value) =>
              updateTransitSoloEssential('noiseIsolation', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#FDE68A' }}
            thumbColor={
              preferences.transitSoloEssentials?.noiseIsolation
                ? '#F59E0B'
                : '#f4f3f4'
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#92400E',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  chipSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  chipText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  radioOptionSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  radioLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1A1A1A',
    flex: 1,
  },
});
