import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  StatusBar,
  BackHandler,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { AdminConfig, hasAdminAccess } from '@/config/admin';
import { WebViewCommunicator, getWebViewInjectedJavaScript, handleWebViewError } from '@/utils/webViewUtils';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isTablet = SCREEN_WIDTH >= 768;

interface AdminWebViewProps {
  initialUrl?: string;
  title?: string;
  showBackButton?: boolean;
  showHeader?: boolean;
}

export default function AdminWebView({
  initialUrl = '/mobile-admin',
  title = 'Admin Dashboard',
  showBackButton = true,
  showHeader = true
}: AdminWebViewProps) {
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null!);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [communicator, setCommunicator] = useState<WebViewCommunicator | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Get the full URL using configuration
  const fullUrl = `${AdminConfig.baseUrl}${initialUrl}`;

  // Request location permission on Android
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location to show your hotel location on the map.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setLocationPermissionGranted(true);
          }
        } catch (err) {
          console.warn('Location permission error:', err);
        }
      } else {
        // iOS handles permissions differently
        setLocationPermissionGranted(true);
      }
    };
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Initialize WebView communicator
    const comm = new WebViewCommunicator(webViewRef);
    setCommunicator(comm);

    // Set up message handlers
    comm.onMessage('LOGOUT', () => {
      Alert.alert(
        'Logout',
        'You have been logged out from the admin dashboard.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    });

    comm.onMessage('NAVIGATION', (data) => {
      if (data.action === 'BACK') {
        router.back();
      }
    });

    comm.onMessage('ERROR', (data) => {
      Alert.alert('Error', data.message);
    });

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => {
      backHandler.remove();
      comm.destroy();
    };
  }, [canGoBack]);

  // Check if user has admin access using configuration
  const userHasAdminAccess = () => {
    return hasAdminAccess(userData?.role);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  // Track if this is the initial load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const handleLoadStart = () => {
    // Only show loading on initial load, not on navigation within WebView
    if (!initialLoadComplete) {
      setLoading(true);
    }
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setInitialLoadComplete(true);
  };

  const handleError = (syntheticEvent: any) => {
    const errorMessage = handleWebViewError(syntheticEvent, setError);
    console.error('WebView error:', syntheticEvent.nativeEvent);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView HTTP error:', nativeEvent);
    if (nativeEvent.statusCode === 404) {
      setError(AdminConfig.errorMessages.notFound);
    } else if (nativeEvent.statusCode >= 500) {
      setError(AdminConfig.errorMessages.serverError);
    } else {
      setError(`HTTP Error: ${nativeEvent.statusCode}`);
    }
    setLoading(false);
  };

  const handleMessage = (event: any) => {
    if (communicator) {
      communicator.handleMessage(event);
    }
  };

  // Get Firebase auth token
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const getAuthToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
    };
    getAuthToken();
  }, [user]);

  const injectedJavaScript = getWebViewInjectedJavaScript(user, userData, authToken);

  // Show access denied if user doesn't have admin rights
  if (!userHasAdminAccess()) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.accessDeniedContainer}>
          <View style={styles.accessDeniedIconWrapper}>
            <LinearGradient
              colors={['#334155', '#1e293b'] as const}
              style={styles.accessDeniedIconGradient}
            >
              <Ionicons name="shield-outline" size={isSmallDevice ? 48 : 64} color="#64748b" />
            </LinearGradient>
          </View>
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            {AdminConfig.errorMessages.accessDenied}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#334155', '#475569'] as const}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={18} color="#ffffff" />
              <Text style={styles.backButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Custom Header - Improved responsive design */}
      {showHeader && showBackButton && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.headerButtonInner}>
              <Ionicons name="arrow-back" size={isSmallDevice ? 20 : 22} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            {userData?.fullName && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {userData.fullName}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => webViewRef.current?.reload()}
            activeOpacity={0.7}
          >
            <View style={styles.headerButtonInner}>
              <Ionicons name="refresh" size={isSmallDevice ? 18 : 20} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Loading admin dashboard...</Text>
          </View>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrapper}>
            <Ionicons name="warning-outline" size={isSmallDevice ? 40 : 48} color="#ef4444" />
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              webViewRef.current?.reload();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#06b6d4', '#0891b2'] as const}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh" size={18} color="#ffffff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView with proper padding for bottom safe area */}
      {!error && (
        <View style={[styles.webviewContainer, { paddingBottom: insets.bottom }]}>
          <WebView
            ref={webViewRef}
            source={{ uri: fullUrl }}
            style={styles.webview}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleHttpError}
            onMessage={handleMessage}
            onNavigationStateChange={handleNavigationStateChange}
            injectedJavaScript={injectedJavaScript}
            injectedJavaScriptBeforeContentLoaded={`
              // Set auth data before page loads
              try {
                window.localStorage.setItem('firebase_auth_token', '${authToken || ''}');
                window.localStorage.setItem('mobile_user_data', '${JSON.stringify(userData).replace(/'/g, "\\'")}');
                window.localStorage.setItem('mobile_user', '${JSON.stringify(user).replace(/'/g, "\\'")}');
                // Mark as WebView for the web page to detect
                window.localStorage.setItem('is_webview', 'true');
                // Pass safe area insets to web page
                window.localStorage.setItem('safe_area_top', '${insets.top}');
                window.localStorage.setItem('safe_area_bottom', '${insets.bottom}');
                console.log('Pre-load auth injection successful');
              } catch (e) {
                console.error('Pre-load auth injection failed:', e);
              }
              true;
            `}
            {...AdminConfig.webViewConfig}
            geolocationEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            cacheEnabled={true}
            androidLayerType="hardware"
            originWhitelist={['*']}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            contentInsetAdjustmentBehavior="automatic"
          />
        </View>
      )}
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 10 : 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  headerButton: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
  },
  headerButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: isSmallDevice ? 18 : 20,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#64748b',
    marginTop: 2,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isSmallDevice ? 24 : 32,
    backgroundColor: '#0f172a',
  },
  errorIconWrapper: {
    width: isSmallDevice ? 72 : 88,
    height: isSmallDevice ? 72 : 88,
    borderRadius: isSmallDevice ? 36 : 44,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  errorText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isSmallDevice ? 24 : 32,
  },
  accessDeniedIconWrapper: {
    marginBottom: 20,
  },
  accessDeniedIconGradient: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: isSmallDevice ? 50 : 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  accessDeniedTitle: {
    fontSize: isSmallDevice ? 22 : 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  accessDeniedText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 20 : 24,
    marginBottom: 28,
    maxWidth: 300,
  },
  backButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 14 : 16,
    paddingHorizontal: isSmallDevice ? 24 : 28,
    gap: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});