import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Timer, Gauge, Flame, Bolt, Square } from 'lucide-react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { useRide, useEndRide } from '../../hooks/useRides';
import { stopBackgroundTracking } from '../../services/LocationService';
import { CustomModal } from '../ui/CustomModal';

export default function RideSummary({ onNavigate, rideId = 'latest' }: { onNavigate: (screen: string, params?: any) => void, rideId?: string }) {
  const { data: ride, isLoading, refetch } = useRide(rideId);
  const endRideMutation = useEndRide();

  const [showStopModal, setShowStopModal] = React.useState(false);
  const mapRef = React.useRef<MapView>(null);

  React.useEffect(() => {
    if (ride?.route && ride.route.length > 0 && mapRef.current) {
      // Small timeout to ensure map is ready
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(ride.route, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [ride]);

  // Helper functions
  const calculateTotalDistance = (route: any[]) => {
    if (!route || route.length < 2) return 0;
    
    let totalDist = 0;
    const R = 6371; // km

    for (let i = 1; i < route.length; i++) {
        const p1 = route[i-1];
        const p2 = route[i];
        
        const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
        const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        totalDist += R * c;
    }
    return totalDist;
  };

  const dynamicDistance = React.useMemo(() => {
    if (!ride) return 0;
    // If ride has distance, use it. Otherwise calculate from route.
    if (ride.distance && ride.distance > 0) return ride.distance;
    return calculateTotalDistance(ride.route);
  }, [ride]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStopModal(true);
  };

  const confirmStop = async () => {
    if (!ride) return;
    setShowStopModal(false);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await stopBackgroundTracking();

      const stats = {
        distance: dynamicDistance,
        duration: ride.duration || 0,
        avgSpeed: ride.avgSpeed || 0,
        calories: ride.calories || (dynamicDistance * 50),
      };

      await endRideMutation.mutateAsync({ id: ride._id, stats });
      refetch(); // Refresh data to show completed status
    } catch (err) {
      console.error('Failed to end ride from summary:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Ride not found</Text>
        <TouchableOpacity onPress={() => onNavigate('Dashboard')}>
          <Text style={{ color: '#4ade80', marginTop: 10 }}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Activities')}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ride.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        <View style={styles.mapContainer}>
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {ride.route && ride.route.length > 0 && (
                <Polyline
                  coordinates={ride.route}
                  strokeColor="#4ade80"
                  strokeWidth={6}
                />
              )}
            </MapView>
            <View style={styles.mapOverlay} />
          </View>
        </View>

        <View style={styles.primaryMetricCard}>
          <Text style={styles.primaryLabel}>TOTAL DISTANCE</Text>
          <Text style={styles.primaryValue}>
            {dynamicDistance.toFixed(2)} <Text style={styles.primaryUnit}>KM</Text>
          </Text>
          <View style={styles.dateSection}>
            <Calendar size={14} color="#64748b" />
            <Text style={styles.dateText}>
              {new Date(ride.startTime).toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View style={styles.statIconBg}>
                <Timer size={18} color="#4ade80" />
              </View>
              <Text style={styles.statLabel}>DURATION</Text>
            </View>
            <Text style={styles.statValue}>{formatDuration(ride.duration)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View style={styles.statIconBg}>
                <Gauge size={18} color="#4ade80" />
              </View>
              <Text style={styles.statLabel}>AVG SPEED</Text>
            </View>
            <Text style={styles.statValue}>
              {ride.avgSpeed?.toFixed(1) || '0.0'} <Text style={styles.statUnit}>km/h</Text>
            </Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View style={styles.statIconBg}>
                <Flame size={18} color="#4ade80" />
              </View>
              <Text style={styles.statLabel}>CALORIES</Text>
            </View>
            <Text style={styles.statValue}>
              {Math.round(ride.calories || 0)} <Text style={styles.statUnit}>kcal</Text>
            </Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <View style={styles.statIconBg}>
                <Bolt size={18} color="#4ade80" />
              </View>
              <Text style={styles.statLabel}>STATUS</Text>
            </View>
            <Text style={[styles.statValue, { textTransform: 'capitalize' }]}>{ride.status}</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          {ride.status === 'active' && (
            <TouchableOpacity 
              style={styles.stopActivityBtn} 
              onPress={handleStop}
              disabled={endRideMutation.isPending}
            >
              <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.stopActivityBtnText}>
                {endRideMutation.isPending ? 'Ending...' : 'Stop Activity'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate('Activities')}>
            <Text style={styles.primaryBtnText}>View All Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate('Dashboard')}>
            <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>

        <CustomModal
          isVisible={showStopModal}
          title="Stop Ride?"
          message="Are you sure you want to finish your ride and save your progress?"
          confirmText="Finish"
          onConfirm={confirmStop}
          onCancel={() => setShowStopModal(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 222, 128, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  backBtn: {
    padding: 8,
  },
  main: {
    flex: 1,
  },
  mapContainer: {
    padding: 16,
  },
  mapWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  primaryMetricCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.1)',
    marginBottom: 16,
  },
  primaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4ade80',
    letterSpacing: 2,
    marginBottom: 8,
  },
  primaryValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  primaryUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(31, 41, 55, 0.5)',
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statItem: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.05)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statIconBg: {
    padding: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(31, 41, 55, 0.5)',
  },
  actionSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#4ade80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#122017',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  stopActivityBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stopActivityBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});