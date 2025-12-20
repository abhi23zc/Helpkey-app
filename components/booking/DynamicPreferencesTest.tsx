import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Test component that matches your Firebase schema exactly
export default function DynamicPreferencesTest() {
  // Test data matching your Firebase schema
  const testOptions = [
    {
      id: 'no-disturb-mode',
      label: 'No Disturb Mode',
      type: 'checkbox' as const,
      price: 0,
      description: 'No housekeeping or room service for complete privacy',
      required: false
    },
    {
      id: 'room-aroma',
      label: 'Room Aroma',
      type: 'select' as const,
      price: 300,
      description: 'Preferred room fragrance',
      required: false,
      options: ['Lavender', 'Vanilla', 'Rose', 'Eucalyptus', 'Citrus', 'Sandalwood', 'Jasmine']
    },
    {
      id: 'romantic-setup',
      label: 'Romantic Setup',
      type: 'multiselect' as const,
      price: 1500,
      description: 'Special room decoration',
      required: false,
      options: ['Rose petals on bed', 'Scented candles', 'Champagne & chocolates', 'Heart-shaped decorations', 'Romantic lighting', 'Flower bouquet']
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dynamic Preferences Test</Text>
      <Text style={styles.subtitle}>Testing with Firebase schema structure</Text>
      
      {testOptions.map((option) => (
        <View key={option.id} style={styles.optionContainer}>
          <View style={styles.checkboxContainer}>
            <View style={styles.checkbox} />
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              {option.price > 0 && (
                <Text style={styles.optionPrice}>+₹{option.price}</Text>
              )}
              <Text style={styles.optionDescription}>{option.description}</Text>
              <Text style={styles.optionType}>Type: {option.type}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  optionContainer: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  optionType: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
});