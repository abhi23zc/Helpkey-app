import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { CustomerPreferences } from '@/types/booking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface EventGroupPreferencesProps {
  preferences: CustomerPreferences;
  onUpdate: (preferences: CustomerPreferences) => void;
}

export default function EventGroupPreferences({
  preferences,
  onUpdate,
}: EventGroupPreferencesProps) {
  const venueSetupOptions = [
    'Conference hall',
    'Banquet setup',
    'Theater style',
    'Classroom style',
    'U-shape setup',
    'Cocktail setup',
    'Outdoor venue',
    'Stage & podium',
  ];

  const groupMealOptions = [
    'Buffet breakfast',
    'Lunch packages',
    'Dinner arrangements',
    'Coffee breaks',
    'Welcome drinks',
    'Cocktail reception',
    'BBQ setup',
    'Custom menu',
  ];

  const eventTypes = [
    'Wedding',
    'Conference',
    'Corporate event',
    'Birthday party',
    'Anniversary',
    'Reunion',
    'Workshop',
    'Seminar',
  ];

  const toggleVenueSetup = (setup: string) => {
    const current = preferences.eventGroupFacilities?.venueSetup || [];
    const updated = current.includes(setup)
      ? current.filter((item) => item !== setup)
      : [...current, setup];

    onUpdate({
      ...preferences,
      eventGroupFacilities: {
        ...preferences.eventGroupFacilities,
        venueSetup: updated,
      },
    });
  };

  const toggleGroupMeal = (meal: string) => {
    const current = preferences.eventGroupFacilities?.groupMeal || [];
    const updated = current.includes(meal)
      ? current.filter((item) => item !== meal)
      : [...current, meal];

    onUpdate({
      ...preferences,
      eventGroupFacilities: {
        ...preferences.eventGroupFacilities,
        groupMeal: updated,
      },
    });
  };

  const updateEventGroupFacility = (key: string, value: any) => {
    onUpdate({
      ...preferences,
      eventGroupFacilities: {
        ...preferences.eventGroupFacilities,
        [key]: value,
      },
    });
  };

  const updateGroupSize = (size: number) => {
    onUpdate({
      ...preferences,
      eventGroupFacilities: {
        ...preferences.eventGroupFacilities,
        groupSize: size,
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
          <Calendar size={24} color="#8B5CF6" strokeWidth={2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Event & Group Bookings</Text>
          <Text style={styles.headerSubtitle}>
            🎉 Perfect for weddings, conferences, and large gatherings
          </Text>
        </View>
      </View>

      {/* Group Size */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Group Size</Text>
        <Text style={styles.sectionSubtitle}>
          Number of people attending
        </Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() =>
              updateGroupSize(
                Math.max(
                  0,
                  (preferences.eventGroupFacilities?.groupSize || 0) - 5
                )
              )
            }
          >
            <Text style={styles.counterButtonText}>−5</Text>
          </TouchableOpacity>
          <View style={styles.counterValue}>
            <Text style={styles.counterValueText}>
              {preferences.eventGroupFacilities?.groupSize || 0}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() =>
              updateGroupSize(
                (preferences.eventGroupFacilities?.groupSize || 0) + 5
              )
            }
          >
            <Text style={styles.counterButtonText}>+5</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Event Type</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter event type (e.g., Wedding, Conference...)"
          placeholderTextColor="#999"
          value={preferences.eventGroupFacilities?.eventType || ''}
          onChangeText={(text) =>
            updateEventGroupFacility('eventType', text)
          }
        />
        <Text style={styles.suggestionLabel}>Common event types:</Text>
        <View style={styles.chipContainer}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.chip,
                preferences.eventGroupFacilities?.eventType === type &&
                  styles.chipSelected,
              ]}
              onPress={() => updateEventGroupFacility('eventType', type)}
            >
              <Text
                style={[
                  styles.chipText,
                  preferences.eventGroupFacilities?.eventType === type &&
                    styles.chipTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Venue Setup */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Venue Setup</Text>
        <Text style={styles.sectionSubtitle}>
          Select required venue arrangements
        </Text>
        <View style={styles.chipContainer}>
          {venueSetupOptions.map((setup) => {
            const isSelected =
              preferences.eventGroupFacilities?.venueSetup?.includes(setup) ||
              false;
            return (
              <TouchableOpacity
                key={setup}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleVenueSetup(setup)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {isSelected ? '✓ ' : ''}
                  {setup}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Group Meals */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Group Meal Arrangements</Text>
        <Text style={styles.sectionSubtitle}>
          Select meal and catering options
        </Text>
        <View style={styles.chipContainer}>
          {groupMealOptions.map((meal) => {
            const isSelected =
              preferences.eventGroupFacilities?.groupMeal?.includes(meal) ||
              false;
            return (
              <TouchableOpacity
                key={meal}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleGroupMeal(meal)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {isSelected ? '✓ ' : ''}
                  {meal}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Transportation */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Group Transportation</Text>
            <Text style={styles.switchSubtitle}>
              Bus/van service for attendees
            </Text>
          </View>
          <Switch
            value={preferences.eventGroupFacilities?.transportation || false}
            onValueChange={(value) =>
              updateEventGroupFacility('transportation', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#DDD6FE' }}
            thumbColor={
              preferences.eventGroupFacilities?.transportation
                ? '#8B5CF6'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Decoration Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Decoration Preferences</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe your decoration preferences (e.g., Theme colors, Floral arrangements, Lighting...)"
          placeholderTextColor="#999"
          value={preferences.eventGroupFacilities?.decorationPreferences || ''}
          onChangeText={(text) =>
            updateEventGroupFacility('decorationPreferences', text)
          }
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Special Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Special Requests</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Any additional requirements or special requests for your event..."
          placeholderTextColor="#999"
          value={preferences.eventGroupFacilities?.specialRequests || ''}
          onChangeText={(text) =>
            updateEventGroupFacility('specialRequests', text)
          }
          multiline
          numberOfLines={4}
        />
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
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DDD6FE',
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
    color: '#5B21B6',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#6D28D9',
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
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isSmallDevice ? 12 : 16,
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterButton: {
    minWidth: 56,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  counterValue: {
    minWidth: 80,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  counterValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  chipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  chipText: {
    fontSize: 12,
    color: '#8B5CF6',
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
});
