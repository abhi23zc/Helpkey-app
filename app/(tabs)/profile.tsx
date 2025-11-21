import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Profile() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          
          {user ? (
            <View style={styles.userInfo}>
              <View style={styles.infoCard}>
                <Feather name="user" size={20} color="#6366F1" />
                <View style={styles.infoText}>
                  <Text style={styles.label}>Name</Text>
                  <Text style={styles.value}>{userData?.fullName || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Feather name="mail" size={20} color="#6366F1" />
                <View style={styles.infoText}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Feather name="phone" size={20} color="#6366F1" />
                <View style={styles.infoText}>
                  <Text style={styles.label}>Phone</Text>
                  <Text style={styles.value}>{userData?.phoneNumber || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Feather name="shield" size={20} color="#6366F1" />
                <View style={styles.infoText}>
                  <Text style={styles.label}>Role</Text>
                  <Text style={styles.value}>{userData?.role || 'user'}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Feather name="log-out" size={20} color="#FFF" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.notLoggedIn}>
              <Text style={styles.subtitle}>Please login to view your profile</Text>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => router.push('/auth/login')}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          )}
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfo: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  notLoggedIn: {
    alignItems: 'center',
    paddingTop: 40,
  },
  loginButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});