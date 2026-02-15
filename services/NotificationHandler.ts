import * as Notifications from 'expo-notifications';
import { stopBackgroundTracking } from './LocationService';

/**
 * Notification event handler for ride tracking
 * This service handles notification actions and provides callbacks for navigation
 */

type NotificationActionCallback = (action: 'STOP') => void;

let actionCallback: NotificationActionCallback | null = null;

/**
 * Register a callback to handle notification actions
 * @param callback Function to call when notification action is triggered
 */
export const registerNotificationActionHandler = (callback: NotificationActionCallback) => {
  actionCallback = callback;
};

/**
 * Unregister the notification action handler
 */
export const unregisterNotificationActionHandler = () => {
  actionCallback = null;
};

/**
 * Initialize notification response listener
 * This should be called once at app startup
 */
export const initNotificationResponseListener = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const actionId = response.actionIdentifier;
    
    if (actionId === 'STOP' || actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      // Stop tracking
      await stopBackgroundTracking();
      
      // Trigger callback if registered
      if (actionCallback) {
        actionCallback('STOP');
      }
    }
  });

  return subscription;
};
