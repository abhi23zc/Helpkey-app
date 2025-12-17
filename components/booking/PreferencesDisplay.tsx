import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { 
  Briefcase, 
  Users, 
  Heart, 
  User, 
  Calendar,
  CheckCircle 
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface PreferencesDisplayProps {
  preferences: any;
}

// Function to render dynamic preferences
const renderDynamicPreferences = (dynamicPreferences: Record<string, any>) => {
  const hasAnyPreferences = Object.values(dynamicPreferences).some(category => 
    category && Object.values(category).some(value => 
      value !== null && value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    )
  );

  if (!hasAnyPreferences) {
    return null;
  }

  return (
    <View style={styles.dynamicContainer}>
      <View style={styles.dynamicHeader}>
        <CheckCircle size={20} color="#059669" strokeWidth={2} />
        <Text style={styles.dynamicTitle}>Selected Preferences</Text>
      </View>
      
      {Object.entries(dynamicPreferences).map(([categoryId, categoryPrefs]) => {
        if (!categoryPrefs || Object.keys(categoryPrefs).length === 0) return null;
        
        const hasValidPrefs = Object.values(categoryPrefs).some(value => 
          value !== null && value !== undefined && value !== '' && 
          (Array.isArray(value) ? value.length > 0 : true)
        );
        
        if (!hasValidPrefs) return null;

        return (
          <View key={categoryId} style={styles.dynamicCategory}>
            <Text style={styles.dynamicCategoryTitle}>
              {categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            {Object.entries(categoryPrefs).map(([optionId, value]) => {
              if (value === null || value === undefined || value === '' || 
                  (Array.isArray(value) && value.length === 0)) {
                return null;
              }

              return (
                <View key={optionId} style={styles.dynamicPrefItem}>
                  <CheckCircle size={14} color="#059669" strokeWidth={2} />
                  <Text style={styles.dynamicPrefText}>
                    <Text style={styles.dynamicPrefLabel}>
                      {optionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </Text>
                    {' '}
                    {Array.isArray(value) ? value.join(', ') : 
                     typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                     value.toString()}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

export default function PreferencesDisplay({ preferences }: PreferencesDisplayProps) {
  // Handle both old static preferences and new dynamic preferences
  if (!preferences || (!preferences.travelerType && !preferences.dynamicPreferences)) {
    return null;
  }

  // If we have dynamic preferences, render them
  if (preferences.dynamicPreferences && Object.keys(preferences.dynamicPreferences).length > 0) {
    return renderDynamicPreferences(preferences.dynamicPreferences);
  }

  // Fallback to old static preferences
  if (!preferences.travelerType) {
    return null;
  }

  const getTravelerTypeInfo = (type: string) => {
    const info = {
      corporate: {
        icon: Briefcase,
        label: 'Corporate & Business',
        color: '#3B82F6',
        bgColor: '#EFF6FF',
      },
      family: {
        icon: Users,
        label: 'Family & Friends',
        color: '#10B981',
        bgColor: '#ECFDF5',
      },
      couple: {
        icon: Heart,
        label: 'Couples & Romantic',
        color: '#EC4899',
        bgColor: '#FDF2F8',
      },
      transit: {
        icon: User,
        label: 'Transit & Solo',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
      },
      event: {
        icon: Calendar,
        label: 'Event & Group',
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
      },
    };
    return info[type as keyof typeof info] || info.corporate;
  };

  const typeInfo = getTravelerTypeInfo(preferences.travelerType);
  const Icon = typeInfo.icon;

  const renderCorporatePreferences = () => {
    const prefs = preferences.businessEssentials;
    if (!prefs) return null;

    return (
      <View style={styles.preferencesContent}>
        {prefs.workspaceSetup && prefs.workspaceSetup.length > 0 && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>
              Workspace: {prefs.workspaceSetup.join(', ')}
            </Text>
          </View>
        )}
        {prefs.meetingRoomRequired && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Meeting room required</Text>
          </View>
        )}
        {prefs.breakfastTiming && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>
              Breakfast: {prefs.breakfastTiming === 'early' ? 'Early (6-7 AM)' : 
                         prefs.breakfastTiming === 'regular' ? 'Regular (7:30-9 AM)' : 
                         'Late (9-10:30 AM)'}
            </Text>
          </View>
        )}
        {prefs.highSpeedWiFi && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>High-speed WiFi priority</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCouplePreferences = () => {
    const prefs = preferences.couplePreferences;
    if (!prefs) return null;

    return (
      <View style={styles.preferencesContent}>
        {prefs.roomAroma && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Room aroma: {prefs.roomAroma}</Text>
          </View>
        )}
        {prefs.romanticSetup && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Romantic setup: {prefs.romanticSetup}</Text>
          </View>
        )}
        {prefs.noDisturbMode && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>No disturb mode enabled</Text>
          </View>
        )}
        {prefs.snacksAndDrinks && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Snacks: {prefs.snacksAndDrinks}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFamilyPreferences = () => {
    const prefs = preferences.familyComforts;
    if (!prefs) return null;

    return (
      <View style={styles.preferencesContent}>
        {prefs.extraBedsCots > 0 && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Extra beds: {prefs.extraBedsCots}</Text>
          </View>
        )}
        {prefs.interconnectedRooms && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Interconnected rooms</Text>
          </View>
        )}
        {prefs.kidMeals && prefs.kidMeals.length > 0 && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Kid meals: {prefs.kidMeals.join(', ')}</Text>
          </View>
        )}
        {prefs.familyEntertainment && prefs.familyEntertainment.length > 0 && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>
              Entertainment: {prefs.familyEntertainment.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTransitPreferences = () => {
    const prefs = preferences.transitSoloEssentials;
    if (!prefs) return null;

    return (
      <View style={styles.preferencesContent}>
        {prefs.checkInFlexibility && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>
              Check-in: {prefs.checkInFlexibility === 'early' ? 'Early (before 12 PM)' :
                        prefs.checkInFlexibility === 'late' ? 'Late (after 6 PM)' :
                        prefs.checkInFlexibility === 'flexible' ? 'Flexible timing' :
                        'Standard (2-3 PM)'}
            </Text>
          </View>
        )}
        {prefs.breakfastTakeaway && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Breakfast takeaway</Text>
          </View>
        )}
        {prefs.nearbyAttractions && prefs.nearbyAttractions.length > 0 && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>
              Interests: {prefs.nearbyAttractions.join(', ')}
            </Text>
          </View>
        )}
        {prefs.noiseIsolation && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Quiet room preferred</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEventPreferences = () => {
    const prefs = preferences.eventGroupFacilities;
    if (!prefs) return null;

    return (
      <View style={styles.preferencesContent}>
        {prefs.groupSize && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Group size: {prefs.groupSize} people</Text>
          </View>
        )}
        {prefs.eventType && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Event type: {prefs.eventType}</Text>
          </View>
        )}
        {prefs.venueSetup && prefs.venueSetup.length > 0 && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Venue: {prefs.venueSetup.join(', ')}</Text>
          </View>
        )}
        {prefs.groupMeal && prefs.groupMeal.length > 0 && (
          <View style={styles.prefItem}>
            <CheckCircle size={16} color={typeInfo.color} strokeWidth={2} />
            <Text style={styles.prefText}>Meals: {prefs.groupMeal.join(', ')}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: typeInfo.bgColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: typeInfo.bgColor }]}>
          <Icon size={20} color={typeInfo.color} strokeWidth={2} />
        </View>
        <Text style={[styles.title, { color: typeInfo.color }]}>
          {typeInfo.label}
        </Text>
      </View>

      {preferences.travelerType === 'corporate' && renderCorporatePreferences()}
      {preferences.travelerType === 'couple' && renderCouplePreferences()}
      {preferences.travelerType === 'family' && renderFamilyPreferences()}
      {preferences.travelerType === 'transit' && renderTransitPreferences()}
      {preferences.travelerType === 'event' && renderEventPreferences()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '700',
  },
  preferencesContent: {
    gap: 8,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  prefText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 18,
  },

  // Dynamic Preferences Styles
  dynamicContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  dynamicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dynamicTitle: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 8,
  },
  dynamicCategory: {
    marginBottom: 12,
  },
  dynamicCategoryTitle: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 8,
  },
  dynamicPrefItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 8,
  },
  dynamicPrefText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 18,
  },
  dynamicPrefLabel: {
    fontWeight: '600',
    color: '#047857',
  },
});
