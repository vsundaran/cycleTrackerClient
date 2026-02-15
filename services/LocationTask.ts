import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';
const STORAGE_KEY_START_TIME = 'ride_start_time';
const STORAGE_KEY_DISTANCE = 'ride_distance';
const STORAGE_KEY_LAST_COORD = 'ride_last_coord';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

interface LocationTaskData {
  locations: Location.LocationObject[];
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: { data: any, error: any }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as LocationTaskData;
    const location = locations[0]; // Process the first location update

    if (location) {
      try {
        const now = Date.now();
        const startTimeStr = await AsyncStorage.getItem(STORAGE_KEY_START_TIME);
        let currentDistance = parseFloat((await AsyncStorage.getItem(STORAGE_KEY_DISTANCE)) || '0');
        let lastCoordStr = await AsyncStorage.getItem(STORAGE_KEY_LAST_COORD);
        
        // Calculate duration
        let duration = 0;
        if (startTimeStr) {
           const startTime = parseInt(startTimeStr, 10);
           duration = Math.floor((now - startTime) / 1000);
        }

        // Calculate distance if we have a previous coordinate
        if (lastCoordStr) {
            const lastCoord = JSON.parse(lastCoordStr);
            const dist = calculateDistance(
                lastCoord.latitude,
                lastCoord.longitude,
                location.coords.latitude,
                location.coords.longitude
            );
            currentDistance += dist;
            await AsyncStorage.setItem(STORAGE_KEY_DISTANCE, currentDistance.toString());
        }
        
        // Save current coordinate as last coordinate
        await AsyncStorage.setItem(STORAGE_KEY_LAST_COORD, JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        }));

        const timeString = formatTime(duration);
        const distanceString = `${currentDistance.toFixed(2)} km`;

        // Update notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Cardio Tracker is Active',
            body: `Time: ${timeString} • Distance: ${distanceString}`,
            data: { data: 'goes here' },
            sticky: true, // Android only: makes the notification ongoing
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Show immediately
        });
      } catch (err) {
        console.error('Error in background task:', err);
      }
    }
  }
});

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

function formatTime(totalSeconds: number) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function startBackgroundTracking() {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status === 'granted') {
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
    });
    
    // Initialize storage for the new ride
    await AsyncStorage.setItem(STORAGE_KEY_START_TIME, Date.now().toString());
    await AsyncStorage.setItem(STORAGE_KEY_DISTANCE, '0');
    await AsyncStorage.removeItem(STORAGE_KEY_LAST_COORD);
  }
}

export async function stopBackgroundTracking() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
  await Notifications.dismissAllNotificationsAsync();
}
