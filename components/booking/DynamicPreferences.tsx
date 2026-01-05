import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
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
  // Validate props
  if (!travelerTypeId || typeof travelerTypeId !== 'string') {
    console.error('DynamicPreferences: Invalid travelerTypeId:', travelerTypeId);
    return null;
  }

  if (!preferences || typeof preferences !== 'object') {
    console.error('DynamicPreferences: Invalid preferences:', preferences);
    return null;
  }

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

        // Validate the data structure
        if (!data || !data.preferenceCategories || !Array.isArray(data.preferenceCategories)) {
          console.error('DynamicPreferences: Invalid traveler type data structure:', data);
          setTravelerType(null);
          setLoading(false);
          return;
        }

        // Validate each category and option
        const validCategories = data.preferenceCategories.filter((category: any) => {
          if (!category || !category.id || !category.name || !Array.isArray(category.options)) {
            console.warn('DynamicPreferences: Invalid category:', category);
            return false;
          }

          // Validate options within the category
          category.options = category.options.filter((option: any) => {
            if (!option || !option.id || !option.type || !option.label) {
              console.warn('DynamicPreferences: Invalid option:', option);
              return false;
            }
            return true;
          });

          return category.options.length > 0;
        });

        setTravelerType({
          id: docSnap.id,
          ...data,
          preferenceCategories: validCategories,
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
    try {
      // Safety check for option object
      if (!option || !option.id || !option.type) {
        return null;
      }

      const currentValue = preferences[category.id]?.[option.id];

      switch (option.type) {
        case 'checkbox':
          const checkboxLabel = option.label || '';
          const checkboxPrice = option.price || 0;
          const checkboxDescription = option.description || '';

          return (
            <View key={`${category.id}-${option.id}`} style={styles.optionContainer}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, currentValue && styles.checkboxActive]}
                  onPress={() => handlePreferenceChange(category.id, option.id, !currentValue)}
                >
                  {currentValue && <Check size={14} color="#0a0e27" strokeWidth={3} />}
                </TouchableOpacity>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{checkboxLabel}</Text>
                  {checkboxPrice > 0 && (
                    <Text style={styles.optionPrice}>+₹{checkboxPrice}</Text>
                  )}
                  {checkboxDescription.length > 0 && (
                    <Text style={styles.optionDescription}>{checkboxDescription}</Text>
                  )}
                </View>
              </View>
            </View>
          );

        case 'select':
          const selectLabel = option.label || '';
          const selectPrice = option.price || 0;
          const selectDescription = option.description || '';

          return (
            <View key={`${category.id}-${option.id}`} style={styles.optionContainer}>
              <Text style={styles.optionLabel}>
                {selectLabel}
                {option.required && <Text style={styles.required}> *</Text>}
                {selectPrice > 0 && (
                  <Text style={styles.optionPrice}> +₹{selectPrice}</Text>
                )}
              </Text>
              {selectDescription.length > 0 && (
                <Text style={styles.optionDescription}>{selectDescription}</Text>
              )}
              <View style={styles.selectContainer}>
                <Text style={styles.selectValue}>
                  {currentValue || 'Select an option'}
                </Text>
                <ChevronDown size={16} color="rgba(255, 255, 255, 0.6)" />
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
                      {opt || ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );

        case 'multiselect':
          const multiselectLabel = option.label || '';
          const multiselectPrice = option.price || 0;
          const multiselectDescription = option.description || '';

          return (
            <View key={`${category.id}-${option.id}`} style={styles.optionContainer}>
              <Text style={styles.optionLabel}>
                {multiselectLabel}
                {option.required && <Text style={styles.required}> *</Text>}
                {multiselectPrice > 0 && (
                  <Text style={styles.optionPrice}> +₹{multiselectPrice}</Text>
                )}
              </Text>
              {multiselectDescription.length > 0 && (
                <Text style={styles.optionDescription}>{multiselectDescription}</Text>
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
                        {opt || ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );

        case 'number':
          const numberLabel = option.label || '';
          const numberPrice = option.price || 0;
          const numberDescription = option.description || '';

          return (
            <View key={`${category.id}-${option.id}`} style={styles.optionContainer}>
              <Text style={styles.optionLabel}>
                {numberLabel}
                {option.required && <Text style={styles.required}> *</Text>}
                {numberPrice > 0 && (
                  <Text style={styles.optionPrice}> +₹{numberPrice}</Text>
                )}
              </Text>
              {numberDescription.length > 0 && (
                <Text style={styles.optionDescription}>{numberDescription}</Text>
              )}
              <TextInput
                style={styles.numberInput}
                value={currentValue ? currentValue.toString() : '0'}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  handlePreferenceChange(category.id, option.id, num);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
          );

        case 'text':
          const textLabel = option.label || '';
          const textPrice = option.price || 0;
          const textDescription = option.description || '';

          return (
            <View key={`${category.id}-${option.id}`} style={styles.optionContainer}>
              <Text style={styles.optionLabel}>
                {textLabel}
                {option.required && <Text style={styles.required}> *</Text>}
                {textPrice > 0 && (
                  <Text style={styles.optionPrice}> +₹{textPrice}</Text>
                )}
              </Text>
              {textDescription.length > 0 && (
                <Text style={styles.optionDescription}>{textDescription}</Text>
              )}
              <TextInput
                style={styles.textInput}
                value={currentValue || ''}
                onChangeText={(text) => handlePreferenceChange(category.id, option.id, text)}
                placeholder="Enter text..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline={true}
                numberOfLines={3}
              />
            </View>
          );

        default:
          return null;
      }
    } catch (error) {
      console.error('Error rendering option:', error, option);
      return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  if (!travelerType || !travelerType.preferenceCategories || travelerType.preferenceCategories.length === 0) {
    console.log('DynamicPreferences: No traveler type or categories found');
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No preferences available for this traveler type.</Text>
      </View>
    );
  }

  // Debug log to help identify data issues
  console.log('DynamicPreferences: Rendering with traveler type:', travelerType.title);
  console.log('DynamicPreferences: Categories count:', travelerType.preferenceCategories.length);

  // Define color styles based on theme instead of mapping
  const containerStyle = {
    backgroundColor: 'rgba(0, 217, 255, 0.05)',
    borderColor: '#00D9FF',
    borderWidth: 1,
  };

  const titleColor = '#FFF';

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: titleColor }]}>
          {travelerType.title || ''} Preferences
        </Text>
        <Text style={styles.subtitle}>Customize your stay experience</Text>
      </View>

      <View style={styles.content}>
        {travelerType.preferenceCategories?.filter(category => category && category.id).map((category) => {
          const isExpanded = expandedCategories.has(category.id);

          return (
            <View key={category.id} style={styles.categoryContainer}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeaderContent}>
                  <Text style={styles.categoryName}>{category.name || ''}</Text>
                  {category.description && (
                    <Text style={styles.categoryDescription}>{category.description || ''}</Text>
                  )}
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color="rgba(255, 255, 255, 0.6)" />
                ) : (
                  <ChevronDown size={20} color="rgba(255, 255, 255, 0.6)" />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.categoryContent}>
                  {category.options?.filter(option => option && option.id).map((option) => renderOption(category, option))}
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
    backgroundColor: '#1a1f3a',
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
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    paddingBottom: 8,
  },
  categoryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryContent: {
    padding: 16,
    paddingTop: 0,
    marginTop: 16,
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  optionPrice: {
    fontSize: 12,
    color: '#00D9FF',
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  required: {
    color: '#EF4444',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  selectValue: {
    fontSize: 14,
    color: '#FFF',
  },
  selectOptions: {
    marginTop: 8,
    gap: 4,
  },
  selectOption: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  selectOptionActive: {
    backgroundColor: '#00D9FF',
  },
  selectOptionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  selectOptionTextActive: {
    color: '#0a0e27',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  multiselectChipActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  multiselectChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  multiselectChipTextActive: {
    color: '#0a0e27',
    fontWeight: '600',
  },
  numberInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFF',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFF',
    marginTop: 8,
    textAlignVertical: 'top',
    minHeight: 80,
  },
});