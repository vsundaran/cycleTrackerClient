import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Flame, Map as MapIcon, Timer, Gauge, ArrowRight } from 'lucide-react-native';
import { useRides } from '../../hooks/useRides';
import { useProfile } from '../../hooks/useUser';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';
import { NoActivityCard } from '../ui/NoActivityCard';
import { AnimatedCard } from '../../animations/components/AnimatedCard';
import { AnimatedPressable } from '../../animations/components/AnimatedPressable';
import { RideRouteMap } from '../ui/RideRouteMap';

export default function DashboardScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { user: authUser } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: rides, isLoading: isRidesLoading } = useRides();

  const lastRides = rides ? rides.slice(0, 2) : [];
  const stats = profile?.lifetimeStats || {
    totalDistance: 0,
    totalDuration: 0,
    totalCalories: 0,
    avgSpeed: 0,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarIconBg}>
            <Bike size={24} color="#4ade80" />
          </View>
        </View>
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeSubtitle}>Welcome back</Text>
          <Text style={styles.welcomeTitle}>Hello, {authUser?.name || 'Alex'}</Text>
        </View>
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View style={styles.statsGrid}>
          {/* Calories Card */}
          <AnimatedCard style={styles.statCard} index={0} delay={100}>
            <View style={styles.statHeader}>
              <Flame size={20} color="#f97316" />
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            {isProfileLoading ? (
              <Skeleton width={60} height={24} />
            ) : (
              <Text style={styles.statValue}>
                {Math.round(stats.totalCalories)} <Text style={{ fontSize: 14, fontWeight: '400', color: '#94a3b8' }}>kcal</Text>
              </Text>
            )}
          </AnimatedCard>

          {/* Distance Card */}
          <AnimatedCard style={styles.statCard} index={1} delay={100}>
            <View style={styles.statHeader}>
              <MapIcon size={20} color="#3b82f6" />
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            {isProfileLoading ? (
              <Skeleton width={60} height={24} />
            ) : (
              <Text style={styles.statValue}>
                {stats.totalDistance.toFixed(1)} <Text style={{ fontSize: 14, fontWeight: '400', color: '#94a3b8' }}>km</Text>
              </Text>
            )}
          </AnimatedCard>

          {/* Duration Card */}
          <AnimatedCard style={styles.statCard} index={2} delay={100}>
            <View style={styles.statHeader}>
              <Timer size={20} color="#4ade80" />
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            {isProfileLoading ? (
              <Skeleton width={60} height={24} />
            ) : (
              <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
            )}
          </AnimatedCard>

          {/* Avg Speed Card */}
          <AnimatedCard style={styles.statCard} index={3} delay={100}>
            <View style={styles.statHeader}>
              <Gauge size={20} color="#a855f7" />
              <Text style={styles.statLabel}>Avg Speed</Text>
            </View>
            {isProfileLoading ? (
              <Skeleton width={60} height={24} />
            ) : (
              <Text style={styles.statValue}>
                {stats.avgSpeed.toFixed(1)} <Text style={{ fontSize: 14, fontWeight: '400', color: '#94a3b8' }}>km/h</Text>
              </Text>
            )}
          </AnimatedCard>
        </View>

        {/* Start New Ride Button */}
        <AnimatedPressable 
          style={styles.ctaButton} 
          scaleActive={0.96}
          onPress={() => onNavigate('NewRide')}
        >
          <View style={styles.ctaContent}>
            <View style={styles.ctaIconBg}>
              <Bike size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.ctaText}>Start New Ride</Text>
          </View>
          <ArrowRight size={24} color="#122017" />
        </AnimatedPressable>

        {/* Activity Preview */}
        <View style={styles.lastActivitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LAST ACTIVITIES</Text>
            <AnimatedPressable onPress={() => onNavigate('Activities')}>
              <Text style={styles.seeAllText}>See all</Text>
            </AnimatedPressable>
          </View>
        
          {isRidesLoading ? (
            <Skeleton height={128} borderRadius={16} />
          ) : lastRides.length > 0 ? (
            <View style={{ gap: 12 }}>
              {lastRides.map((ride, index) => (
                <AnimatedCard 
                  key={ride._id || index} 
                  index={index + 4} // Stagger after stats
                  onPress={() => onNavigate('RideSummary')}
                  style={{ borderRadius: 16, overflow: 'hidden', height: 128, backgroundColor: '#f1f5f9' }}
                >
                  {ride.status === 'active' ? (
                     <View style={[StyleSheet.absoluteFill, { backgroundColor: '#122017', alignItems: 'center', justifyContent: 'center' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' }} />
                            <Text style={{ color: '#4ade80', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 }}>LIVE TRACKING</Text>
                        </View>
                        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Tap to view details</Text>
                     </View>
                  ) : (
                    <>
                      {/* @ts-ignore */}
                      <RideRouteMap route={ride.route} style={StyleSheet.absoluteFillObject} />
                      <View style={styles.activityOverlay} />
                    </>
                  )}
                  
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityDate}>
                      {new Date(ride.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.activityName}>{ride.title}</Text>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          ) : (
            <NoActivityCard />
          )}
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
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    overflow: 'hidden',
  },
  avatarIconBg: {
    flex: 1,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeSubtitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  main: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  ctaButton: {
    marginTop: 32,
    backgroundColor: '#4ade80',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ctaIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#122017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#122017',
  },
  lastActivitySection: {
    marginTop: 32,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 2,
    marginBottom: 0,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  activityCard: {
    // Removed specific activityCard style as it's now handled by AnimatedCard container + absolute children
  },
  activityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  activityInfo: {
    zIndex: 2,
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  activityDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  activityName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});