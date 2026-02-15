import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LOCATION_TASK_NAME = 'background-location-task';
const RIDE_STATE_KEY = 'ride_state';
const NOTIFICATION_ID = 'ride-tracking-notification';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface RideState {
  startTime: number;
  totalDistance: number; // in meters
  lastLocation: { latitude: number; longitude: number } | null;
  isPaused: boolean;
  isActive: boolean;
  gpsSignalLost: boolean;
  lastUpdateTime: number;
  lastMovementTime: number;
  currentSpeed: number; // in m/s
}

// Notification update timer reference
let notificationUpdateInterval: NodeJS.Timeout | null = null;

/**
 * Initialize background fetch and notification system
 */
export const initBackgroundFetch = async () => {
  // Check if task is already defined
  if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('Background location task error:', error);
        return;
      }

      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        await handleLocationUpdates(locations);
      }
    });
  }

  // Setup notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('ride-tracking', {
      name: 'Ride Tracking',
      importance: Notifications.AndroidImportance.LOW, // LOW to suppress sound and vibration
      vibrationPattern: null,
      lightColor: '#4ade80',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: false,
    });
  }

  // Set up notification category with Stop action
  await Notifications.setNotificationCategoryAsync('ride-active', [
    { 
      identifier: 'STOP', 
      buttonTitle: 'Stop', 
      options: { 
        opensAppToForeground: true,
        isDestructive: true,
      } 
    },
  ]);
};



/**
 * Handle location updates from background task
 */
const handleLocationUpdates = async (locations: Location.LocationObject[]) => {
  try {
    const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
    if (!stateStr) return;

    let state: RideState = JSON.parse(stateStr);
    
    if (!state.isActive || state.isPaused) return;

    const now = Date.now();
    state.lastUpdateTime = now;
    state.gpsSignalLost = false; // We got an update, so GPS is working

    locations.forEach(loc => {
      // Update current speed (ensure non-negative, -1 means unavailable)
      state.currentSpeed = (loc.coords.speed !== null && loc.coords.speed >= 0) 
        ? loc.coords.speed 
        : 0;

      // Check if user is moving (speed > 0.5 m/s = ~1.8 km/h)
      const isMoving = loc.coords.speed !== null && loc.coords.speed > 0.5;

      if (isMoving) {
        state.lastMovementTime = now;

        // Calculate distance only when moving
        if (state.lastLocation) {
          const dist = calculateDistance(
            state.lastLocation.latitude,
            state.lastLocation.longitude,
            loc.coords.latitude,
            loc.coords.longitude
          );
          
          // Filter noise: only add distance if > 2 meters
          if (dist > 2) {
            state.totalDistance += dist;
          }
        }
        
        state.lastLocation = { 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude 
        };
      }
    });

    // Update state
    await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));
    
    // Trigger notification update in background
    await updateRideNotification();
    
  } catch (error) {
    console.error('Error in background task:', error);
  }
};

/**
 * Update the persistent notification with current ride data
 */
const updateRideNotification = async () => {
  try {
    const state = await getRideState();
    if (!state || !state.isActive) return;

    const now = Date.now();
    
    // Check for GPS signal loss (no updates for 10+ seconds)
    const timeSinceLastUpdate = now - state.lastUpdateTime;
    const gpsLost = timeSinceLastUpdate > 10000;

    // Calculate duration
    const durationMs = now - state.startTime;
    const durationSec = Math.floor(durationMs / 1000);
    const hours = Math.floor(durationSec / 3600);
    const minutes = Math.floor((durationSec % 3600) / 60);
    const seconds = durationSec % 60;
    
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const distanceKm = (state.totalDistance / 1000).toFixed(2);
    const speedKmh = (state.currentSpeed * 3.6).toFixed(1); // Convert m/s to km/h
    
    let bodyText: string;
    if (gpsLost) {
      bodyText = `⏱️ ${timeStr} • 📍 Waiting for GPS...`;
    } else if (state.isPaused) {
      bodyText = `⏱️ ${timeStr} • 📏 ${distanceKm} km • 🏃 ${speedKmh} km/h (Paused)`;
    } else {
      bodyText = `⏱️ ${timeStr} • 📏 ${distanceKm} km • 🏃 ${speedKmh} km/h`;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: state.isPaused ? '⏸️ Ride Paused' : '🚴 Ride Active',
        body: bodyText,
        sticky: true,
        autoDismiss: false,
        color: '#4ade80',
        priority: Notifications.AndroidNotificationPriority.LOW,
        sound: false,
        vibrate: [0, 0, 0, 0] as any, // Explicitly disable vibration
        categoryIdentifier: 'ride-active',
        data: { rideId: 'current' },
      },
      trigger: null,
    });

    // Update GPS signal lost flag if changed
    if (gpsLost !== state.gpsSignalLost) {
      state.gpsSignalLost = gpsLost;
      await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.error('Error updating notification:', error);
  }
};

