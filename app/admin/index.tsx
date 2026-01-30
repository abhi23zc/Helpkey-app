import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  RefreshControl,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminConfig, hasAdminAccess } from '@/config/admin';
import { collection, getDocs, orderBy, query, where, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const isLargeDevice = SCREEN_WIDTH >= 414;
const isTablet = SCREEN_WIDTH >= 768;
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

interface AdminMenuItem {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  colors: readonly [string, string, ...string[]];
  badge?: number;
}

interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  revenue: number;
  todayBookings: number;
  lastUpdated: Date | null;
}



interface BookingData {
  id: string;
  status: string;
  totalAmount: number;
  createdAt?: any;
  guestName?: string;
  hotelName?: string;
}

export default function AdminIndex() {
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    revenue: 0,
    todayBookings: 0,
    lastUpdated: null,
  });

  const [hotels, setHotels] = useState<any[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const menuItemAnimations = useRef<Animated.Value[]>([]).current;

  // Start entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + index * 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    // Start pulse animation for activity indicator
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };



  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Fetch bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('hotelAdmin', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings: BookingData[] = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BookingData));

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayBookings = bookings.filter(booking => {
        if (!booking.createdAt) return false;
        const bookingDate = booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      }).length;

      const confirmedBookings = bookings.filter(b => b.status?.toLowerCase() === 'confirmed').length;
      const pendingBookings = bookings.filter(b => b.status?.toLowerCase() === 'pending').length;
      const completedBookings = bookings.filter(b => b.status?.toLowerCase() === 'completed').length;

      const revenue = bookings.reduce((sum, b) => {
        const status = b.status?.toLowerCase();
        if (status === 'confirmed' || status === 'completed') {
          return sum + (b.totalAmount || 0);
        }
        return sum;
      }, 0);

      setStats({
        totalBookings: bookings.length,
        confirmedBookings,
        pendingBookings,
        completedBookings,
        revenue,
        todayBookings,
        lastUpdated: new Date(),
      });



      // Fetch hotels count
      const hotelsQuery = query(
        collection(db, 'hotels'),
        where('ownerId', '==', user.uid)
      );
      const hotelsSnapshot = await getDocs(hotelsQuery);
      setHotels(hotelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchDashboardData();
    }
  }, [user?.uid, fetchDashboardData]);

  // Dynamic menu items based on actual data
  const adminMenuItems: AdminMenuItem[] = [
    // {
    //   title: 'Dashboard',
    //   description: 'Overview and analytics',
    //   icon: 'analytics-outline',
    //   route: '/admin/dashboard',
    //   colors: ['#06b6d4', '#3b82f6'] as const,
    // },
    {
      title: 'Bookings',
      description: 'Manage reservations',
      icon: 'calendar-outline',
      route: '/admin/bookings',
      colors: ['#10b981', '#059669'] as const,
      badge: stats.pendingBookings > 0 ? stats.pendingBookings : undefined,
    },
    {
      title: 'Hotels',
      description: "Manage Hotels",
      icon: 'business-outline',
      route: '/admin/hotels',
      colors: ['#8b5cf6', '#7c3aed'] as const,
      badge: hotels.length > 0 ? hotels.length : undefined,
    },
    {
      title: 'Rooms',
      description: 'Room inventory',
      icon: 'bed-outline',
      route: '/admin/rooms',
      colors: ['#f59e0b', '#d97706'] as const,
    },
  ];

  // Initialize menu item animations
  useEffect(() => {
    if (menuItemAnimations.length === 0) {
      adminMenuItems.forEach(() => {
        menuItemAnimations.push(new Animated.Value(0));
      });
    }

    // Animate menu items
    menuItemAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 500 + index * 80,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }).start();
    });
  }, [adminMenuItems.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Check if user has admin access using configuration
  const userHasAdminAccess = () => {
    return hasAdminAccess(userData?.role);
  };



  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (!userHasAdminAccess()) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.accessDeniedContainer}>
          <View style={styles.accessDeniedIconContainer}>
            <Ionicons name="shield-outline" size={isSmallDevice ? 56 : 72} color="#64748b" />
          </View>
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            {AdminConfig.errorMessages.accessDenied}
          </Text>
          <TouchableOpacity
            style={styles.accessDeniedButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#334155', '#475569'] as const}
              style={styles.accessDeniedButtonGradient}
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
              <Text style={styles.accessDeniedButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header with animation */}
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ scale: headerScale }],
        }
      ]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View style={styles.headerBackButtonInner}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>HelpKey Admin</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Welcome, {userData?.fullName || userData?.displayName || 'Admin'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <View style={styles.headerActionInner}>
            <Ionicons name="refresh" size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#06b6d4"
            colors={['#06b6d4']}
          />
        }
      >
        {/* Welcome Card with animation */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          <LinearGradient
            colors={['#1e293b', '#334155', '#1e293b'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeIconContainer}>
              <LinearGradient
                colors={['#06b6d4', '#3b82f6'] as const}
                style={styles.welcomeIconGradient}
              >
                <Ionicons name="shield-checkmark" size={isSmallDevice ? 28 : 36} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.welcomeTitle}>Admin Dashboard</Text>
            <Text style={styles.welcomeText}>
              Manage your hotel business with powerful admin tools
            </Text>

          </LinearGradient>
        </Animated.View>

        {/* Stats Grid with loading state */}
        <View style={styles.statsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionSubtitle}>Your business at a glance</Text>
          </View>

          {loading ? (
            <View style={styles.statsGrid}>
              {[0, 1].map((index) => (
                <View key={index} style={styles.statCard}>
                  <View style={styles.statLoadingContainer}>
                    <ActivityIndicator size="small" color="#06b6d4" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
              {/* Total Bookings */}
              <Animated.View style={[
                styles.statCard,
                isTablet && styles.statCardTablet,
                {
                  opacity: cardAnimations[0],
                  transform: [{
                    translateY: cardAnimations[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                }
              ]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
                    <Ionicons name="calendar-outline" size={isSmallDevice ? 20 : isTablet ? 28 : 24} color="#06b6d4" />
                  </View>
                  {stats.totalBookings > 0 && (
                    <View style={[styles.changeContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <Ionicons name="trending-up" size={isSmallDevice ? 12 : 14} color="#10b981" />
                      <Text style={[styles.changeText, { color: '#10b981' }]}>
                        {stats.confirmedBookings} confirmed
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.statValue, isTablet && styles.statValueTablet]}>{stats.totalBookings}</Text>
                <Text style={[styles.statLabel, isTablet && styles.statLabelTablet]}>Total Bookings</Text>
              </Animated.View>

              {/* Revenue */}
              <Animated.View style={[
                styles.statCard,
                isTablet && styles.statCardTablet,
                {
                  opacity: cardAnimations[1],
                  transform: [{
                    translateY: cardAnimations[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }]
                }
              ]}>
                <View style={styles.statHeader}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="trending-up-outline" size={isSmallDevice ? 20 : isTablet ? 28 : 24} color="#10b981" />
                  </View>
                  {stats.revenue > 0 && (
                    <View style={[styles.changeContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                      <Ionicons name="wallet" size={isSmallDevice ? 12 : 14} color="#10b981" />
                      <Text style={[styles.changeText, { color: '#10b981' }]}>Earned</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.statValue, isTablet && styles.statValueTablet]}>
                  {formatCurrency(stats.revenue)}
                </Text>
                <Text style={[styles.statLabel, isTablet && styles.statLabelTablet]}>Revenue</Text>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Today's Activity with pulse animation */}
        <View style={styles.activitySection}>
          <Animated.View style={{ transform: [{ scale: stats.todayBookings > 0 ? pulseAnim : 1 }] }}>
            <LinearGradient
              colors={['#1e293b', '#334155'] as const}
              style={styles.activityCard}
            >
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>Today's Activity</Text>
                <View style={styles.activityIconWrapper}>
                  <Ionicons name="calendar-outline" size={isSmallDevice ? 20 : 24} color="#06b6d4" />
                  {stats.todayBookings > 0 && (
                    <View style={styles.activityBadge}>
                      <Text style={styles.activityBadgeText}>!</Text>
                    </View>
                  )}
                </View>
              </View>
              {loading ? (
                <ActivityIndicator size="large" color="#06b6d4" style={{ marginVertical: 10 }} />
              ) : (
                <>
                  <Text style={styles.activityValue}>{stats.todayBookings}</Text>
                  <Text style={styles.activityLabel}>
                    {stats.todayBookings === 0
                      ? 'No new bookings today'
                      : `New booking${stats.todayBookings > 1 ? 's' : ''} today`}
                  </Text>
                </>
              )}

              {/* Additional today stats */}
              {!loading && (
                <View style={styles.todayStatsRow}>
                  <View style={styles.todayStatItem}>
                    <View style={[styles.todayStatDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={styles.todayStatText}>{stats.pendingBookings} pending</Text>
                  </View>
                  <View style={styles.todayStatItem}>
                    <View style={[styles.todayStatDot, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.todayStatText}>{stats.confirmedBookings} confirmed</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Quick Actions */}
        <View style={styles.menuContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={[styles.menuGrid, isTablet && isLandscape && styles.menuGridTabletLandscape]}>
            {adminMenuItems.map((item, index) => (
              <Animated.View
                key={index}
                style={[
                  { width: '100%' },
                  menuItemAnimations[index] && {
                    opacity: menuItemAnimations[index],
                    transform: [{
                      translateX: menuItemAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.menuItem, isTablet && isLandscape && styles.menuItemTabletLandscape]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.menuItemGradient, isTablet && styles.menuItemGradientTablet]}
                  >
                    <View style={[styles.menuItemIconContainer, isTablet && styles.menuItemIconContainerTablet]}>
                      <Ionicons name={item.icon} size={isSmallDevice ? 24 : isTablet ? 36 : 32} color="#ffffff" />
                    </View>
                    <View style={styles.menuItemTextContainer}>
                      <View style={styles.menuItemTitleRow}>
                        <Text style={[styles.menuItemTitle, isTablet && styles.menuItemTitleTablet]} numberOfLines={1}>{item.title}</Text>
                        {item.badge !== undefined && item.badge > 0 && (
                          <View style={[styles.badgeContainer, isTablet && styles.badgeContainerTablet]}>
                            <Text style={[styles.badgeText, isTablet && styles.badgeTextTablet]}>{item.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.menuItemDescription, isTablet && styles.menuItemDescriptionTablet]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={[styles.menuItemArrow, isTablet && styles.menuItemArrowTablet]}>
                      <Ionicons name="chevron-forward" size={isTablet ? 22 : 18} color="rgba(255,255,255,0.6)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>


        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 12 : isTablet ? 24 : 16,
    paddingVertical: isSmallDevice ? 12 : isTablet ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: '#0f172a',
    maxWidth: isTablet ? 1200 : undefined,
    alignSelf: isTablet ? 'center' : 'stretch',
    width: isTablet ? '100%' : undefined,
  },
  headerBackButton: {
    marginRight: isSmallDevice ? 8 : 12,
  },
  headerBackButtonInner: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 20 : isTablet ? 28 : isMediumDevice ? 22 : 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '400',
  },
  headerAction: {
    marginLeft: isSmallDevice ? 8 : 12,
  },
  headerActionInner: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: isSmallDevice ? 12 : isTablet ? 24 : 16,
    paddingTop: isSmallDevice ? 16 : isTablet ? 24 : 20,
    maxWidth: isTablet ? 1200 : undefined,
    alignSelf: isTablet ? 'center' : 'stretch',
    width: isTablet ? '100%' : undefined,
  },

  // Welcome Card Styles
  welcomeCard: {
    borderRadius: isSmallDevice ? 16 : isTablet ? 24 : 20,
    padding: isSmallDevice ? 20 : isTablet ? 32 : 24,
    marginBottom: isSmallDevice ? 20 : isTablet ? 32 : 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  welcomeIconContainer: {
    marginBottom: isSmallDevice ? 12 : isTablet ? 20 : 16,
  },
  welcomeIconGradient: {
    width: isSmallDevice ? 56 : isTablet ? 80 : 64,
    height: isSmallDevice ? 56 : isTablet ? 80 : 64,
    borderRadius: isSmallDevice ? 28 : isTablet ? 40 : 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#06b6d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  welcomeTitle: {
    fontSize: isSmallDevice ? 18 : isTablet ? 26 : isMediumDevice ? 20 : 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: isSmallDevice ? 6 : isTablet ? 12 : 8,
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 18 : isTablet ? 22 : 20,
    paddingHorizontal: isSmallDevice ? 8 : isTablet ? 24 : 16,
    fontWeight: '400',
  },


  // Section Header Styles
  sectionHeader: {
    marginBottom: isSmallDevice ? 12 : isTablet ? 20 : 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: isSmallDevice ? 12 : isTablet ? 14 : 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionDivider: {
    height: 2,
    width: isSmallDevice ? 32 : isTablet ? 48 : 40,
    backgroundColor: '#06b6d4',
    borderRadius: 1,
  },
  viewAllText: {
    fontSize: isSmallDevice ? 12 : isTablet ? 14 : 13,
    color: '#06b6d4',
    fontWeight: '600',
  },

  // Stats Container Styles
  statsContainer: {
    marginBottom: isSmallDevice ? 20 : isTablet ? 32 : 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: isSmallDevice ? 10 : isTablet ? 16 : 12,
  },
  statsGridTablet: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: isSmallDevice ? 14 : isTablet ? 20 : 16,
    padding: isSmallDevice ? 14 : isTablet ? 24 : 18,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statCardTablet: {
    minWidth: isLandscape ? '48%' : '100%',
    maxWidth: isLandscape ? '48%' : '100%',
  },
  statLoadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 8 : 10,
  },
  statIconContainer: {
    width: isSmallDevice ? 40 : isTablet ? 56 : 48,
    height: isSmallDevice ? 40 : isTablet ? 56 : 48,
    borderRadius: isSmallDevice ? 20 : isTablet ? 28 : 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: isSmallDevice ? 20 : isTablet ? 32 : 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statValueTablet: {
    fontSize: 32,
  },
  statLabel: {
    fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: isSmallDevice ? 14 : isTablet ? 18 : 16,
  },
  statLabelTablet: {
    fontSize: 14,
    lineHeight: 18,
  },

  // Activity Section
  activitySection: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  activityCard: {
    borderRadius: isSmallDevice ? 16 : 20,
    padding: isSmallDevice ? 20 : 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? 12 : 16,
    gap: 8,
  },
  activityTitle: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  activityIconWrapper: {
    position: 'relative',
  },
  activityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  activityValue: {
    fontSize: isSmallDevice ? 32 : 40,
    fontWeight: '700',
    color: '#06b6d4',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#64748b',
    textAlign: 'center',
  },
  todayStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  todayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todayStatText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Menu Container Styles
  menuContainer: {
    marginBottom: isSmallDevice ? 24 : isTablet ? 40 : 32,
  },
  menuGrid: {
    gap: isSmallDevice ? 10 : isTablet ? 16 : 12,
  },
  menuGridTabletLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '100%',
    marginBottom: isSmallDevice ? 8 : isTablet ? 16 : 12,
  },
  menuItemTabletLandscape: {
    width: '48%',
    marginBottom: 16,
  },
  menuItemGradient: {
    borderRadius: isSmallDevice ? 14 : isTablet ? 20 : 16,
    padding: isSmallDevice ? 14 : isTablet ? 20 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: isSmallDevice ? 70 : isTablet ? 90 : 80,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  menuItemGradientTablet: {
    padding: 20,
    minHeight: 90,
    borderRadius: 20,
  },
  menuItemIconContainer: {
    width: isSmallDevice ? 44 : isTablet ? 60 : 52,
    height: isSmallDevice ? 44 : isTablet ? 60 : 52,
    borderRadius: isSmallDevice ? 22 : isTablet ? 30 : 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isSmallDevice ? 12 : isTablet ? 16 : 14,
  },
  menuItemIconContainerTablet: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  menuItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  menuItemTitle: {
    fontSize: isSmallDevice ? 15 : isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
    flex: 1,
  },
  menuItemTitleTablet: {
    fontSize: 18,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: isTablet ? 8 : 6,
    paddingVertical: isTablet ? 3 : 2,
    borderRadius: isTablet ? 10 : 8,
    marginLeft: 8,
  },
  badgeContainerTablet: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  badgeTextTablet: {
    fontSize: 12,
  },
  menuItemDescription: {
    fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
    lineHeight: isSmallDevice ? 14 : isTablet ? 18 : 16,
  },
  menuItemDescriptionTablet: {
    fontSize: 14,
    lineHeight: 18,
  },
  menuItemArrow: {
    width: isSmallDevice ? 24 : isTablet ? 32 : 28,
    height: isSmallDevice ? 24 : isTablet ? 32 : 28,
    borderRadius: isSmallDevice ? 12 : isTablet ? 16 : 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: isSmallDevice ? 8 : isTablet ? 12 : 10,
  },
  menuItemArrowTablet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 12,
  },



  // Access Denied Styles
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isSmallDevice ? 24 : 32,
  },
  accessDeniedIconContainer: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: isSmallDevice ? 50 : 60,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? 20 : 24,
  },
  accessDeniedTitle: {
    fontSize: isSmallDevice ? 22 : 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: isSmallDevice ? 8 : 12,
    letterSpacing: -0.5,
  },
  accessDeniedText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 20 : 24,
    marginBottom: isSmallDevice ? 28 : 32,
    fontWeight: '400',
  },
  accessDeniedButton: {
    width: '100%',
    maxWidth: 280,
  },
  accessDeniedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 14 : 16,
    paddingHorizontal: isSmallDevice ? 24 : 28,
    borderRadius: isSmallDevice ? 12 : 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  accessDeniedButtonText: {
    color: '#ffffff',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Bottom Spacing - Extra padding for safe area and navigation
  bottomSpacing: {
    height: isSmallDevice ? 80 : isTablet ? 40 : 100,
  },
});
