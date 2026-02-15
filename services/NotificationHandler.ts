import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { stopBackgroundTracking } from './LocationService';

// Callback for handling notification actions
let stopRideCallback: (() => void) | null = null;

/**
 * Initialize notification response listener
 * Handles user interactions with notifications (taps and action buttons)
 */
export const initNotificationResponseListener = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const actionIdentifier = response.actionIdentifier;
    
    // Handle "Stop Ride" action button
    if (actionIdentifier === 'STOP') {
      await handleStopRideAction();
    }
    
    // Handle notification tap (when user taps the notification body)
    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      // User tapped the notification - app will be brought to foreground
      // The app navigation will handle showing the appropriate screen
      console.log('Notification tapped - app brought to foreground');
    }
  });

  return subscription;
};

/**
 * Handle the "Stop Ride" action from notification
 * Stops tracking, provides haptic feedback, and triggers callback
 */
export const handleStopRideAction = async () => {
  try {
    // Provide haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Stop background tracking
    await stopBackgroundTracking();
    
    // Trigger the registered callback (e.g., navigate to summary, save ride)
    if (stopRideCallback) {
      stopRideCallback();
    }
  } catch (error) {
    console.error('Error handling stop ride action:', error);
  }
};

/**
 * Register a callback to be executed when "Stop Ride" is pressed
 * @param callback Function to execute (e.g., navigate to summary, save ride)
 */
export const registerStopRideCallback = (callback: () => void) => {
  stopRideCallback = callback;
};

/**
 * Unregister the stop ride callback
 */
export const unregisterStopRideCallback = () => {
  stopRideCallback = null;
};

// Legacy support for existing code
export const registerNotificationActionHandler = (callback: (action: string) => void) => {
    registerStopRideCallback(() => callback('STOP'));
};
export const unregisterNotificationActionHandler = unregisterStopRideCallback;
