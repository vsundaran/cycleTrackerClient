import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Settings, Navigation, Plus, Minus, Route, Gauge, Pause, Play, Square, RefreshCcw } from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useCreateRide, useUpdateRideCoordinates, useEndRide } from '../../hooks/useRides';
import { startBackgroundTracking, stopBackgroundTracking, initBackgroundFetch } from '../../services/LocationService';
import { registerNotificationActionHandler, unregisterNotificationActionHandler, initNotificationResponseListener } from '../../services/NotificationHandler';
import { CustomModal } from '../ui/CustomModal';

const { width, height } = Dimensions.get('window');

type RideStatus = 'not_started' | 'active' | 'paused';

interface MapProps {
  initialLocation: Location.LocationObject;
  routeCoordinates: { latitude: number; longitude: number }[];
  status: RideStatus;
  mapRef: React.RefObject<MapView | null>;
  onRegionChangeComplete: (region: any) => void;
}

const MemoizedMap = React.memo(({ 
  initialLocation, 
  routeCoordinates, 
  status, 
  mapRef,
  onRegionChangeComplete 
}: MapProps) => {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={true}
      followsUserLocation={status === 'active'}
      loadingEnabled={true}
      pitchEnabled={false}
      rotateEnabled={false}
    >
      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#4ade80"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}, (prev, next) => {
  // Only re-render if status changes or coordinates length changes significantly
  // (We sync every 5 points, so we can also optimize redraw here)
  return (
    prev.status === next.status && 
    prev.routeCoordinates.length === next.routeCoordinates.length
  );
});

