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
import { Users } from 'lucide-react-native';
import { CustomerPreferences } from '@/types/booking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface FamilyPreferencesProps {
  preferences: CustomerPreferences;
  onUpdate: (preferences: CustomerPreferences) => void;
}

export default function FamilyPreferences({
  preferences,
  onUpdate,
}: FamilyPreferencesProps) {
  const kidMealOptions = [
    'Kid-friendly breakfast',
    'Lunch boxes',
    'Healthy snacks',
    'Milk & cereals',
    'Fruit platters',
    'Sandwiches',
  ];

  const entertainmentOptions = [
    'Kids play area',
    'Board games',
    'Cartoon channels',
    'Swimming pool access',
    'Outdoor playground',
    'Video games',
  ];

  const toggleKidMeal = (meal: string) => {
    const current = preferences.familyComforts?.kidMeals || [];
    const updated = current.includes(meal)
      ? current.filter((item) => item !== meal)
      : [...current, meal];

    onUpdate({
      ...preferences,
      familyComforts: {
        ...preferences.familyComforts,
        kidMeals: updated,
      },
    });
  };

  const toggleEntertainment = (option: string) => {
    const current = preferences.familyComforts?.familyEntertainment || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    onUpdate({
      ...preferences,
      familyComforts: {
        ...preferences.familyComforts,
        familyEntertainment: updated,
      },
    });
  };

  const updateFamilyComfort = (key: string, value: any) => {
    onUpdate({
      ...preferences,
      familyComforts: {
        ...preferences.familyComforts,
        [key]: value,
      },
    });
  };

  const updateExtraBeds = (count: number) => {
    onUpdate({
      ...preferences,
      familyComforts: {
        ...preferences.familyComforts,
        extraBedsCots: count,
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
          <Users size={24} color="#10B981" strokeWidth={2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Family & Friends Travel</Text>
          <Text style={styles.headerSubtitle}>
            👨‍👩‍👧‍👦 Perfect for family vacations and group trips
          </Text>
        </View>
      </View>

      {/* Extra Beds/Cots */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Extra Beds/Cots</Text>
        <Text style={styles.sectionSubtitle}>
          Number of additional beds needed
        </Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() =>
              updateExtraBeds(
                Math.max(
                  0,
                  (preferences.familyComforts?.extraBedsCots || 0) - 1
                )
              )
            }
          >
            <Text style={styles.counterButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.counterValue}>
            <Text style={styles.counterValueText}>
              {preferences.familyComforts?.extraBedsCots || 0}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() =>
              updateExtraBeds(
                (preferences.familyComforts?.extraBedsCots || 0) + 1
              )
            }
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interconnected Rooms */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Interconnected Rooms</Text>
            <Text style={styles.switchSubtitle}>
              Adjacent rooms with connecting door
            </Text>
          </View>
          <Switch
            value={
              preferences.familyComforts?.interconnectedRooms || false
            }
            onValueChange={(value) =>
              updateFamilyComfort('interconnectedRooms', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#A7F3D0' }}
            thumbColor={
              preferences.familyComforts?.interconnectedRooms
                ? '#10B981'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Kid Meals */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Kid-Friendly Meals</Text>
        <Text style={styles.sectionSubtitle}>
          Select meal preferences for children
        </Text>
        <View style={styles.chipContainer}>
          {kidMealOptions.map((meal) => {
            const isSelected =
              preferences.familyComforts?.kidMeals?.includes(meal) || false;
            return (
              <TouchableOpacity
                key={meal}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleKidMeal(meal)}
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

      {/* Family Entertainment */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Family Entertainment</Text>
        <Text style={styles.sectionSubtitle}>
          Activities and amenities for kids
        </Text>
        <View style={styles.chipContainer}>
          {entertainmentOptions.map((option) => {
            const isSelected =
              preferences.familyComforts?.familyEntertainment?.includes(
                option
              ) || false;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleEntertainment(option)}
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

      {/* Group Tours */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Group Tours & Activities</Text>
            <Text style={styles.switchSubtitle}>
              Organized tours for the family
            </Text>
          </View>
          <Switch
            value={preferences.familyComforts?.groupTours || false}
            onValueChange={(value) =>
              updateFamilyComfort('groupTours', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#A7F3D0' }}
            thumbColor={
              preferences.familyComforts?.groupTours ? '#10B981' : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Kitchenette Access */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Kitchenette Access</Text>
            <Text style={styles.switchSubtitle}>
              Basic cooking facilities in room
            </Text>
          </View>
          <Switch
            value={preferences.familyComforts?.kitchenetteAccess || false}
            onValueChange={(value) =>
              updateFamilyComfort('kitchenetteAccess', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#A7F3D0' }}
            thumbColor={
              preferences.familyComforts?.kitchenetteAccess
                ? '#10B981'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Late Night Snacks */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>Late Night Snacks</Text>
            <Text style={styles.switchSubtitle}>
              Snacks and drinks for late hours
            </Text>
          </View>
          <Switch
            value={preferences.familyComforts?.lateNightSnacks || false}
            onValueChange={(value) =>
              updateFamilyComfort('lateNightSnacks', value)
            }
            trackColor={{ false: '#E8E8E8', true: '#A7F3D0' }}
            thumbColor={
              preferences.familyComforts?.lateNightSnacks
                ? '#10B981'
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
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
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
    color: '#065F46',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#047857',
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
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  counterValue: {
    minWidth: 60,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  counterValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  chipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 12,
    color: '#10B981',
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
