import { auth } from '@/config/firebase';
import { AdminConfig } from '@/config/admin';

interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AdminService {
  private baseUrl = AdminConfig.baseUrl;

  // Get authentication headers
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    const token = await user?.getIdToken();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Mobile-App': 'true',
    };
  }

  // Generic API call method
  private async apiCall<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<AdminApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Admin API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Get admin dashboard stats
  async getDashboardStats() {
    return this.apiCall('/admin/stats');
  }

  // Get bookings with filters
  async getBookings(filters?: {
    status?: string;
    dateRange?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateRange) params.append('dateRange', filters.dateRange);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = `/admin/bookings${queryString ? `?${queryString}` : ''}`;
    
    return this.apiCall(endpoint);
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: string) {
    return this.apiCall(`/admin/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Get hotels
  async getHotels() {
    return this.apiCall('/admin/hotels');
  }

  // Send notification
  async sendNotification(data: {
    type: string;
    title: string;
    message: string;
    recipients?: string[];
  }) {
    return this.apiCall('/admin/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get notification history
  async getNotificationHistory() {
    return this.apiCall('/admin/notifications/history');
  }

  // Validate admin access
  async validateAdminAccess(): Promise<AdminApiResponse<{ hasAccess: boolean; role: string }>> {
    return this.apiCall('/admin/validate-access');
  }

  // Get real-time updates (WebSocket connection would be better for production)
  async getRealtimeUpdates() {
    return this.apiCall('/admin/realtime-updates');
  }
}

export const adminService = new AdminService();