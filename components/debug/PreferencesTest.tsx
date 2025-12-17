import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DynamicTravelerTypeSelector from '@/components/booking/DynamicTravelerTypeSelector';
import DynamicPreferences from '@/components/booking/DynamicPreferences';

export default function PreferencesTest() {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [preferences, setPreferences] = useState<Record<string, any>>({});

  const handleTypeSelect = (typeId: string) => {
    setSelectedTypeId(typeId);
    setPreferences({}); // Reset preferences
    Alert.alert('Success', `Selected traveler type: ${typeId}`);
  };

  const handlePreferencesChange = (newPreferences: Record<string, any>) => {
    setPreferences(newPreferences);
    console.log('Preferences updated:', newPreferences);
  };

  // Only show in development
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Dynamic Preferences Test</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setShowSelector(true)}
      >
        <Text style={styles.buttonText}>
          {selectedTypeId ? `Selected: ${selectedTypeId}` : 'Select Traveler Type'}
        </Text>
      </TouchableOpacity>

      {selectedTypeId && (
        <View style={styles.preferencesContainer}>
          <Text style={styles.sectionTitle}>Dynamic Preferences:</Text>
          <DynamicPreferences
            travelerTypeId={selectedTypeId}
            preferences={preferences}
            onPreferencesChange={handlePreferencesChange}
          />
        </View>
      )}

      <DynamicTravelerTypeSelector
        visible={showSelector}
        selectedType={selectedTypeId}
        onSelect={handleTypeSelect}
        onClose={() => setShowSelector(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F9FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  preferencesContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 12,
  },
});