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
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

export interface RideState {
  rideId: string;
  startTime: number;
  totalDistance: number; // in meters
  lastLocation: { latitude: number; longitude: number } | null;
  isPaused: boolean;
  isActive: boolean;
  gpsSignalLost: boolean;
  lastUpdateTime: number;
  lastMovementTime: number;
  currentSpeed: number; // in m/s
  route: { latitude: number; longitude: number }[];
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
    // Using a new ID 'ride-tracking-silent' to ensure settings take effect immediately
    await Notifications.setNotificationChannelAsync('ride-tracking-silent', {
      name: 'Ride Tracking (Silent)',
      importance: Notifications.AndroidImportance.MIN, // MIN to strictly prevent sound, vibration, and peeking
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



import { useRideStore } from '../store/useRideStore';

/**
 * Handle location updates from background task
 */
const handleLocationUpdates = async (locations: Location.LocationObject[]) => {
  try {
    const state = useRideStore.getState();
    
    if (state.status !== 'active') return;

    const now = Date.now();
    let { distance, routeCoordinates, lastLocation } = state;
    let currentSpeed = 0;

    locations.forEach(loc => {
      // Update current speed (ensure non-negative, -1 means unavailable)
      currentSpeed = (loc.coords.speed !== null && loc.coords.speed >= 0) 
        ? loc.coords.speed * 3.6 // Convert to km/h
        : 0;

      // Check if user is moving (speed > 0.5 m/s = ~1.8 km/h)
      const isMoving = loc.coords.speed !== null && loc.coords.speed > 0.5;

      if (isMoving) {
        // Calculate distance only when moving
        if (lastLocation) {
          const distMeters = calculateDistance(
            lastLocation.latitude,
            lastLocation.longitude,
            loc.coords.latitude,
            loc.coords.longitude
          );
          
          // Filter noise: only add distance if > 2 meters
          if (distMeters > 2) {
            distance += distMeters / 1000; // Convert to km
          }
        }
        
        lastLocation = { 
          latitude: loc.coords.latitude, 
          longitude: loc.coords.longitude 
        };

        // Persist route
        routeCoordinates.push(lastLocation);
      }
    });

    // Update global store
    useRideStore.getState().updateTrackingData({
      distance,
      routeCoordinates: [...routeCoordinates],
      lastLocation,
      currentSpeed,
    });
    
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
    const state = useRideStore.getState();
    if (state.status === 'not_started' || !state.startTime) return;

    const now = Date.now();
    
    // Calculate duration
    const durationMs = now - state.startTime;
    const durationSec = Math.floor(durationMs / 1000);
    const hours = Math.floor(durationSec / 3600);
    const minutes = Math.floor((durationSec % 3600) / 60);
    const seconds = durationSec % 60;
    
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const distanceKm = state.distance.toFixed(2);
    const speedKmh = state.currentSpeed.toFixed(1);
    
    let bodyText: string;
    if (state.status === 'paused') {
      bodyText = `⏱️ ${timeStr} • 📏 ${distanceKm} km • 🏃 ${speedKmh} km/h (Paused)`;
    } else {
      bodyText = `⏱️ ${timeStr} • 📏 ${distanceKm} km • 🏃 ${speedKmh} km/h`;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: state.status === 'paused' ? '⏸️ Ride Paused' : '🚴 Ride Active',
        body: bodyText,
        sticky: true,
        autoDismiss: false,
        color: '#4ade80',
        priority: Notifications.AndroidNotificationPriority.MIN,
        sound: false,
        vibrate: null as any,
        categoryIdentifier: 'ride-active',
        // @ts-ignore
        channelId: 'ride-tracking-silent',
        data: { rideId: 'current' },
      },
      trigger: null,
    });

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
 * Update the ride state manually from the foreground
 */
export const updateRideStateLocally = async (updates: Partial<RideState>) => {
  try {
    const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
    if (!stateStr) return;

    let state: RideState = JSON.parse(stateStr);
    
    // Apply updates
    Object.assign(state, updates);
    state.lastUpdateTime = Date.now();

    await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));
    
    // Update notification to reflect manual changes
    await updateRideNotification();
  } catch (error) {
    console.error('Error updating ride state locally:', error);
  }
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
export const startBackgroundTracking = async (rideId: string) => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Background location permission denied');
  }

  // Check if we already have an active session for this rideId
  const existingState = await getRideState();
  if (existingState && existingState.rideId === rideId && existingState.isActive) {
    console.log('Preserving existing active session state for rideId:', rideId);
    return;
  }

  // Initial state
  const initialState: RideState = {
    rideId,
    startTime: Date.now(),
    totalDistance: 0,
    lastLocation: null,
    isPaused: false,
    isActive: true,
    gpsSignalLost: false,
    lastUpdateTime: Date.now(),
    lastMovementTime: Date.now(),
    currentSpeed: 0,
    route: [],
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
 * Pause background tracking visibility/notification
 */
export const pauseBackgroundTracking = async () => {
  await updateRideNotification();
};

/**
 * Resume background tracking visibility/notification
 */
export const resumeBackgroundTracking = async () => {
  await updateRideNotification();
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
