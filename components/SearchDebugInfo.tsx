import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getRecommendedHotels, searchHotelsByLocation, clearHotelsCache, getCacheStats } from '../services/simpleSearchService';

export default function SearchDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testRecommendations = async () => {
    setLoading(true);
    setDebugInfo('Testing recommendations...\n');
    
    try {
      const hotels = await getRecommendedHotels(5);
      setDebugInfo(prev => prev + `✅ Found ${hotels.length} recommended hotels\n`);
      
      if (hotels.length > 0) {
        setDebugInfo(prev => prev + `First hotel: ${hotels[0].name} - ₹${hotels[0].price}\n`);
        setDebugInfo(prev => prev + `Location: ${hotels[0].location}\n`);
        setDebugInfo(prev => prev + `Rooms: ${hotels[0].rooms.length}\n`);
      }
    } catch (error) {
      setDebugInfo(prev => prev + `❌ Error: ${error}\n`);
    }
    
    setLoading(false);
  };

  const testLocationSearch = async () => {
    setLoading(true);
    setDebugInfo('Testing location search for Kanpur...\n');
    
    try {
      const startTime = Date.now();
      // Kanpur coordinates
      const hotels = await searchHotelsByLocation(26.4499, 80.3319, 50);
      const endTime = Date.now();
      
      setDebugInfo(prev => prev + `✅ Found ${hotels.length} hotels near Kanpur (${endTime - startTime}ms)\n`);
      
      if (hotels.length > 0) {
        hotels.forEach((hotel, index) => {
          setDebugInfo(prev => prev + `${index + 1}. ${hotel.name} - ₹${hotel.price} (${hotel.distance?.toFixed(1) || 'N/A'} km)\n`);
          setDebugInfo(prev => prev + `   Image: ${hotel.image.includes('fm=jpg') ? '✅ JPG' : '❌ Not JPG'}\n`);
        });
      }
    } catch (error) {
      setDebugInfo(prev => prev + `❌ Error: ${error}\n`);
    }
    
    setLoading(false);
  };

  const testCache = async () => {
    setLoading(true);
    setDebugInfo('Testing cache functionality...\n');
    
    try {
      // Get cache stats
      const stats = await getCacheStats();
      setDebugInfo(prev => prev + `📊 Cache Stats: ${stats.totalCacheEntries} entries (Hotels: ${stats.hotelsCacheSize}, Location: ${stats.locationCacheSize})\n`);
      
      // Test first call (should hit Firebase)
      setDebugInfo(prev => prev + '🔄 First call (should hit Firebase)...\n');
      const start1 = Date.now();
      const hotels1 = await getRecommendedHotels(3);
      const end1 = Date.now();
      setDebugInfo(prev => prev + `⏱️ First call: ${end1 - start1}ms, ${hotels1.length} hotels\n`);
      
      // Test second call (should hit cache)
      setDebugInfo(prev => prev + '🔄 Second call (should hit cache)...\n');
      const start2 = Date.now();
      const hotels2 = await getRecommendedHotels(3);
      const end2 = Date.now();
      setDebugInfo(prev => prev + `⚡ Second call: ${end2 - start2}ms, ${hotels2.length} hotels\n`);
      
      const speedImprovement = ((end1 - start1) / (end2 - start2)).toFixed(1);
      setDebugInfo(prev => prev + `🚀 Speed improvement: ${speedImprovement}x faster\n`);
      
    } catch (error) {
      setDebugInfo(prev => prev + `❌ Error: ${error}\n`);
    }
    
    setLoading(false);
  };

  const clearCacheTest = async () => {
    setLoading(true);
    setDebugInfo('Clearing cache...\n');
    
    try {
      await clearHotelsCache();
      const stats = await getCacheStats();
      setDebugInfo(prev => prev + `🗑️ Cache cleared. Remaining entries: ${stats.totalCacheEntries}\n`);
    } catch (error) {
      setDebugInfo(prev => prev + `❌ Error: ${error}\n`);
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Debug Info</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={testRecommendations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Recommendations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testLocationSearch}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Kanpur Search</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cacheButton]} 
          onPress={testCache}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Cache Speed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearCacheTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.debugContainer}>
        <Text style={styles.debugText}>{debugInfo || 'Click a button to test search functionality'}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#00BCD4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  debugContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  cacheButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#FF5722',
  },
});