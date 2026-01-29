import { WebView } from 'react-native-webview';

export interface WebViewMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export class WebViewCommunicator {
  private webViewRef: React.RefObject<WebView>;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(webViewRef: React.RefObject<WebView>) {
    this.webViewRef = webViewRef;
  }

  // Send message to WebView
  sendMessage(type: string, data?: any) {
    if (this.webViewRef.current) {
      const message: WebViewMessage = {
        type,
        data,
        timestamp: Date.now(),
      };
      
      const script = `
        if (window.handleMobileMessage) {
          window.handleMobileMessage(${JSON.stringify(message)});
        }
        true;
      `;
      
      this.webViewRef.current.injectJavaScript(script);
    }
  }

  // Register message handler
  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  // Handle incoming messages from WebView
  handleMessage(event: any) {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      const handler = this.messageHandlers.get(message.type);
      
      if (handler) {
        handler(message.data);
      } else {
        console.log('Unhandled WebView message:', message);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }

  // Common message types
  sendAuthData(user: any, userData: any) {
    this.sendMessage('AUTH_DATA', { user, userData });
  }

  sendThemeData(theme: any) {
    this.sendMessage('THEME_DATA', theme);
  }

  sendNavigationCommand(command: 'back' | 'forward' | 'reload') {
    this.sendMessage('NAVIGATION', { command });
  }

  sendError(error: string) {
    this.sendMessage('ERROR', { error });
  }

  // Cleanup
  destroy() {
    this.messageHandlers.clear();
  }
}

// Utility functions for WebView configuration
export const getWebViewInjectedJavaScript = (user: any, userData: any, authToken?: string | null) => {
  return `
    // Inject authentication and app data
    window.MOBILE_APP_DATA = {
      user: ${JSON.stringify(user)},
      userData: ${JSON.stringify(userData)},
      authToken: '${authToken || ''}',
      platform: 'mobile',
      timestamp: ${Date.now()}
    };

    // Set Firebase auth token in localStorage for web app
    if ('${authToken}') {
      try {
        localStorage.setItem('firebase_auth_token', '${authToken}');
        localStorage.setItem('mobile_user_data', '${JSON.stringify(userData).replace(/'/g, "\\'")}');
        localStorage.setItem('mobile_user', '${JSON.stringify(user).replace(/'/g, "\\'")}');
        console.log('Mobile auth data injected successfully');
      } catch (e) {
        console.error('Error setting mobile auth data:', e);
      }
    }

    // Handle messages from React Native
    window.handleMobileMessage = function(message) {
      console.log('Received message from mobile app:', message);
      
      // Dispatch custom event for web app to handle
      const event = new CustomEvent('mobileMessage', { detail: message });
      document.dispatchEvent(event);
    };

    // Send messages to React Native
    window.sendToMobile = function(type, data) {
      if (window.ReactNativeWebView) {
        const message = {
          type: type,
          data: data,
          timestamp: Date.now()
        };
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    };

    // Mobile-specific optimizations
    document.addEventListener('DOMContentLoaded', function() {
      // Disable text selection for better mobile experience
      document.body.style.webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';
      
      // Prevent zoom on input focus
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.getElementsByTagName('head')[0].appendChild(meta);
      }

      // Add mobile app class for styling
      document.body.classList.add('mobile-app');
      
      // Handle mobile-specific events
      document.addEventListener('mobileMessage', function(event) {
        const message = event.detail;
        
        switch (message.type) {
          case 'AUTH_DATA':
            // Update auth data in web app
            if (window.updateAuthData) {
              window.updateAuthData(message.data);
            }
            break;
          case 'THEME_DATA':
            // Update theme in web app
            if (window.updateTheme) {
              window.updateTheme(message.data);
            }
            break;
          case 'NAVIGATION':
            // Handle navigation commands
            if (message.data.command === 'back' && window.history.length > 1) {
              window.history.back();
            } else if (message.data.command === 'forward') {
              window.history.forward();
            } else if (message.data.command === 'reload') {
              window.location.reload();
            }
            break;
        }
      });

      // Notify mobile app that web page is ready
      window.sendToMobile('PAGE_READY', {
        url: window.location.href,
        title: document.title
      });
    });

    true; // Required for injected JavaScript
  `;
};

// WebView error handling utilities
export const handleWebViewError = (error: any, onError?: (message: string) => void) => {
  let errorMessage = 'An error occurred while loading the page.';
  
  if (error.nativeEvent) {
    const { code, description, domain } = error.nativeEvent;
    
    switch (code) {
      case -1009: // No internet connection
        errorMessage = 'No internet connection. Please check your network settings.';
        break;
      case -1001: // Request timeout
        errorMessage = 'Request timed out. Please try again.';
        break;
      case -1004: // Cannot connect to host
        errorMessage = 'Cannot connect to server. Please try again later.';
        break;
      default:
        errorMessage = description || errorMessage;
    }
  }
  
  if (onError) {
    onError(errorMessage);
  }
  
  return errorMessage;
};