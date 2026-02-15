import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Timer, Gauge, Flame, Bolt } from 'lucide-react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useRide } from '../../hooks/useRides';

export default function RideSummary({ onNavigate, rideId = 'latest' }: { onNavigate: (screen: string) => void, rideId?: string }) {
  const { data: ride, isLoading } = useRide(rideId);

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

  const getInitialRegion = () => {
    if (!ride.route || ride.route.length === 0) {
      return {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const latitudes = ride.route.map(p => p.latitude);
    const longitudes = ride.route.map(p => p.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
    };
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
              style={styles.map}
              initialRegion={getInitialRegion()}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {ride.route && ride.route.length > 0 && (
                <Polyline
                  coordinates={ride.route}
                  strokeColor="#4ade80"
                  strokeWidth={5}
                />
              )}
            </MapView>
            <View style={styles.mapOverlay} />
          </View>
        </View>

        <View style={styles.primaryMetricCard}>
          <Text style={styles.primaryLabel}>TOTAL DISTANCE</Text>
          <Text style={styles.primaryValue}>
            {ride.distance?.toFixed(1) || '0.0'} <Text style={styles.primaryUnit}>KM</Text>
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => onNavigate('Activities')}>
            <Text style={styles.primaryBtnText}>View All Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate('Dashboard')}>
            <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
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
});