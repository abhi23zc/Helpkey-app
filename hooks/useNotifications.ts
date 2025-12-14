import { useState } from 'react';
import notificationManager, { NotificationEvent } from '../services/notificationManager';
import whatsappNotificationService from '../services/whatsappNotification';

interface UseNotificationsReturn {
  sendNotification: (event: NotificationEvent) => Promise<boolean>;
  sendCustomMessage: (phone: string, message: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = async (event: NotificationEvent): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await notificationManager.handleEvent(event);
      if (!success) {
        setError('Failed to send notification');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendCustomMessage = async (phone: string, message: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await whatsappNotificationService.sendCustomMessage(phone, message);
      if (!success) {
        setError('Failed to send custom message');
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendNotification,
    sendCustomMessage,
    isLoading,
    error
  };
};

export default useNotifications;