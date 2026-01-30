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
import { Image } from 'expo-image';
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
  Lock,
  UserCheck
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
      isDestructive ? { backgroundColor: 'rgba(239, 68, 68, 0.1)' } : { backgroundColor: 'rgba(0, 217, 255, 0.1)' }
    ]}>
      <Icon
        size={20}
        color={isDestructive ? '#EF4444' : '#00D9FF'}
        strokeWidth={1.5}
      />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, isDestructive && styles.textDestructive]}>{label}</Text>
      {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
    </View>
    {badge}
    {showChevron && <ChevronRight size={16} color="rgba(255, 255, 255, 0.6)" />}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function Profile() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitleLight}>Profile</Text>
          </View>

          <ScrollView contentContainerStyle={[styles.centerContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 500 } as any}
              style={styles.authCard}
            >
              <View style={styles.iconCircleLarge}>
                <User size={40} color="#00D9FF" strokeWidth={1.5} />
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
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />

      {/* Dark Header Section */}
      <View style={styles.headerBackgroundContainer}>
        {/* Using a subtle dark gradient for the header background */}
        <LinearGradient
          colors={['#0a0e27', '#1a1f3a']}
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
                {userData?.photoURL ? (
                  <Image
                    source={{ uri: userData.photoURL }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={300}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {userData?.fullName ? userData.fullName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                {userData?.aadhaarData?.verified && (
                  <View style={styles.verifiedBadge}>
                    <Shield size={10} color="#0a0e27" fill="#059669" />
                  </View>
                )}
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
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
                <Shield size={24} color="#FBBF24" />
              )}
            </View>
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: userData?.aadhaarData?.verified ? '#059669' : '#FBBF24' }]}>
                {userData?.aadhaarData?.verified ? 'Identity Verified' : 'Verify Identity'}
              </Text>
              <Text style={[styles.statusDesc, { color: userData?.aadhaarData?.verified ? 'rgba(5, 150, 105, 0.8)' : 'rgba(251, 191, 36, 0.8)' }]}>
                {userData?.aadhaarData?.verified ? 'You are all set for instant check-ins' : 'Complete verification for faster check-ins'}
              </Text>
            </View>
            <ChevronRight size={18} color={userData?.aadhaarData?.verified ? "#059669" : "#FBBF24"} />
          </TouchableOpacity>
        </MotiView>

        {/* Admin Section - Only show for admin users */}
        {(userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.role === 'hotel_admin') && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150, type: 'timing', duration: 500 } as any}
            style={styles.section}
          >
            <SectionHeader title="Admin" />
            <View style={styles.menuGroup}>
              <ProfileMenuItem
                icon={UserCheck}
                label="Admin Dashboard"
                value="Manage bookings & hotels"
                onPress={() => router.push('/admin' as any)}
              />
            </View>
          </MotiView>
        )}

        {/* Account Settings */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: (userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.role === 'hotel_admin') ? 250 : 200, type: 'timing', duration: 500 } as any}
          style={styles.section}
        >
          <SectionHeader title="Account" />
          <View style={styles.menuGroup}>
            <ProfileMenuItem
              icon={User}
              label="Personal Information"
              onPress={() => router.push('/profile/personal-info' as any)}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon={Phone}
              label="Phone Number"
              value={userData?.phoneNumber ? `+91 ${userData.phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2')}` : 'Add Phone'}
              onPress={() => router.push('/profile/phone-number' as any)}
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
          transition={{ delay: (userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.role === 'hotel_admin') ? 350 : 300, type: 'timing', duration: 500 } as any}
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
          transition={{ delay: (userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.role === 'hotel_admin') ? 450 : 400, type: 'timing', duration: 500 } as any}
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
          transition={{ delay: (userData?.role === 'admin' || userData?.role === 'super-admin' || userData?.role === 'hotel_admin') ? 550 : 500, type: 'timing', duration: 500 } as any}
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
    backgroundColor: '#0a0e27',
  },
  safeArea: {
    flex: 1,
  },

  // Headers
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#0a0e27',
  },

  // Auth Card (Logged Out) - Updated to dark
  centerContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  authCard: {
    backgroundColor: '#1a1f3a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 40,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#00D9FF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: '700',
  },
  supportSection: {
    marginTop: 0,
  },

  // Logged In Styles
  headerBackgroundContainer: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#1a1f3a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 0,
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
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#059669',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1f3a',
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
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  userRoleTag: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  userRoleText: {
    color: '#00D9FF',
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
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Menu Groups
  menuGroup: {
    backgroundColor: '#1a1f3a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1a1f3a',
  },
  menuItemDestructive: {
    backgroundColor: '#1a1f3a',
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
    color: '#FFF',
  },
  menuValue: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  textDestructive: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 66,
  },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f3a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusVerified: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  statusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
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
    color: '#FFF',
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 24,
  },
});