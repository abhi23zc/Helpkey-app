import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import {
  User,
  Phone,
  Shield,
  CheckCircle,
  Users,
  LogOut,
  ChevronRight,
  MessageSquare,
  Settings,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Reusable Menu Item Component
const ProfileMenuItem = ({
  icon: Icon,
  color,
  label,
  value,
  onPress,
  showChevron = true,
  isDestructive = false,
  badge
}: {
  icon: any,
  color: string,
  label: string,
  value?: string,
  onPress?: () => void,
  showChevron?: boolean,
  isDestructive?: boolean,
  badge?: React.ReactNode
}) => (
  <TouchableOpacity
    style={[styles.menuItem, isDestructive && styles.menuItemDestructive]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#FEE2E2' : `${color}15` }]}>
      <Icon size={20} color={isDestructive ? '#EF4444' : color} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, isDestructive && styles.textDestructive]}>{label}</Text>
      {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
    </View>
    {badge}
    {showChevron && <ChevronRight size={18} color="#C7C7CC" />}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function Profile() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to end your session?',
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

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.headerContentCenter}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.notLoggedInContent}>
          <View style={styles.iconCircleLarge}>
            <User size={40} color="#6366F1" />
          </View>
          <Text style={styles.subtitle}>Log in to manage your bookings and profile</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']} // Deep Indigo to Violet
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proHeader}
        >
          <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
            <View style={styles.topBar}>
              <Text style={styles.headerTitleLight}>Profile</Text>
              <TouchableOpacity style={styles.headerIconBtn}>
                <Settings size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600 }}
              style={styles.profileCard}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Shield size={12} color="#FFF" />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userData?.fullName || 'User'}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                <View style={styles.roleContainer}>
                  <Text style={styles.roleText}>{userData?.role || 'Guest'}</Text>
                </View>
              </View>
            </MotiView>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.mainContent}>

          {/* Quick Actions / Status */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100, type: 'timing', duration: 500 }}
            style={styles.sectionContainer}
          >
            <TouchableOpacity
              style={[
                styles.statusCard,
                userData?.aadhaarData?.verified ? styles.statusVerified : styles.statusPending
              ]}
              onPress={() => router.push('/profile/verification' as any)}
            >
              <View style={styles.statusIcon}>
                {userData?.aadhaarData?.verified ? (
                  <CheckCircle size={24} color="#059669" />
                ) : (
                  <Shield size={24} color="#D97706" />
                )}
              </View>
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {userData?.aadhaarData?.verified ? 'Identity Verified' : 'Verify Identity'}
                </Text>
                <Text style={styles.statusDesc}>
                  {userData?.aadhaarData?.verified ? 'Pre-checkin enabled' : 'Complete verification for faster check-ins'}
                </Text>
              </View>
              <ChevronRight size={20} color={userData?.aadhaarData?.verified ? "#059669" : "#D97706"} />
            </TouchableOpacity>
          </MotiView>

          {/* Account Details */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200, type: 'timing', duration: 500 }}
          >
            <SectionHeader title="Account Information" />
            <View style={styles.menuGroup}>
              <ProfileMenuItem
                icon={Phone}
                color="#6366F1"
                label="Phone Number"
                value={userData?.phoneNumber || 'N/A'}
                showChevron={false}
              />
              <View style={styles.divider} />
              <ProfileMenuItem
                icon={Users}
                color="#EC4899"
                label="Saved Guests"
                value="Manage family & friends"
                onPress={() => router.push('/profile/saved-guests' as any)}
              />
            </View>
          </MotiView>

          {/* Admin / Dev Tools */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, type: 'timing', duration: 500 }}
          >
            <SectionHeader title="Settings & Support" />
            <View style={styles.menuGroup}>
              <ProfileMenuItem
                icon={MessageSquare}
                color="#8B5CF6"
                label="WhatsApp Notifications"
                value="Manage alerts"
                onPress={() => router.push('/admin/notifications' as any)}
              />
            </View>
          </MotiView>

          {/* Logout */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400, type: 'timing', duration: 500 }}
            style={{ marginBottom: 40, marginTop: 24 }}
          >
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Version 1.0.0 • HelpKey</Text>
          </MotiView>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background for contrast
  },
  headerGradient: {
    height: 300,
    width: '100%',
    paddingBottom: 40,
  },
  proHeader: {
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: -40, // Pulls the content up
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  safeAreaHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  headerTitleLight: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#059669',
    borderRadius: 10,
    padding: 2,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  roleContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    zIndex: 2,
  },
  sectionContainer: {
    marginBottom: 0,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusVerified: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  statusIcon: {
    marginRight: 14,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGroup: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemDestructive: {
    // Style for destructive items if needed
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  textDestructive: {
    color: '#EF4444',
  },
  menuValue: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 66, // Align with text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 20,
  },
  notLoggedInContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
    padding: 24,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});