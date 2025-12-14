import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface DealCardProps {
  type: string;
  title: string;
  subtitle: string;
  image: string;
  dark?: boolean;
}

const DealCard = ({ type, title, subtitle, image, dark = false }: DealCardProps) => (
  <TouchableOpacity style={styles.dealCard} activeOpacity={0.9}>
    <Image source={{ uri: image }} contentFit="cover" transition={200} style={styles.dealImage} />
    <LinearGradient
      colors={
        dark
          ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
          : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']
      }
      style={styles.dealOverlay}
    >
      <View style={styles.dealBadge}>
        <Text style={styles.dealBadgeText}>{type}</Text>
      </View>
      <View style={styles.dealContent}>
        <Text style={styles.dealTitle}>{title}</Text>
        <Text style={styles.dealSubtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  dealCard: {
    width: width * 0.7,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 4,
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  dealOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  dealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dealBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  dealContent: {
    gap: 4,
  },
  dealTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  dealSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
});

export default DealCard;