/**
 * Start the notification update timer
 */
const startNotificationUpdateTimer = () => {
  // Clear any existing timer
  if (notificationUpdateInterval) {
    clearInterval(notificationUpdateInterval);
  }

  // Update notification every second for live timer
  notificationUpdateInterval = setInterval(() => {
    updateRideNotification();
  }, 1000);

  // Initial update
  updateRideNotification();
};

/**
 * Stop the notification update timer
 */
const stopNotificationUpdateTimer = () => {
  if (notificationUpdateInterval) {
    clearInterval(notificationUpdateInterval);
    notificationUpdateInterval = null;
  }
};

/**
 * Start background location tracking
 */
export const startBackgroundTracking = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Background location permission denied');
  }

  // Initial state
  const initialState: RideState = {
    startTime: Date.now(),
    totalDistance: 0,
    lastLocation: null,
    isPaused: false,
    isActive: true,
    gpsSignalLost: false,
    lastUpdateTime: Date.now(),
    lastMovementTime: Date.now(),
    currentSpeed: 0,
  };
  await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(initialState));

  // Start location updates
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000, // Update every second
    distanceInterval: 1, // Update every 1 meter to ensure background task triggers often
    foregroundService: {
      notificationTitle: "Cardio Tracker",
      notificationBody: "Tracking your ride...",
      notificationColor: "#4ade80",
    },
    showsBackgroundLocationIndicator: true, // iOS
    pausesUpdatesAutomatically: false,
  });

  // Start notification update timer
  startNotificationUpdateTimer();
};

/**
 * Stop background location tracking
 */
export const stopBackgroundTracking = async () => {
  // Stop notification updates
  stopNotificationUpdateTimer();

  // Stop location updates
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }

  // Clear state
  await AsyncStorage.removeItem(RIDE_STATE_KEY);

  // Dismiss notification
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  await Notifications.dismissAllNotificationsAsync();
};

/**
 * Pause background tracking (timer continues, distance stops)
 */
export const pauseBackgroundTracking = async () => {
  const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
  if (stateStr) {
    const state: RideState = JSON.parse(stateStr);
    state.isPaused = true;
    await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));
    await updateRideNotification(); // Update notification to show paused state
  }
};

/**
 * Resume background tracking
 */
export const resumeBackgroundTracking = async () => {
  const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
  if (stateStr) {
    const state: RideState = JSON.parse(stateStr);
    state.isPaused = false;
    await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));
    await updateRideNotification(); // Update notification to show active state
  }
};

/**
 * Get current ride state
 */
export const getRideState = async (): Promise<RideState | null> => {
  try {
    const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
    if (stateStr) {
      return JSON.parse(stateStr);
    }
  } catch (e) {
    console.error("Error getting ride state", e);
  }
  return null;
};

/**
 * Get current ride statistics
 */
export const getRideStats = async () => {
  const state = await getRideState();
  if (!state) return null;

  const now = Date.now();
  const durationSec = Math.floor((now - state.startTime) / 1000);
  const distanceKm = state.totalDistance / 1000;

  return {
    duration: durationSec,
    distance: distanceKm,
    isActive: state.isActive,
    isPaused: state.isPaused,
    gpsSignalLost: state.gpsSignalLost,
  };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in metres
};

/**
 * Check for an active ride (e.g., after app restart)
 */
export const checkForActiveRide = async (): Promise<RideState | null> => {
  try {
    const state = await getRideState();
    if (state && state.isActive) {
      // Resume notification updates if active
      startNotificationUpdateTimer();
      return state; 
    }
  } catch (e) {
    console.error("Error checking for active ride", e);
  }
  return null;
};
