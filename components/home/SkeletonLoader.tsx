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
          from={{ backgroundColor: '#E5E7EB' }}
          animate={{ backgroundColor: '#F3F4F6' }}
          transition={{
            duration: 1000,
            loop: true,
          }}
        />
      </View>
      <View style={styles.contentContainer}>
        <MotiView
          style={styles.titleSkeleton}
          from={{ backgroundColor: '#E5E7EB' }}
          animate={{ backgroundColor: '#F3F4F6' }}
          transition={{
            duration: 1000,
            loop: true,
          }}
        />
        <MotiView
          style={styles.locationSkeleton}
          from={{ backgroundColor: '#E5E7EB' }}
          animate={{ backgroundColor: '#F3F4F6' }}
          transition={{
            duration: 1000,
            loop: true,
          }}
        />
        <View style={styles.bottomRow}>
          <MotiView
            style={styles.priceSkeleton}
            from={{ backgroundColor: '#E5E7EB' }}
            animate={{ backgroundColor: '#F3F4F6' }}
            transition={{
              duration: 1000,
              loop: true,
            }}
          />
          <MotiView
            style={styles.ratingSkeleton}
            from={{ backgroundColor: '#E5E7EB' }}
            animate={{ backgroundColor: '#F3F4F6' }}
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
            from={{ backgroundColor: '#E5E7EB' }}
            animate={{ backgroundColor: '#F3F4F6' }}
            transition={{
              duration: 1000,
              loop: true,
            }}
          />
          <View style={styles.horizontalContent}>
            <MotiView
              style={styles.horizontalTitle}
              from={{ backgroundColor: '#E5E7EB' }}
              animate={{ backgroundColor: '#F3F4F6' }}
              transition={{
                duration: 1000,
                loop: true,
              }}
            />
            <MotiView
              style={styles.horizontalLocation}
              from={{ backgroundColor: '#E5E7EB' }}
              animate={{ backgroundColor: '#F3F4F6' }}
              transition={{
                duration: 1000,
                loop: true,
              }}
            />
            <MotiView
              style={styles.horizontalPrice}
              from={{ backgroundColor: '#E5E7EB' }}
              animate={{ backgroundColor: '#F3F4F6' }}
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
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  imageSkeleton: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  contentContainer: {
    padding: 16,
    gap: 8,
  },
  titleSkeleton: {
    height: 20,
    borderRadius: 4,
    width: '70%',
  },
  locationSkeleton: {
    height: 16,
    borderRadius: 4,
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
    borderRadius: 4,
    width: '30%',
  },
  ratingSkeleton: {
    height: 16,
    borderRadius: 4,
    width: '25%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  horizontalCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  horizontalContent: {
    padding: 12,
    gap: 6,
  },
  horizontalTitle: {
    height: 18,
    borderRadius: 4,
    width: '80%',
  },
  horizontalLocation: {
    height: 14,
    borderRadius: 4,
    width: '60%',
  },
  horizontalPrice: {
    height: 16,
    borderRadius: 4,
    width: '40%',
    marginTop: 4,
  },
});