import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DestinationItemProps {
  id: string;
  name: string;
  image: string;
  onPress?: () => void;
}

const DestinationItem = ({ name, image, onPress }: DestinationItemProps) => (
  <TouchableOpacity style={styles.destinationItem} onPress={onPress}>
    <Image source={{ uri: image }} contentFit="cover" transition={200} style={styles.destinationImage} />
    <Text style={styles.destinationName}>{name}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  destinationItem: {
    alignItems: 'center',
    marginRight: 4,
  },
  destinationImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  destinationName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
});

export default DestinationItem;
