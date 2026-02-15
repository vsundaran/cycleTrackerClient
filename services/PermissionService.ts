import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

export interface PermissionStatus {
  foregroundLocation: boolean;
  backgroundLocation: boolean;
  notifications: boolean;
  allGranted: boolean;
}

/**
 * Request all required permissions for ride tracking
 * Returns status object indicating which permissions were granted
 */
export const requestAllPermissions = async (): Promise<PermissionStatus> => {
  const status: PermissionStatus = {
    foregroundLocation: false,
    backgroundLocation: false,
    notifications: false,
    allGranted: false,
  };

  try {
    // 1. Request foreground location permission
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    status.foregroundLocation = foregroundStatus === 'granted';

    if (!status.foregroundLocation) {
      Alert.alert(
        'Location Permission Required',
        'Cycle Tracker needs access to your location to track your rides. Please enable location access in Settings.',
        [{ text: 'OK' }]
      );
      return status;
    }

    // 2. Request notification permission
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    status.notifications = notificationStatus === 'granted';

    if (!status.notifications) {
      Alert.alert(
        'Notification Permission Required',
        'Cycle Tracker needs notification access to show ride updates when the app is in the background.',
        [{ text: 'OK' }]
      );
      // Continue even if notifications denied - not critical
    }

    // 3. Request background location permission (only after foreground is granted)
    if (status.foregroundLocation) {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      status.backgroundLocation = backgroundStatus === 'granted';

      if (!status.backgroundLocation) {
        Alert.alert(
          'Background Location Required',
          Platform.OS === 'ios'
            ? 'To track rides when the app is in the background, please select "Always Allow" for location access in Settings.'
            : 'To track rides when the app is in the background, please enable "Allow all the time" for location access in Settings.',
          [{ text: 'OK' }]
        );
      }
    }

    status.allGranted = status.foregroundLocation && status.backgroundLocation && status.notifications;
    return status;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return status;
  }
};

/**
 * Check current permission status without requesting
 */
export const checkPermissions = async (): Promise<PermissionStatus> => {
  const status: PermissionStatus = {
    foregroundLocation: false,
    backgroundLocation: false,
    notifications: false,
    allGranted: false,
  };

  try {
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    status.foregroundLocation = foregroundStatus === 'granted';

    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    status.backgroundLocation = backgroundStatus === 'granted';

    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    status.notifications = notificationStatus === 'granted';

    status.allGranted = status.foregroundLocation && status.backgroundLocation && status.notifications;
    return status;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return status;
  }
};

/**
 * Show alert when permission is denied mid-ride
 */
export const handlePermissionLoss = () => {
  Alert.alert(
    'Location Access Lost',
    'Cycle Tracker has lost access to your location. Your current ride will be saved, but tracking has stopped. Please enable location access in Settings to continue tracking.',
    [{ text: 'OK' }]
  );
};

/**
 * Check if critical permissions are granted for ride tracking
 */
export const canStartRide = async (): Promise<boolean> => {
  const permissions = await checkPermissions();
  return permissions.foregroundLocation && permissions.backgroundLocation;
};
