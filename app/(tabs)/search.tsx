import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Search() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Search and discover amazing places</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});