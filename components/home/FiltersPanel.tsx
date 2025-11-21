import Slider from '@react-native-community/slider';
import { Check, ChevronDown, Star, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

interface FiltersPanelProps {
  visible: boolean;
  onClose: () => void;
  priceRange: [number, number];
  maxPriceRange: number;
  onPriceRangeChange: (range: [number, number]) => void;
  selectedStars: number[];
  onStarToggle: (star: number) => void;
  selectedAmenities: string[];
  onAmenityToggle: (amenity: string) => void;
  amenities: string[];
  onClearFilters: () => void;
  selectedPropertyTypes: string[];
  onPropertyTypeToggle: (type: string) => void;
  onApply: () => void;
}

const PROPERTY_TYPES = ['Hotel', 'Villa', 'Apartment', 'Resort'];

const FiltersPanel = ({
  visible,
  onClose,
  priceRange,
  maxPriceRange,
  onPriceRangeChange,
  selectedStars,
  onStarToggle,
  selectedAmenities,
  onAmenityToggle,
  amenities,
  onClearFilters,
  selectedPropertyTypes,
  onPropertyTypeToggle,
  onApply,
}: FiltersPanelProps) => {
  // Local state for price inputs to avoid jitter
  const [minPriceInput, setMinPriceInput] = useState(priceRange[0].toString());
  const [maxPriceInput, setMaxPriceInput] = useState(priceRange[1].toString());

  useEffect(() => {
    setMinPriceInput(priceRange[0].toString());
    setMaxPriceInput(priceRange[1].toString());
  }, [priceRange]);

  const handleMinPriceChange = (text: string) => {
    setMinPriceInput(text);
    const val = parseInt(text, 10);
    if (!isNaN(val)) {
      onPriceRangeChange([val, priceRange[1]]);
    }
  };

  const handleMaxPriceChange = (text: string) => {
    setMaxPriceInput(text);
    const val = parseInt(text, 10);
    if (!isNaN(val)) {
      onPriceRangeChange([priceRange[0], val]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Ratings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ratings</Text>
              <View style={styles.ratingsContainer}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const isSelected = selectedStars.includes(star);
                  return (
                    <TouchableOpacity
                      key={star}
                      style={[styles.ratingChip, isSelected && styles.ratingChipActive]}
                      onPress={() => onStarToggle(star)}
                    >
                      <Star
                        size={16}
                        color={isSelected ? '#00BFA5' : '#FFD700'}
                        fill={isSelected ? '#00BFA5' : '#FFD700'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.ratingText, isSelected && styles.ratingTextActive]}>
                        {star}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Price */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={maxPriceRange}
                  step={100}
                  value={priceRange[1]}
                  onValueChange={(val) => onPriceRangeChange([priceRange[0], val])}
                  minimumTrackTintColor="#00BFA5"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#00BFA5"
                />
              </View>
              <View style={styles.priceInputsContainer}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Minimum</Text>
                  <View style={styles.priceInputBox}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={minPriceInput}
                      onChangeText={handleMinPriceChange}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Maximum</Text>
                  <View style={styles.priceInputBox}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={maxPriceInput}
                      onChangeText={handleMaxPriceChange}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Facilities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <View style={styles.facilitiesContainer}>
                {amenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <TouchableOpacity
                      key={amenity}
                      style={styles.checkboxRow}
                      onPress={() => onAmenityToggle(amenity)}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={14} color="#fff" />}
                      </View>
                      <Text style={styles.checkboxLabel}>{amenity}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.seeMoreButton}>
                <Text style={styles.seeMoreText}>See more</Text>
                <ChevronDown size={16} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Property Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property Type</Text>
              <View style={styles.propertyTypeContainer}>
                {PROPERTY_TYPES.map((type) => {
                  const isSelected = selectedPropertyTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.propertyChip, isSelected && styles.propertyChipActive]}
                      onPress={() => onPropertyTypeToggle(type)}
                    >
                      <Text
                        style={[
                          styles.propertyChipText,
                          isSelected && styles.propertyChipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={onApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  ratingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  ratingChipActive: {
    borderColor: '#00BFA5',
    backgroundColor: '#E0F2F1',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ratingTextActive: {
    color: '#00BFA5',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  priceInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
    fontWeight: '500',
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#333',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#00BFA5',
    borderColor: '#00BFA5',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginRight: 4,
  },
  propertyTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  propertyChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  propertyChipActive: {
    borderColor: '#00BFA5',
    backgroundColor: '#fff',
  },
  propertyChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  propertyChipTextActive: {
    color: '#00BFA5',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  applyButton: {
    backgroundColor: '#00BFA5',
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FiltersPanel;
