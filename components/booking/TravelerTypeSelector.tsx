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
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      id: 'family' as const,
      icon: Users,
      title: 'Family & Friends',
      description: 'For family vacations and group trips',
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      id: 'couple' as const,
      icon: Heart,
      title: 'Couples & Romantic',
      description: 'For romantic getaways and honeymoons',
      color: '#EC4899',
      bgColor: '#FDF2F8',
    },
    {
      id: 'transit' as const,
      icon: User,
      title: 'Transit & Solo',
      description: 'For solo travelers and short stays',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      id: 'event' as const,
      icon: Calendar,
      title: 'Event & Group',
      description: 'For weddings, conferences, events',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
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
              <X size={24} color="#1A1A1A" strokeWidth={2} />
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
                      borderColor: type.color,
                      borderWidth: 2,
                      backgroundColor: type.bgColor,
                    },
                  ]}
                  onPress={() => handleSelect(type.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.typeCardContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: type.bgColor },
                      ]}
                    >
                      <Icon size={28} color={type.color} strokeWidth={2} />
                    </View>
                    <View style={styles.typeInfo}>
                      <Text style={styles.typeTitle}>{type.title}</Text>
                      <Text style={styles.typeDescription}>
                        {type.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        style={[
                          styles.selectedBadge,
                          { backgroundColor: type.color },
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
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
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#666',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  typeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#666',
    lineHeight: 18,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
