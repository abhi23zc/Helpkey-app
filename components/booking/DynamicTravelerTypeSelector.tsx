import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LoadingSpinner from '@/components/LoadingSpinner';
import { X, Briefcase, Users, Heart, User, Calendar } from 'lucide-react-native';
import { db } from '@/config/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

interface TravelerType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
  order: number;
}

interface DynamicTravelerTypeSelectorProps {
  visible: boolean;
  selectedType?: string;
  onSelect: (typeId: string) => void;
  onClose: () => void;
}

export default function DynamicTravelerTypeSelector({
  visible,
  selectedType,
  onSelect,
  onClose,
}: DynamicTravelerTypeSelectorProps) {
  const [travelerTypes, setTravelerTypes] = useState<TravelerType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchTravelerTypes();
    }
  }, [visible]);

  const fetchTravelerTypes = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'travelerTypes'),
        where('active', '==', true),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      const types = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TravelerType[];
      setTravelerTypes(types);
    } catch (error) {
      console.error('Error fetching traveler types:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'briefcase': Briefcase,
      'users': Users,
      'heart': Heart,
      'user': User,
      'calendar': Calendar,
    };
    return iconMap[iconName] || Briefcase;
  };

  const getColorStyles = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'rgba(0, 212, 255, 0.1)', border: '#00D4FF', text: '#00D4FF' },
      green: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981', text: '#10B981' },
      pink: { bg: 'rgba(236, 72, 153, 0.1)', border: '#EC4899', text: '#EC4899' },
      yellow: { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B', text: '#F59E0B' },
      purple: { bg: 'rgba(139, 92, 246, 0.1)', border: '#8B5CF6', text: '#8B5CF6' },
    };
    return colorMap[color] || colorMap.blue;
  };

  const handleSelect = (typeId: string) => {
    onSelect(typeId);
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
            {loading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner size="large" />
                <Text style={styles.loadingText}>Loading traveler types...</Text>
              </View>
            ) : travelerTypes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No traveler types available at the moment.</Text>
              </View>
            ) : (
              travelerTypes.map((type) => {
                const Icon = getIconComponent(type.icon);
                const isSelected = selectedType === type.id;
                const colorStyles = getColorStyles(type.color);

                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      isSelected && {
                        borderColor: '#00D4FF',
                        borderWidth: 1,
                        backgroundColor: 'rgba(0, 212, 255, 0.05)',
                      },
                    ]}
                    onPress={() => handleSelect(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.typeCardContent}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: colorStyles.bg },
                        ]}
                      >
                        <Icon size={24} color={isSelected ? colorStyles.border : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
                      </View>
                      <View style={styles.typeInfo}>
                        <Text style={[styles.typeTitle, isSelected && { color: colorStyles.border }]}>{type.title}</Text>
                        <Text style={styles.typeDescription}>
                          {type.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View
                          style={[
                            styles.selectedBadge,
                            { backgroundColor: colorStyles.border },
                          ]}
                        >
                          <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
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
    backgroundColor: '#00D4FF',
  },
  selectedBadgeText: {
    color: '#0a0e27',
    fontSize: 14,
    fontWeight: '700',
  },
});