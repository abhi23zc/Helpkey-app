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
import { Briefcase } from 'lucide-react-native';
import { CustomerPreferences } from '@/types/booking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface CorporatePreferencesProps {
  preferences: CustomerPreferences;
  onUpdate: (preferences: CustomerPreferences) => void;
}

export default function CorporatePreferences({
  preferences,
  onUpdate,
}: CorporatePreferencesProps) {
  const workspaceOptions = [
    'Ergonomic chair',
    'Large desk',
    'Good lighting',
    'Power outlets',
    'Desk lamp',
    'Stationery kit',
  ];

  const breakfastTimings = [
    { value: 'early', label: 'Early breakfast (6–7 AM)' },
    { value: 'regular', label: 'Regular (7:30–9 AM)' },
    { value: 'late', label: 'Late breakfast (9–10:30 AM)' },
  ];

  const toggleWorkspaceSetup = (option: string) => {
    const current = preferences.businessEssentials?.workspaceSetup || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    onUpdate({
      ...preferences,
      businessEssentials: {
        ...preferences.businessEssentials,
        workspaceSetup: updated,
      },
    });
  };

  const updateBusinessEssential = (key: string, value: any) => {
    onUpdate({
      ...preferences,
      businessEssentials: {
        ...preferences.businessEssentials,
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
          <Briefcase size={24} color="#3B82F6" strokeWidth={2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Corporate & Business Travel</Text>
          <Text style={styles.headerSubtitle}>
            💼 Optimized for business professionals and executives
          </Text>
        </View>
      </View>

      {/* Workspace Setup */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Workspace Setup</Text>
        <Text style={styles.sectionSubtitle}>
          Select your preferred workspace amenities
        </Text>
        <View style={styles.chipContainer}>
          {workspaceOptions.map((option) => {
            const isSelected =
              preferences.businessEssentials?.workspaceSetup?.includes(
                option
              ) || false;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleWorkspaceSetup(option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {isSelected ? '✓ ' : ''}
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Meeting Room */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Meeting Room Required</Text>
            <Text style={styles.switchSubtitle}>
              Need a private space for meetings
            </Text>
          </View>
          <Switch
            value={
              preferences.businessEssentials?.meetingRoomRequired || false
            }
            onValueChange={(value) =>
              updateBusinessEssential('meetingRoomRequired', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#BFDBFE' }}
            thumbColor={
              preferences.businessEssentials?.meetingRoomRequired
                ? '#3B82F6'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Printing/Scanning Service */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Printing/Scanning Service</Text>
            <Text style={styles.switchSubtitle}>
              Access to business center facilities
            </Text>
          </View>
          <Switch
            value={
              preferences.businessEssentials?.printingScanningService || false
            }
            onValueChange={(value) =>
              updateBusinessEssential('printingScanningService', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#BFDBFE' }}
            thumbColor={
              preferences.businessEssentials?.printingScanningService
                ? '#3B82F6'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Airport Transfer */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Airport Transfer</Text>
            <Text style={styles.switchSubtitle}>
              Pickup/drop service to airport
            </Text>
          </View>
          <Switch
            value={preferences.businessEssentials?.airportTransfer || false}
            onValueChange={(value) =>
              updateBusinessEssential('airportTransfer', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#BFDBFE' }}
            thumbColor={
              preferences.businessEssentials?.airportTransfer
                ? '#3B82F6'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Breakfast Timing */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Breakfast Timing</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your preferred breakfast time
        </Text>
        <View style={styles.radioGroup}>
          {breakfastTimings.map((timing) => (
            <TouchableOpacity
              key={timing.value}
              style={[
                styles.radioOption,
                preferences.businessEssentials?.breakfastTiming ===
                  timing.value && styles.radioOptionSelected,
              ]}
              onPress={() =>
                updateBusinessEssential('breakfastTiming', timing.value)
              }
            >
              <View style={styles.radioButton}>
                {preferences.businessEssentials?.breakfastTiming ===
                  timing.value && <View style={styles.radioButtonInner} />}
              </View>
              <Text style={styles.radioLabel}>{timing.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Laundry Service */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Express Laundry Service</Text>
            <Text style={styles.switchSubtitle}>
              Same-day laundry and dry cleaning
            </Text>
          </View>
          <Switch
            value={preferences.businessEssentials?.laundryService || false}
            onValueChange={(value) =>
              updateBusinessEssential('laundryService', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#BFDBFE' }}
            thumbColor={
              preferences.businessEssentials?.laundryService
                ? '#3B82F6'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* High-Speed WiFi */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>High-Speed WiFi Priority</Text>
            <Text style={styles.switchSubtitle}>
              Premium internet for video calls
            </Text>
          </View>
          <Switch
            value={preferences.businessEssentials?.highSpeedWiFi || false}
            onValueChange={(value) =>
              updateBusinessEssential('highSpeedWiFi', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#BFDBFE' }}
            thumbColor={
              preferences.businessEssentials?.highSpeedWiFi
                ? '#3B82F6'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Late Checkout */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Late Checkout Request</Text>
            <Text style={styles.switchSubtitle}>
              Extended checkout time if available
            </Text>
          </View>
          <Switch
            value={
              preferences.businessEssentials?.lateCheckoutRequest || false
            }
            onValueChange={(value) =>
              updateBusinessEssential('lateCheckoutRequest', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#BFDBFE' }}
            thumbColor={
              preferences.businessEssentials?.lateCheckoutRequest
                ? '#3B82F6'
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
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
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
    color: '#1E3A8A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#1E40AF',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  chipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 12,
    color: '#3B82F6',
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
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1A1A1A',
    flex: 1,
  },
});
