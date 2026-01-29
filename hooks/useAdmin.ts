import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminConfig, hasAdminAccess } from '@/config/admin';

interface AdminStats {
  totalBookings: number;
  todayBookings: number;
  revenue: number;
  pendingBookings: number;
}

export const useAdmin = () => {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalBookings: 0,
    todayBookings: 0,
    revenue: 0,
    pendingBookings: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user has admin access
  const isAdmin = hasAdminAccess(userData?.role);

  // Fetch admin stats (this would typically call your API)
  const fetchStats = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      // This is a placeholder - you would implement actual API calls here
      // For now, we'll simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API calls
      setStats({
        totalBookings: 150,
        todayBookings: 5,
        revenue: 45000,
        pendingBookings: 3,
      });
    } catch (err) {
      setError('Failed to fetch admin statistics');
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get admin URL for a specific route
  const getAdminUrl = (route: keyof typeof AdminConfig.routes) => {
    return `${AdminConfig.baseUrl}${AdminConfig.routes[route]}`;
  };

  // Send message to WebView
  const sendMessageToWebView = (webViewRef: any, type: string, data: any) => {
    if (webViewRef.current) {
      const message = JSON.stringify({ type, ...data });
      webViewRef.current.postMessage(message);
    }
  };

  // Handle WebView messages
  const handleWebViewMessage = (event: any, onMessage?: (data: any) => void) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      // Handle common admin messages
      switch (data.type) {
        case 'STATS_UPDATE':
          setStats(data.stats);
          break;
        case 'ERROR':
          setError(data.message);
          break;
        case 'LOADING':
          setLoading(data.loading);
          break;
        default:
          // Pass to custom handler if provided
          if (onMessage) {
            onMessage(data);
          }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  return {
    // User state
    user,
    userData,
    isAdmin,
    
    // Stats
    stats,
    loading,
    error,
    
    // Methods
    fetchStats,
    getAdminUrl,
    sendMessageToWebView,
    handleWebViewMessage,
    
    // Configuration
    config: AdminConfig,
  };
};