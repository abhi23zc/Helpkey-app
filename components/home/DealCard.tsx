import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DealCardProps {
  type: string;
  title: string;
  subtitle: string;
  image: string;
  dark?: boolean;
}

const DealCard = ({ type, title, subtitle, image, dark = false }: DealCardProps) => (
  <TouchableOpacity style={styles.dealCard} activeOpacity={0.85}>
    <Image source={{ uri: image }} contentFit="cover" transition={300} style={styles.dealImage} />
    <LinearGradient
      colors={
        dark
          ? ['rgba(10, 14, 39, 0.4)', 'rgba(10, 14, 39, 0.95)']
          : ['rgba(10, 14, 39, 0.3)', 'rgba(10, 14, 39, 0.85)']
      }
      style={styles.dealOverlay}
      locations={[0, 1]}
    >
      <View style={styles.dealBadge}>
        <LinearGradient
          colors={['#00D9FF', '#0099FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badgeGradient}
        >
          <Sparkles size={14} color="#fff" />
          <Text style={styles.dealBadgeText}>{type}</Text>
        </LinearGradient>
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
    height: 170,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
    padding: 18,
    justifyContent: 'space-between',
  },
  dealBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dealBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  dealContent: {
    gap: 6,
  },
  dealTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dealSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});

export default DealCard;
