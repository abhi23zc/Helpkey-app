import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { adminService } from '@/services/adminService';
import { Ionicons } from '@expo/vector-icons';

export default function AdminTest() {
  const { user, userData } = useAuth();
  const { isAdmin, stats, loading, fetchStats, getAdminUrl } = useAdmin();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTests = async () => {
    setTestResults([]);
    addTestResult('Starting admin integration tests...');

    // Test 1: Authentication
    addTestResult(`User authenticated: ${!!user}`);
    addTestResult(`User role: ${userData?.role || 'none'}`);
    addTestResult(`Has admin access: ${isAdmin}`);

    // Test 2: Configuration
    addTestResult(`Admin base URL: ${getAdminUrl('dashboard')}`);

    // Test 3: API Service
    try {
      const response = await adminService.validateAdminAccess();
      addTestResult(`API validation: ${response.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      addTestResult(`API validation: ERROR - ${error}`);
    }

    // Test 4: Stats
    try {
      await fetchStats();
      addTestResult(`Stats fetch: SUCCESS`);
      addTestResult(`Total bookings: ${stats.totalBookings}`);
    } catch (error) {
      addTestResult(`Stats fetch: ERROR - ${error}`);
    }

    addTestResult('Tests completed!');
  };

  const testWebViewNavigation = () => {
    Alert.alert(
      'WebView Test',
      'Choose a WebView page to test:',
      [
        { text: 'Dashboard', onPress: () => router.push('/admin/dashboard') },
        { text: 'Bookings', onPress: () => router.push('/admin/bookings') },
        { text: 'Hotels', onPress: () => router.push('/admin/hotels') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Integration Test</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Email: {user?.email || 'Not logged in'}</Text>
            <Text style={styles.infoText}>Name: {userData?.fullName || 'N/A'}</Text>
            <Text style={styles.infoText}>Role: {userData?.role || 'N/A'}</Text>
            <Text style={styles.infoText}>Admin Access: {isAdmin ? '✅ Yes' : '❌ No'}</Text>
          </View>
        </View>

        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={runTests}
              disabled={loading}
            >
              <Ionicons name="play-circle" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>
                {loading ? 'Running Tests...' : 'Run Integration Tests'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.testButton, styles.secondaryButton]} 
              onPress={testWebViewNavigation}
            >
              <Ionicons name="globe" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Test WebView Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <View style={styles.resultsContainer}>
              {testResults.map((result, index) => (
                <Text key={index} style={styles.resultText}>
                  {result}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Stats Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.todayBookings}</Text>
              <Text style={styles.statLabel}>Today's Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{stats.revenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendingBookings}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#8b5cf6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});