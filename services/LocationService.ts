import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';
const RIDE_STATE_KEY = 'ride_state';
const NOTIFICATION_ID = 'ride-tracking-status';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface RideState {
  startTime: number;
  totalDistance: number; // in meters
  lastLocation: { latitude: number; longitude: number } | null;
  isPaused: boolean;
}

export const initBackgroundFetch = async () => {
    // Check if task is already defined
    if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
        TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
            if (error) {
            console.error(error);
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
            importance: Notifications.AndroidImportance.LOW,
            vibrationPattern: null, // No vibration
            lightColor: '#FF231F7C',
        });
    }
};

const handleLocationUpdates = async (locations: Location.LocationObject[]) => {
  try {
    const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
    if (!stateStr) return;

    let state: RideState = JSON.parse(stateStr);
    
    if (state.isPaused) return;

    let totalDistance = state.totalDistance;
    let lastLocation = state.lastLocation;

    locations.forEach(loc => {
    // Calculate distance
    let dist = 0;
    if (state.lastLocation) {
        dist = calculateDistance(
        state.lastLocation.latitude,
        state.lastLocation.longitude,
        loc.coords.latitude,
        loc.coords.longitude
        );
    }
    
    // basic noise filter
    if (dist > 2) {
        state.totalDistance += dist;
    }
    
    state.lastLocation = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    });

    // Update state
    await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));

    // Update notification
    await updateNotification(state);
    
  } catch (error) {
    console.error('Error in background task:', error);
  }
};

const updateNotification = async (state: RideState) => {
  const durationMs = Date.now() - state.startTime;
  const durationSec = Math.floor(durationMs / 1000);
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const seconds = durationSec % 60;
  
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const distanceKm = (state.totalDistance / 1000).toFixed(2);

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'Ride in Progress',
      body: `Time: ${timeStr} • Dist: ${distanceKm} km`,
      sticky: true,
      autoDismiss: false,
      color: '#4ade80',
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: null,
  });
};

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
  };
  await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(initialState));

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 5,
    foregroundService: {
      notificationTitle: "Cardio Tracker",
      notificationBody: "Tracking your ride...",
      notificationColor: "#4ade80",
    },
    showsBackgroundLocationIndicator: true, // iOS
    pausesUpdatesAutomatically: false,
  });
};

export const stopBackgroundTracking = async () => {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
  await AsyncStorage.removeItem(RIDE_STATE_KEY);
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  await Notifications.dismissAllNotificationsAsync();
};

export const pauseBackgroundTracking = async () => {
    const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
    if (stateStr) {
        const state = JSON.parse(stateStr);
        state.isPaused = true;
        await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));
    }
};

export const resumeBackgroundTracking = async () => {
    const stateStr = await AsyncStorage.getItem(RIDE_STATE_KEY);
    if (stateStr) {
        const state = JSON.parse(stateStr);
        state.isPaused = false;
        // Adjust start time to account for pause duration if needed, 
        // but for simple elapsed time since start, we might keep it simple or store 'accumulatedPausedTime'
        // For now, let's just resume flag.
        await AsyncStorage.setItem(RIDE_STATE_KEY, JSON.stringify(state));
    }
};

// Helper for distance calculation (Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

import { Platform } from 'react-native';
