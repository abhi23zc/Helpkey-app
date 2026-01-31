import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Briefcase, Users, Heart, User, Calendar, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface TravelerTypeSelectorProps {
  visible: boolean;
  selectedType?: 'corporate' | 'family' | 'couple' | 'transit' | 'event';
  onSelect: (type: 'corporate' | 'family' | 'couple' | 'transit' | 'event') => void;
  onClose: () => void;
}

export default function TravelerTypeSelector({
  visible,
  selectedType,
  onSelect,
  onClose,
}: TravelerTypeSelectorProps) {
  const travelerTypes = [
    {
      id: 'corporate' as const,
      icon: Briefcase,
      title: 'Corporate & Business',
      description: 'For businessmen, executives, professionals',
      color: '#00D9FF',
      bgColor: 'rgba(0, 217, 255, 0.1)',
    },
    {
      id: 'family' as const,
      icon: Users,
      title: 'Family & Friends',
      description: 'For family vacations and group trips',
      color: '#00D9FF',
      bgColor: 'rgba(0, 217, 255, 0.1)',
    },
    {
      id: 'couple' as const,
      icon: Heart,
      title: 'Couples & Romantic',
      description: 'For romantic getaways and honeymoons',
      color: '#00D9FF',
      bgColor: 'rgba(0, 217, 255, 0.1)',
    },
    {
      id: 'transit' as const,
      icon: User,
      title: 'Transit & Solo',
      description: 'For solo travelers and short stays',
      color: '#00D9FF',
      bgColor: 'rgba(0, 217, 255, 0.1)',
    },
    {
      id: 'event' as const,
      icon: Calendar,
      title: 'Event & Group',
      description: 'For weddings, conferences, events',
      color: '#00D9FF',
      bgColor: 'rgba(0, 217, 255, 0.1)',
    },
  ];

  const handleSelect = (type: 'corporate' | 'family' | 'couple' | 'transit' | 'event') => {
    onSelect(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Select Traveler Type</Text>
              <Text style={styles.headerSubtitle}>
                Customize your room preferences
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {travelerTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    isSelected && {
                      borderColor: '#00D9FF',
                      borderWidth: 1,
                      backgroundColor: 'rgba(0, 217, 255, 0.05)',
                    },
                  ]}
                  onPress={() => handleSelect(type.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.typeCardContent}>
                    <View
                      style={[
                        styles.iconContainer,

                      ]}
                    >
                      <Icon size={24} color={isSelected ? '#00D9FF' : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
                    </View>
                    <View style={styles.typeInfo}>
                      <Text style={[styles.typeTitle, isSelected && { color: '#00D9FF' }]}>{type.title}</Text>
                      <Text style={styles.typeDescription}>
                        {type.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        style={[
                          styles.selectedBadge,
                        ]}
                      >
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0a0e27',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  typeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: isSmallDevice ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 18,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: '#00D9FF',
  },
  selectedBadgeText: {
    color: '#0a0e27',
    fontSize: 14,
    fontWeight: '700',
  },
});
