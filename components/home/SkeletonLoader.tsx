import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export const HotelCardSkeleton = () => {
  return (
    <MotiView
      style={styles.hotelCard}
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1000,
        loop: true,
      }}
    >
      <View style={styles.imageContainer}>
        <MotiView
          style={styles.imageSkeleton}
          from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          transition={{
            duration: 1000,
            loop: true,
          }}
        />
      </View>
      <View style={styles.contentContainer}>
        <MotiView
          style={styles.titleSkeleton}
          from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          transition={{
            duration: 1000,
            loop: true,
          }}
        />
        <MotiView
          style={styles.locationSkeleton}
          from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          transition={{
            duration: 1000,
            loop: true,
          }}
        />
        <View style={styles.bottomRow}>
          <MotiView
            style={styles.priceSkeleton}
            from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            transition={{
              duration: 1000,
              loop: true,
            }}
          />
          <MotiView
            style={styles.ratingSkeleton}
            from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            transition={{
              duration: 1000,
              loop: true,
            }}
          />
        </View>
      </View>
    </MotiView>
  );
};



export const HorizontalHotelSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <View style={styles.horizontalContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.horizontalCard}>
          <MotiView
            style={styles.horizontalImage}
            from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            transition={{
              duration: 1000,
              loop: true,
            }}
          />
          <View style={styles.horizontalContent}>
            <MotiView
              style={styles.horizontalTitle}
              from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              transition={{
                duration: 1000,
                loop: true,
              }}
            />
            <MotiView
              style={styles.horizontalLocation}
              from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              transition={{
                duration: 1000,
                loop: true,
              }}
            />
            <MotiView
              style={styles.horizontalPrice}
              from={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              animate={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              transition={{
                duration: 1000,
                loop: true,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  hotelCard: {
    backgroundColor: 'rgba(26, 31, 58, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  imageSkeleton: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    padding: 16,
    gap: 8,
  },
  titleSkeleton: {
    height: 20,
    borderRadius: 6,
    width: '70%',
  },
  locationSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '50%',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceSkeleton: {
    height: 18,
    borderRadius: 6,
    width: '30%',
  },
  ratingSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '25%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  horizontalCard: {
    width: 290,
    backgroundColor: 'rgba(26, 31, 58, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: '100%',
    height: 210,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  horizontalContent: {
    padding: 14,
    gap: 8,
  },
  horizontalTitle: {
    height: 18,
    borderRadius: 6,
    width: '80%',
  },
  horizontalLocation: {
    height: 14,
    borderRadius: 6,
    width: '60%',
  },
  horizontalPrice: {
    height: 16,
    borderRadius: 6,
    width: '40%',
    marginTop: 4,
  },
});