export default function RideTracking({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [status, setStatus] = useState<RideStatus>('not_started');
  const [rideId, setRideId] = useState<string | null>(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const createRideMutation = useCreateRide();
  const updateCoordsMutation = useUpdateRideCoordinates();
  const endRideMutation = useEndRide();

  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial location request and notification setup
  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation);
      
      await initBackgroundFetch();
      
      // Initialize notification response listener
      const subscription = initNotificationResponseListener();
      
      // Register handler for notification actions
      registerNotificationActionHandler((action) => {
        if (action === 'STOP') {
          // Navigate to summary when stop is pressed from notification
          onNavigate('RideSummary');
        }
      });
      
      // Cleanup on unmount
      return () => {
        subscription?.remove();
        unregisterNotificationActionHandler();
      };
    })();
  }, [onNavigate]);

  // Timer logic
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Location tracking logic
  useEffect(() => {
    // We don't need foreground subscription if we use background service, 
    // BUT mapped route needs updates. 
    // We can either listen to AsyncStorage changes (polling) or keep a foreground sub used ONLY for UI updates when app is open.
    // Keeping foreground sub for UI smoothness, but background task handles notification.
    let subscriber: Location.LocationSubscription | null = null;

    if (status === 'active') {
      (async () => {
        // Start background service
        try {
            await startBackgroundTracking();
        } catch (e) {
            console.log("Background tracking failed to start", e);
        }

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 2, // Reduced for more frequent updates
          },
          (newLocation) => {
            setLocation(newLocation);
            
            // Calculate speed (convert m/s to km/h)
            // Ensure speed is non-negative. location.coords.speed is -1 if invalid
            const speedKmh = (newLocation.coords.speed && newLocation.coords.speed > 0) 
              ? newLocation.coords.speed * 3.6 
              : 0;
            setCurrentSpeed(speedKmh);

            setRouteCoordinates((prev) => [
              ...prev,
              {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              },
            ]);
            
            // Calculate distance using Ref to avoid stale closure
            if (lastLocationRef.current) {
                const dist = calculateDistance(
                    lastLocationRef.current.latitude,
                    lastLocationRef.current.longitude,
                    newLocation.coords.latitude,
                    newLocation.coords.longitude
                );
                // Only add distance if it's reasonable (e.g. > 2 meters to avoid noise)
                if (dist > 0.002) {
                     setDistance(prev => prev + dist);
                }
            }
            
            // Update last location ref
            lastLocationRef.current = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude
            };
          }
        );
      })();
    } else {
        // Stop background service when not active
        stopBackgroundTracking().catch(console.error);
    }

    return () => {
      if (subscriber) subscriber.remove();
    };
  }, [status]);

  // Sync coordinates to backend effect
  useEffect(() => {
    if (status === 'active' && rideId && routeCoordinates.length > 0) {
      const lastCoord = routeCoordinates[routeCoordinates.length - 1];
      // Sync every 5 points to minimize noise but keep state fresh
      if (routeCoordinates.length % 5 === 0) {
        updateCoordsMutation.mutate({ 
          id: rideId, 
          coordinates: [{ ...lastCoord, timestamp: new Date() }] 
        });
      }
    }
  }, [routeCoordinates.length]);


  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDynamicRideName = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Morning Ride';
    if (hour >= 12 && hour < 17) return 'Afternoon Ride';
    if (hour >= 17 && hour < 21) return 'Evening Ride';
    return 'Night Ride';
  };

  const handleStart = async () => {
    try {
      const dynamicName = getDynamicRideName();
      const newRide = await createRideMutation.mutateAsync(dynamicName);
      setRideId(newRide._id);
      setStatus('active');
    } catch (err) {
      console.error('Failed to start ride:', err);
    }
  };

  const handlePause = () => setStatus(status === 'active' ? 'paused' : 'active');

  const confirmStop = async () => {
    if (!rideId) return;
    setShowStopModal(false);

    try {
      // Stop background tracking first
      await stopBackgroundTracking();
      
      const stats = {
        distance,
        duration: seconds,
        avgSpeed: seconds > 0 ? (distance / (seconds / 3600)) : 0,
        calories: distance * 50,
      };

      await endRideMutation.mutateAsync({ id: rideId, stats });
      onNavigate('RideSummary');
    } catch (err) {
      console.error('Failed to end ride:', err);
    }
  };

  const handleStop = () => setShowStopModal(true);



  const handleZoom = (zoomIn: boolean) => {
    if (mapRef.current) {
      const factor = zoomIn ? 0.5 : 2;
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * factor,
        longitudeDelta: region.longitudeDelta * factor,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setRegion(newRegion);
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };


  const avgSpeed = seconds > 0 ? (distance / (seconds / 3600)) : 0;

  return (
    <View style={styles.container}>
      <CustomModal
        isVisible={showStopModal}
        title="Stop Ride?"
        message="Are you sure you want to finish your ride and save your progress?"
        confirmText="Finish"
        onConfirm={confirmStop}
        onCancel={() => setShowStopModal(false)}
      />
      {/* Header */}
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.iconBg}>
            <Bike size={20} color="#4ade80" />
          </View>
          <Text style={styles.headerTitle}>New Ride</Text>
          <View style={styles.settingsBtn} />
        </View>
      </SafeAreaView>

      {/* Map Content Area */}
      <View style={styles.main}>
        {location ? (
          <MemoizedMap
            mapRef={mapRef}
            initialLocation={location}
            routeCoordinates={routeCoordinates}
            status={status}
            onRegionChangeComplete={setRegion}
          />
        ) : (
          <View style={[styles.map, styles.loadingMap]}>
            <Text style={styles.loadingText}>Initializing Map...</Text>
          </View>
        )}


        {/* Map Overlays */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapBtn} onPress={centerOnUser}>
            <Navigation size={24} color="#4ade80" />
          </TouchableOpacity>
          <View style={styles.zoomControls}>
            <TouchableOpacity style={[styles.mapBtn, styles.zoomTop]} onPress={() => handleZoom(true)}>
              <Plus size={24} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtn} onPress={() => handleZoom(false)}>
              <Minus size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statsOverlay}>
          <View style={styles.statsCard}>
            {/* Timer */}
            <View style={styles.timerSection}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.timerValue}>{formatTime(seconds)}</Text>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Route size={14} color="#4ade80" />
                  <Text style={styles.metricLabel}>DISTANCE</Text>
                </View>
                <Text style={styles.metricValue}>
                  {distance.toFixed(2)} <Text style={styles.metricUnit}>km</Text>
                </Text>
              </View>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Gauge size={14} color="#4ade80" />
                  <Text style={styles.metricLabel}>CURRENT SPEED</Text>
                </View>
                <Text style={styles.metricValue}>
                  {currentSpeed.toFixed(1)} <Text style={styles.metricUnit}>km/h</Text>
                </Text>
              </View>
            </View>

            {/* Main Action Buttons */}
            {status === 'not_started' ? (
              <TouchableOpacity style={styles.startBtn} activeOpacity={0.8} onPress={handleStart}>
                <Text style={styles.startText}>START RIDE</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionSection}>
                <View style={styles.btnRow}>
                  <TouchableOpacity 
                    style={[styles.pauseBtn, status === 'paused' && styles.resumeBtn]} 
                    onPress={handlePause}
                  >
                    {status === 'active' ? (
                        <>
                            <Pause size={20} color="#4ade80" />
                            <Text style={styles.pauseText}>PAUSE</Text>
                        </>
                    ) : (
                        <>
                            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.resumeText}>RESUME</Text>
                        </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                    <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.stopText}>STOP</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.autoPauseSection}>
                   <RefreshCcw size={16} color="#94a3b8" />
                   <Text style={styles.autoPauseText}>Live Tracking Active</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeHeader: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 222, 128, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  settingsBtn: {
    width: 40,
    alignItems: 'flex-end',
  },
  main: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingMap: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  mapControls: {
    position: 'absolute',
    top: 130, // Increased to avoid header overlap
    right: 16,
    gap: 12,
    zIndex: 5,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoomControls: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoomTop: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderWidth: 0, // Reset since we added border to zoomControls
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 40,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#1f2937',
    fontVariant: ['tabular-nums'],
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.1)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  startBtn: {
    backgroundColor: '#4ade80',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  startText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#122017',
    letterSpacing: 1,
  },
  actionSection: {
    gap: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseBtn: {
    flex: 1.2,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resumeBtn: {
    backgroundColor: '#4ade80',
  },
  pauseText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4ade80',
  },
  resumeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stopBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  autoPauseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  autoPauseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
