import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';

interface PreferenceOption {
  id: string;
  label: string;
  type: 'checkbox' | 'select' | 'multiselect' | 'number' | 'text';
  options?: string[];
  price?: number;
  required?: boolean;
  description?: string;
}

interface PreferenceCategory {
  id: string;
  name: string;
  description?: string;
  options: PreferenceOption[];
}

interface TravelerType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
  order: number;
  preferenceCategories: PreferenceCategory[];
}

interface DynamicPreferencesProps {
  travelerTypeId: string;
  preferences: Record<string, any>;
  onPreferencesChange: (
    preferences: Record<string, any>,
    totalPrice?: number,
    breakdown?: Array<{ label: string; price: number; quantity?: number }>
  ) => void;
}

export default function DynamicPreferences({
  travelerTypeId,
  preferences,
  onPreferencesChange,
}: DynamicPreferencesProps) {
  const [travelerType, setTravelerType] = useState<TravelerType | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTravelerType();
  }, [travelerTypeId]);

  const fetchTravelerType = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'travelerTypes', travelerTypeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTravelerType({
          id: docSnap.id,
          ...data,
        } as TravelerType);

        // Auto-expand first category
        if (data.preferenceCategories && data.preferenceCategories.length > 0) {
          setExpandedCategories(new Set([data.preferenceCategories[0].id]));
        }
      }
    } catch (error) {
      console.error('Error fetching traveler type:', error);
      Alert.alert('Error', 'Failed to load preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = (prefs: Record<string, any>) => {
    if (!travelerType) return 0;

    let total = 0;

    travelerType.preferenceCategories.forEach(category => {
      const categoryPrefs = prefs[category.id];
      if (!categoryPrefs) return;

      category.options.forEach(option => {
        const value = categoryPrefs[option.id];

        // Skip if no value or false
        if (!value || value === false || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
          return;
        }

        // Add price if option has a price
        if (option.price && option.price > 0) {
          if (option.type === 'checkbox' && value === true) {
            total += option.price;
          } else if (option.type === 'select' && value) {
            total += option.price;
          } else if (option.type === 'multiselect' && Array.isArray(value) && value.length > 0) {
            total += option.price * value.length;
          } else if (option.type === 'number' && typeof value === 'number' && value > 0) {
            total += option.price * value;
          } else if (option.type === 'text' && value) {
            total += option.price;
          }
        }
      });
    });

    return total;
  };

  const getDetailedPriceBreakdown = (prefs: Record<string, any>) => {
    if (!travelerType) return [];

    const breakdown: Array<{ label: string; price: number; quantity?: number }> = [];

    travelerType.preferenceCategories.forEach(category => {
      const categoryPrefs = prefs[category.id];
      if (!categoryPrefs) return;

      category.options.forEach(option => {
        const value = categoryPrefs[option.id];

        // Skip if no value or false
        if (!value || value === false || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
          return;
        }

        // Add to breakdown if option has a price
        if (option.price && option.price > 0) {
          if (option.type === 'checkbox' && value === true) {
            breakdown.push({ label: option.label, price: option.price });
          } else if (option.type === 'select' && value) {
            breakdown.push({ label: `${option.label}: ${value}`, price: option.price });
          } else if (option.type === 'multiselect' && Array.isArray(value) && value.length > 0) {
            breakdown.push({
              label: `${option.label} (${value.length} items)`,
              price: option.price,
              quantity: value.length
            });
          } else if (option.type === 'number' && typeof value === 'number' && value > 0) {
            breakdown.push({
              label: `${option.label} (${value})`,
              price: option.price,
              quantity: value
            });
          } else if (option.type === 'text' && value) {
            breakdown.push({ label: option.label, price: option.price });
          }
        }
      });
    });

    return breakdown;
  };

  const handlePreferenceChange = (categoryId: string, optionId: string, value: any) => {
    const updatedPreferences = {
      ...preferences,
      [categoryId]: {
        ...(preferences[categoryId] || {}),
        [optionId]: value,
      },
    };

    const totalPrice = calculateTotalPrice(updatedPreferences);
    const breakdown = getDetailedPriceBreakdown(updatedPreferences);
    onPreferencesChange(updatedPreferences, totalPrice, breakdown);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderOption = (category: PreferenceCategory, option: PreferenceOption) => {
    const currentValue = preferences[category.id]?.[option.id];

    switch (option.type) {
      case 'checkbox':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, currentValue && styles.checkboxActive]}
                onPress={() => handlePreferenceChange(category.id, option.id, !currentValue)}
              >
                {currentValue && <Check size={14} color="#FFF" strokeWidth={3} />}
              </TouchableOpacity>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {option.price && option.price > 0 && (
                  <Text style={styles.optionPrice}>+₹{option.price}</Text>
                )}
                {option.description && (
                  <Text style={styles.optionDescription}>{option.description}</Text>
                )}
              </View>
            </View>
          </View>
        );

      case 'select':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={styles.optionLabel}>
              {option.label}
              {option.required && <Text style={styles.required}> *</Text>}
              {option.price && option.price > 0 && (
                <Text style={styles.optionPrice}> +₹{option.price}</Text>
              )}
            </Text>
            {option.description && (
              <Text style={styles.optionDescription}>{option.description}</Text>
            )}
            <View style={styles.selectContainer}>
              <Text style={styles.selectValue}>
                {currentValue || 'Select an option'}
              </Text>
              <ChevronDown size={16} color="#6B7280" />
            </View>
            {/* Simple implementation - in production, you'd want a proper picker */}
            <View style={styles.selectOptions}>
              {option.options?.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.selectOption,
                    currentValue === opt && styles.selectOptionActive,
                  ]}
                  onPress={() => handlePreferenceChange(category.id, option.id, opt)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      currentValue === opt && styles.selectOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'multiselect':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={styles.optionLabel}>
              {option.label}
              {option.required && <Text style={styles.required}> *</Text>}
              {option.price && option.price > 0 && (
                <Text style={styles.optionPrice}> +₹{option.price}</Text>
              )}
            </Text>
            {option.description && (
              <Text style={styles.optionDescription}>{option.description}</Text>
            )}
            <View style={styles.multiselectContainer}>
              {option.options?.map((opt) => {
                const isSelected = (currentValue || []).includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.multiselectChip, isSelected && styles.multiselectChipActive]}
                    onPress={() => {
                      const current = currentValue || [];
                      const updated = isSelected
                        ? current.filter((v: string) => v !== opt)
                        : [...current, opt];
                      handlePreferenceChange(category.id, option.id, updated);
                    }}
                  >
                    <Text
                      style={[
                        styles.multiselectChipText,
                        isSelected && styles.multiselectChipTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'number':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={styles.optionLabel}>
              {option.label}
              {option.required && <Text style={styles.required}> *</Text>}
              {option.price && option.price > 0 && (
                <Text style={styles.optionPrice}> +₹{option.price}</Text>
              )}
            </Text>
            {option.description && (
              <Text style={styles.optionDescription}>{option.description}</Text>
            )}
            <TextInput
              style={styles.numberInput}
              value={currentValue?.toString() || '0'}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                handlePreferenceChange(category.id, option.id, num);
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        );

      case 'text':
        return (
          <View key={option.id} style={styles.optionContainer}>
            <Text style={styles.optionLabel}>
              {option.label}
              {option.required && <Text style={styles.required}> *</Text>}
              {option.price && option.price > 0 && (
                <Text style={styles.optionPrice}> +₹{option.price}</Text>
              )}
            </Text>
            {option.description && (
              <Text style={styles.optionDescription}>{option.description}</Text>
            )}
            <TextInput
              style={styles.textInput}
              value={currentValue || ''}
              onChangeText={(text) => handlePreferenceChange(category.id, option.id, text)}
              placeholder="Enter text..."
              multiline={true}
              numberOfLines={3}
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  if (!travelerType || !travelerType.preferenceCategories || travelerType.preferenceCategories.length === 0) {
    return null;
  }

  const getColorStyles = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
      green: { bg: '#ECFDF5', border: '#10B981', text: '#047857' },
      pink: { bg: '#FDF2F8', border: '#EC4899', text: '#BE185D' },
      yellow: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
      purple: { bg: '#F5F3FF', border: '#8B5CF6', text: '#6D28D9' },
    };
    return colorMap[color] || colorMap.blue;
  };

  const colorStyles = getColorStyles(travelerType.color);

  // Custom theme overrides for specific traveler types to match the screenshot
  const isCorporate = travelerType.title.toLowerCase().includes('corporate') || travelerType.title.toLowerCase().includes('business');

  const containerStyle = isCorporate ? {
    backgroundColor: '#EFF6FF', // Light blue background
    borderColor: '#BFDBFE', // Blue border
    borderWidth: 1,
  } : {
    backgroundColor: colorStyles.bg,
    borderColor: colorStyles.border,
    borderWidth: 1,
  };

  const titleColor = isCorporate ? '#1E40AF' : colorStyles.text;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: titleColor }]}>
          {travelerType.title} Preferences
        </Text>
        <Text style={styles.subtitle}>Customize your stay experience</Text>
      </View>

      <View style={styles.content}>
        {travelerType.preferenceCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);

          return (
            <View key={category.id} style={styles.categoryContainer}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeaderContent}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.description && (
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  )}
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.categoryContent}>
                  {category.options.map((option) => renderOption(category, option))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    paddingBottom: 8,
  },
  categoryContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC', // Very subtle gray/white
  },
  categoryHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryContent: {
    padding: 16,
    paddingTop: 0,
  },
  optionContainer: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    backgroundColor: '#FFF',
  },
  checkboxActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionPrice: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  required: {
    color: '#EF4444',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  selectValue: {
    fontSize: 14,
    color: '#111827',
  },
  selectOptions: {
    marginTop: 8,
    gap: 4,
  },
  selectOption: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  selectOptionActive: {
    backgroundColor: '#111827',
  },
  selectOptionText: {
    fontSize: 13,
    color: '#374151',
  },
  selectOptionTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  multiselectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  multiselectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9', // Slate 100
    borderRadius: 24, // Pill shape
    borderWidth: 1,
    borderColor: 'transparent',
  },
  multiselectChipActive: {
    backgroundColor: '#1E293B', // Slate 800
    borderColor: '#1E293B',
  },
  multiselectChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  multiselectChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  numberInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    marginTop: 8,
    textAlignVertical: 'top',
    minHeight: 80,
  },
});