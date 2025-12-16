import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
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
  HelpCircle,
  Bell,
  CreditCard,
  FileText,
  Lock
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Reusable Menu Item Component
const ProfileMenuItem = ({
  icon: Icon,
  label,
  value,
  onPress,
  showChevron = true,
  isDestructive = false,
  badge
}: {
  icon: any,
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
    <View style={[
      styles.iconContainer,
      isDestructive ? { backgroundColor: '#FEF2F2' } : { backgroundColor: '#EFF6FF' }
    ]}>
      <Icon
        size={20}
        color={isDestructive ? '#EF4444' : '#2563EB'}
        strokeWidth={1.5}
      />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, isDestructive && styles.textDestructive]}>{label}</Text>
      {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
    </View>
    {badge}
    {showChevron && <ChevronRight size={16} color="#9CA3AF" />}
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

  // ---------------------------------------------------------------------------
  // LOGGED OUT STATE
  // ---------------------------------------------------------------------------
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitleDark}>Profile</Text>
          </View>

          <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 500 } as any}
              style={styles.authCard}
            >
              <View style={styles.iconCircleLarge}>
                <User size={40} color="#111827" strokeWidth={1.5} />
              </View>
              <Text style={styles.authTitle}>Welcome to HelpKey</Text>
              <Text style={styles.authSubtitle}>
                Log in to manage your bookings, save your favorite hotels, and get exclusive offers.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/auth/login')}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Login or Sign Up</Text>
              </TouchableOpacity>
            </MotiView>

            {/* Support Options for Unauthenticated Users */}
            <View style={styles.supportSection}>
              <Text style={styles.sectionHeader}>Support</Text>
              <View style={styles.menuGroup}>
                <ProfileMenuItem
                  icon={HelpCircle}
                  label="Help Center"
                  onPress={() => { }}
                />
                <View style={styles.divider} />
                <ProfileMenuItem
                  icon={FileText}
                  label="Terms of Service"
                  onPress={() => { }}
                />
                <View style={styles.divider} />
                <ProfileMenuItem
                  icon={Lock}
                  label="Privacy Policy"
                  onPress={() => { }}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // LOGGED IN STATE
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Dark Header Section */}
      <View style={styles.headerBackgroundContainer}>
        <LinearGradient
          colors={['#1e3a8a', '#2563EB']} // Deep Blue to Bright Blue
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeContent}>
            <View style={styles.topBar}>
              <Text style={styles.headerTitleLight}>Profile</Text>
              <TouchableOpacity style={styles.iconButtonDark}>
                <Bell size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 } as any}
              style={styles.userInfoContainer}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Shield size={10} color="#FFF" />
                </View>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{userData?.fullName || 'User'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userRoleTag}>
                  <Text style={styles.userRoleText}>{userData?.role || 'Guest'}</Text>
                </View>
              </View>
            </MotiView>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Verification Status */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100, type: 'timing', duration: 500 } as any}
          style={styles.section}
        >
          <TouchableOpacity
            style={[
              styles.statusCard,
              userData?.aadhaarData?.verified ? styles.statusVerified : styles.statusPending
            ]}
            onPress={() => router.push('/profile/verification' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.statusIcon}>
              {userData?.aadhaarData?.verified ? (
                <CheckCircle size={24} color="#059669" />
              ) : (
                <Shield size={24} color="#D97706" />
              )}
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {userData?.aadhaarData?.verified ? 'Identity Verified' : 'Verify Identity'}
              </Text>
              <Text style={styles.statusDesc}>
                {userData?.aadhaarData?.verified ? 'You are all set for instant check-ins' : 'Complete verification for faster check-ins'}
              </Text>
            </View>
            <ChevronRight size={18} color={userData?.aadhaarData?.verified ? "#059669" : "#D97706"} />
          </TouchableOpacity>
        </MotiView>

        {/* Account Settings */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, type: 'timing', duration: 500 } as any}
          style={styles.section}
        >
          <SectionHeader title="Account" />
          <View style={styles.menuGroup}>
            <ProfileMenuItem
              icon={User}
              label="Personal Information"
              onPress={() => { }}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon={Phone}
              label="Phone Number"
              value={userData?.phoneNumber || 'Add Phone'}
              onPress={() => { }}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon={Users}
              label="Saved Guests"
              value="Family & Friends"
              onPress={() => router.push('/profile/saved-guests' as any)}
            />
          </View>
        </MotiView>

        {/* Payment & Billing */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300, type: 'timing', duration: 500 } as any}
          style={styles.section}
        >
          <SectionHeader title="Billing" />
          <View style={styles.menuGroup}>
            <ProfileMenuItem
              icon={CreditCard}
              label="Payment Methods"
              onPress={() => { }}
            />
          </View>
        </MotiView>

        {/* Preferences & Support */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400, type: 'timing', duration: 500 } as any}
          style={styles.section}
        >
          <SectionHeader title="Preferences" />
          <View style={styles.menuGroup}>
            <ProfileMenuItem
              icon={MessageSquare}
              label="Notifications"
              value="WhatsApp, Email"
              onPress={() => router.push('/admin/notifications' as any)}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon={Settings}
              label="App Settings"
              onPress={() => { }}
            />
          </View>
        </MotiView>

        {/* Logout */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 500, type: 'timing', duration: 500 } as any}
          style={[styles.section, { marginBottom: 40 }]}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Version 1.0.0 • HelpKey</Text>
        </MotiView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },

  // Headers
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  headerTitleDark: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },

  // Auth Card (Logged Out)
  centerContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  authCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 40,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e3a8a', // Deep Blue
    marginBottom: 12,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#2563EB', // Bright Blue
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  supportSection: {
    marginTop: 0,
  },

  // Logged In Styles
  headerBackgroundContainer: {
    backgroundColor: '#1e3a8a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingBottom: 24,
  },
  headerSafeContent: {
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  headerTitleLight: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  iconButtonDark: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#059669',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  userRoleTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  userRoleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Menu Groups
  menuGroup: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
  },
  menuItemDestructive: {
    backgroundColor: '#FFF',
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
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  menuValue: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  textDestructive: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 66,
  },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Logout
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
  },
});