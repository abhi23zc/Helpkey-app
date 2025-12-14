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
import { Heart } from 'lucide-react-native';
import { CustomerPreferences } from '@/types/booking';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface CouplePreferencesProps {
  preferences: CustomerPreferences;
  onUpdate: (preferences: CustomerPreferences) => void;
}

export default function CouplePreferences({
  preferences,
  onUpdate,
}: CouplePreferencesProps) {
  const aromas = [
    'Lavender',
    'Vanilla',
    'Rose',
    'Eucalyptus',
    'Citrus',
    'Sandalwood',
    'Jasmine',
  ];

  const romanticSetups = [
    'Rose petals on bed',
    'Scented candles',
    'Champagne & chocolates',
    'Heart-shaped decorations',
    'Romantic lighting',
    'Flower bouquet',
  ];

  const snackItems = [
    'Fresh fruits',
    'Soft drinks',
    'Mineral water',
    'Cookies & biscuits',
    'Nuts & chips',
    'Energy drinks',
    'Juice bottles',
    'Chocolates',
  ];

  const handleAromaSelect = (aroma: string) => {
    onUpdate({
      ...preferences,
      couplePreferences: {
        ...preferences.couplePreferences,
        roomAroma: aroma,
      },
    });
  };

  const handleRomanticSetupAdd = (setup: string) => {
    const current = preferences.couplePreferences?.romanticSetup || '';
    const newSetup = current ? `${current}, ${setup}` : setup;
    onUpdate({
      ...preferences,
      couplePreferences: {
        ...preferences.couplePreferences,
        romanticSetup: newSetup,
      },
    });
  };

  const handleSnackAdd = (snack: string) => {
    const current = preferences.couplePreferences?.snacksAndDrinks || '';
    const newSnacks = current ? `${current}, ${snack}` : snack;
    onUpdate({
      ...preferences,
      couplePreferences: {
        ...preferences.couplePreferences,
        snacksAndDrinks: newSnacks,
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
          <Heart size={24} color="#EC4899" strokeWidth={2} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Couples & Romantic Getaways</Text>
          <Text style={styles.headerSubtitle}>
            💕 Perfect for romantic getaways, honeymoons, and special
            celebrations
          </Text>
        </View>
      </View>

      {/* Room Aroma */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Room Aroma</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter preferred aroma (e.g., Lavender, Vanilla, Rose...)"
          placeholderTextColor="#999"
          value={preferences.couplePreferences?.roomAroma || ''}
          onChangeText={(text) =>
            onUpdate({
              ...preferences,
              couplePreferences: {
                ...preferences.couplePreferences,
                roomAroma: text,
              },
            })
          }
        />
        <Text style={styles.suggestionLabel}>Popular suggestions:</Text>
        <View style={styles.chipContainer}>
          {aromas.map((aroma) => (
            <TouchableOpacity
              key={aroma}
              style={[
                styles.chip,
                preferences.couplePreferences?.roomAroma === aroma &&
                  styles.chipSelected,
              ]}
              onPress={() => handleAromaSelect(aroma)}
            >
              <Text
                style={[
                  styles.chipText,
                  preferences.couplePreferences?.roomAroma === aroma &&
                    styles.chipTextSelected,
                ]}
              >
                {aroma}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Romantic Setup */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Romantic Setup</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe your romantic setup preferences (e.g., Rose petals, Candles, Chocolates...)"
          placeholderTextColor="#999"
          value={preferences.couplePreferences?.romanticSetup || ''}
          onChangeText={(text) =>
            onUpdate({
              ...preferences,
              couplePreferences: {
                ...preferences.couplePreferences,
                romanticSetup: text,
              },
            })
          }
          multiline
          numberOfLines={3}
        />
        <Text style={styles.suggestionLabel}>Popular suggestions:</Text>
        <View style={styles.chipContainer}>
          {romanticSetups.map((setup) => (
            <TouchableOpacity
              key={setup}
              style={styles.chipAdd}
              onPress={() => handleRomanticSetupAdd(setup)}
            >
              <Text style={styles.chipAddText}>+ {setup}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* No Disturb Mode */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>No Disturb Mode</Text>
            <Text style={styles.switchSubtitle}>
              No housekeeping or room service for complete privacy
            </Text>
          </View>
          <Switch
            value={preferences.couplePreferences?.noDisturbMode || false}
            onValueChange={(value) =>
              onUpdate({
                ...preferences,
                couplePreferences: {
                  ...preferences.couplePreferences,
                  noDisturbMode: value,
                },
              })
            }
            trackColor={{ false: '#E8E8E8', true: '#FFC0CB' }}
            thumbColor={
              preferences.couplePreferences?.noDisturbMode
                ? '#EC4899'
                : '#f4f3f4'
            }
          />
        </View>
      </View>

      {/* Snacks & Drinks */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Snacks & Cold Drinks</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Specify your preferred snacks and drinks (e.g., Fresh fruits, Soft drinks, Chips...)"
          placeholderTextColor="#999"
          value={preferences.couplePreferences?.snacksAndDrinks || ''}
          onChangeText={(text) =>
            onUpdate({
              ...preferences,
              couplePreferences: {
                ...preferences.couplePreferences,
                snacksAndDrinks: text,
              },
            })
          }
          multiline
          numberOfLines={3}
        />
        <Text style={styles.suggestionLabel}>Popular suggestions:</Text>
        <View style={styles.chipContainer}>
          {snackItems.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.chipAdd}
              onPress={() => handleSnackAdd(item)}
            >
              <Text style={styles.chipAddText}>+ {item}</Text>
            </TouchableOpacity>
          ))}
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
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCE7F3',
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
    color: '#831843',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#9F1239',
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FDF2F8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  chipSelected: {
    backgroundColor: '#EC4899',
    borderColor: '#EC4899',
  },
  chipText: {
    fontSize: 12,
    color: '#EC4899',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  chipAdd: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FDF2F8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  chipAddText: {
    fontSize: 12,
    color: '#EC4899',
    fontWeight: '600',
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
