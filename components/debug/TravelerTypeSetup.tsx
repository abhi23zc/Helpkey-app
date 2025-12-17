import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { db } from '@/config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export default function TravelerTypeSetup() {
  const [isCreating, setIsCreating] = useState(false);

  const travelerTypesData = [
    {
      id: 'corporate-business',
      title: 'Corporate & Business',
      description: 'For businessmen, executives, professionals',
      icon: 'briefcase',
      color: 'blue',
      active: true,
      order: 1,
      preferenceCategories: [
        {
          id: 'workspace_setup',
          name: 'Workspace Setup',
          description: 'Configure your work environment',
          options: [
            {
              id: 'desk_setup',
              label: 'Desk Setup',
              type: 'select',
              options: ['Standard Desk', 'Executive Desk', 'Standing Desk'],
              price: 0,
              required: false,
              description: 'Choose your preferred desk configuration'
            },
            {
              id: 'wifi_priority',
              label: 'High-Speed WiFi Priority',
              type: 'checkbox',
              price: 200,
              required: false,
              description: 'Get priority bandwidth for business needs'
            },
            {
              id: 'printing_service',
              label: 'Printing & Scanning Service',
              type: 'checkbox',
              price: 150,
              required: false,
              description: 'Access to business center facilities'
            }
          ]
        },
        {
          id: 'business_services',
          name: 'Business Services',
          description: 'Additional business amenities',
          options: [
            {
              id: 'meeting_room',
              label: 'Meeting Room Access',
              type: 'select',
              options: ['2 Hours', '4 Hours', 'Full Day'],
              price: 500,
              required: false,
              description: 'Book meeting room for business discussions'
            },
            {
              id: 'airport_transfer',
              label: 'Airport Transfer',
              type: 'checkbox',
              price: 800,
              required: false,
              description: 'Complimentary airport pickup and drop'
            }
          ]
        }
      ]
    },
    {
      id: 'couples-romantic',
      title: 'Couples & Romantic',
      description: 'For romantic getaways and honeymoons',
      icon: 'heart',
      color: 'pink',
      active: true,
      order: 2,
      preferenceCategories: [
        {
          id: 'romantic_setup',
          name: 'Romantic Setup',
          description: 'Create the perfect romantic atmosphere',
          options: [
            {
              id: 'room_decoration',
              label: 'Room Decoration',
              type: 'select',
              options: ['Rose Petals', 'Candles & Flowers', 'Balloon Decoration'],
              price: 800,
              required: false,
              description: 'Beautiful room decoration for special moments'
            },
            {
              id: 'room_aroma',
              label: 'Room Aroma',
              type: 'select',
              options: ['Lavender', 'Rose', 'Vanilla', 'Jasmine'],
              price: 300,
              required: false,
              description: 'Choose your preferred room fragrance'
            },
            {
              id: 'privacy_mode',
              label: 'Do Not Disturb Mode',
              type: 'checkbox',
              price: 0,
              required: false,
              description: 'Ensure complete privacy during your stay'
            }
          ]
        },
        {
          id: 'special_services',
          name: 'Special Services',
          description: 'Make your stay extra special',
          options: [
            {
              id: 'couple_spa',
              label: 'Couple Spa Session',
              type: 'select',
              options: ['60 Minutes', '90 Minutes', '120 Minutes'],
              price: 2500,
              required: false,
              description: 'Relaxing spa experience for couples'
            },
            {
              id: 'romantic_dinner',
              label: 'Romantic Dinner Setup',
              type: 'checkbox',
              price: 1500,
              required: false,
              description: 'Private candlelight dinner arrangement'
            },
            {
              id: 'champagne_service',
              label: 'Champagne & Chocolates',
              type: 'checkbox',
              price: 1200,
              required: false,
              description: 'Welcome champagne with premium chocolates'
            }
          ]
        }
      ]
    },
    {
      id: 'family-friends',
      title: 'Family & Friends',
      description: 'For family vacations and group trips',
      icon: 'users',
      color: 'green',
      active: true,
      order: 3,
      preferenceCategories: [
        {
          id: 'family_accommodation',
          name: 'Family Accommodation',
          description: 'Comfortable setup for families',
          options: [
            {
              id: 'extra_beds',
              label: 'Extra Beds/Cots',
              type: 'number',
              price: 500,
              required: false,
              description: 'Additional beds for family members'
            },
            {
              id: 'interconnected_rooms',
              label: 'Interconnected Rooms',
              type: 'checkbox',
              price: 800,
              required: false,
              description: 'Connect rooms for easy family access'
            },
            {
              id: 'kitchenette_access',
              label: 'Kitchenette Access',
              type: 'checkbox',
              price: 600,
              required: false,
              description: 'Basic cooking facilities for family meals'
            }
          ]
        },
        {
          id: 'family_services',
          name: 'Family Services',
          description: 'Services tailored for families',
          options: [
            {
              id: 'kids_meals',
              label: 'Kids Meal Options',
              type: 'multiselect',
              options: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
              price: 300,
              required: false,
              description: 'Special meal arrangements for children'
            },
            {
              id: 'family_entertainment',
              label: 'Family Entertainment',
              type: 'multiselect',
              options: ['Board Games', 'Movie Night Setup', 'Kids Play Area'],
              price: 400,
              required: false,
              description: 'Entertainment options for the whole family'
            }
          ]
        }
      ]
    },
    {
      id: 'transit-solo',
      title: 'Transit & Solo',
      description: 'For solo travelers and short stays',
      icon: 'user',
      color: 'yellow',
      active: true,
      order: 4,
      preferenceCategories: [
        {
          id: 'travel_convenience',
          name: 'Travel Convenience',
          description: 'Services for convenient travel',
          options: [
            {
              id: 'flexible_checkin',
              label: 'Flexible Check-in Time',
              type: 'select',
              options: ['Early Check-in', 'Late Check-in', 'Express Check-in'],
              price: 300,
              required: false,
              description: 'Flexible timing for your convenience'
            },
            {
              id: 'luggage_storage',
              label: 'Luggage Storage Service',
              type: 'checkbox',
              price: 200,
              required: false,
              description: 'Secure storage for your belongings'
            }
          ]
        },
        {
          id: 'solo_services',
          name: 'Solo Traveler Services',
          description: 'Special services for solo travelers',
          options: [
            {
              id: 'local_recommendations',
              label: 'Local Area Recommendations',
              type: 'multiselect',
              options: ['Restaurants', 'Tourist Spots', 'Shopping Areas', 'Transportation'],
              price: 0,
              required: false,
              description: 'Get insider tips about the local area'
            },
            {
              id: 'safety_features',
              label: 'Enhanced Safety Features',
              type: 'checkbox',
              price: 0,
              required: false,
              description: 'Additional safety measures for solo travelers'
            }
          ]
        }
      ]
    },
    {
      id: 'event-group',
      title: 'Event & Group',
      description: 'For weddings, conferences, events',
      icon: 'calendar',
      color: 'purple',
      active: true,
      order: 5,
      preferenceCategories: [
        {
          id: 'group_accommodation',
          name: 'Group Accommodation',
          description: 'Arrangements for group stays',
          options: [
            {
              id: 'group_size',
              label: 'Group Size',
              type: 'number',
              price: 0,
              required: true,
              description: 'Number of people in your group'
            },
            {
              id: 'room_proximity',
              label: 'Room Proximity',
              type: 'select',
              options: ['Same Floor', 'Adjacent Rooms', 'Same Building'],
              price: 500,
              required: false,
              description: 'Keep group members close together'
            }
          ]
        },
        {
          id: 'event_services',
          name: 'Event Services',
          description: 'Services for special events',
          options: [
            {
              id: 'event_catering',
              label: 'Event Catering',
              type: 'multiselect',
              options: ['Welcome Drinks', 'Group Breakfast', 'Lunch Buffet', 'Dinner Arrangement'],
              price: 800,
              required: false,
              description: 'Catering services for your event'
            },
            {
              id: 'decoration_service',
              label: 'Event Decoration',
              type: 'text',
              price: 1000,
              required: false,
              description: 'Describe your decoration requirements'
            },
            {
              id: 'group_transportation',
              label: 'Group Transportation',
              type: 'checkbox',
              price: 1500,
              required: false,
              description: 'Transportation arrangement for the group'
            }
          ]
        }
      ]
    }
  ];

  const createTravelerTypes = async () => {
    try {
      setIsCreating(true);
      
      for (const travelerType of travelerTypesData) {
        await setDoc(doc(db, 'travelerTypes', travelerType.id), travelerType);
      }
      
      Alert.alert(
        'Success!',
        'Traveler types have been created successfully in Firebase. You can now test the dynamic preferences feature.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating traveler types:', error);
      Alert.alert(
        'Error',
        'Failed to create traveler types. Please check your Firebase configuration.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Only show in development
  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🧪 Debug: Setup Traveler Types</Text>
        <Text style={styles.description}>
          Create sample traveler types in Firebase to test dynamic preferences
        </Text>
        <TouchableOpacity
          style={[styles.button, isCreating && styles.buttonDisabled]}
          onPress={createTravelerTypes}
          disabled={isCreating}
        >
          <Text style={styles.buttonText}>
            {isCreating ? 'Creating...' : 'Create Traveler Types'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});