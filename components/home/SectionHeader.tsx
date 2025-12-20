import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAllPress?: () => void;
}

const SectionHeader = ({ title, subtitle, onSeeAllPress }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <View style={styles.titleContainer}>
      <View style={styles.titleRow}>
        <View style={styles.accentLine} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {onSeeAllPress && (
      <TouchableOpacity onPress={onSeeAllPress} style={styles.seeAllButton} activeOpacity={0.7}>
        <Text style={styles.seeAllText}>See all</Text>
        <ChevronRight size={16} color="#00D9FF" />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accentLine: {
    width: 4,
    height: 24,
    backgroundColor: '#00D9FF',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    marginLeft: 14,
    fontWeight: '500',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00D9FF',
  },
});

export default SectionHeader;
