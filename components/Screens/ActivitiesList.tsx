import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bike, Plus } from 'lucide-react-native';
import { useRides, Ride } from '../../hooks/useRides';
import { Skeleton } from '../ui/Skeleton';
import { NoActivityCard } from '../ui/NoActivityCard';
import { AnimatedCard } from '../../animations/components/AnimatedCard';
import { AnimatedPressable } from '../../animations/components/AnimatedPressable';

const dummyActivities = [
  {
    id: '1',
    title: 'Morning City Loop',
    date: 'Oct 12, 2023 • 08:30 AM',
    relativeDate: 'Yesterday',
    distance: '25.4 km',
    time: '1h 12m',
    avgSpeed: '21.2 km/h',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdYG9cQdQvNsJ9f1N_iDa29eDnW0k9TqikNOjoli04Kb34-Xd6M88xkRDhaXyaIv4StO-byUGfirCBeuDdCSE-kUTtNgca8VtQS9jz09NrBLH2bWjgFozxxFvaWCnH6o1zczz0G-PGnDKoPvQ5gMhmNmP62P1uKlq7HC2BVnw3RamWqSisFSGTgms26szDW9AHyyDNlWoiJwyVSuP85rxnA9u412WJxbcuzLpvV0gq_kbJg98n0J-qOFvzHr_t8yu_GqP-1zaLlo2B',
  },
  {
    id: '2',
    title: 'Coastal Sunset Sprint',
    date: 'Oct 10, 2023 • 05:45 PM',
    relativeDate: '3 Days Ago',
    distance: '42.1 km',
    time: '2h 05m',
    avgSpeed: '24.8 km/h',
  },
  {
    id: '3',
    title: 'Mountain Climb Test',
    date: 'Oct 08, 2023 • 07:15 AM',
    relativeDate: 'Last Week',
    distance: '18.5 km',
    time: '1h 45m',
    avgSpeed: '12.2 km/h',
    elevation: '850m',
  },
  {
    id: '4',
    title: 'Quick Lunch Break Ride',
    date: 'Oct 05, 2023 • 12:30 PM',
    relativeDate: 'Oct 05',
    distance: '12.4 km',
    time: '35 min',
    avgSpeed: '22.1 km/h',
  },
];

export default function ActivitiesList({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { data: rides, isLoading } = useRides();

  // Calculate Monthly Summary and Growth
  const { monthlySummary, growthPercent } = React.useMemo(() => {
    if (!rides) return { monthlySummary: { distance: 0, time: 0 }, growthPercent: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Previous Month Logic
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentDist = 0;
    let currentTime = 0;
    let lastDist = 0;

    rides.forEach(ride => {
      const rideDate = new Date(ride.startTime);
      const rMonth = rideDate.getMonth();
      const rYear = rideDate.getFullYear();

      if (rMonth === currentMonth && rYear === currentYear) {
        currentDist += (ride.distance || 0);
        currentTime += (ride.duration || 0);
      } else if (rMonth === lastMonth && rYear === lastMonthYear) {
        lastDist += (ride.distance || 0);
      }
    });

    // Calculate growth percentage
    let growth = 0;
    if (lastDist > 0) {
      growth = ((currentDist - lastDist) / lastDist) * 100;
    } else if (currentDist > 0) {
      growth = 100; // 100% growth if starting from zero
    }

    return { 
      monthlySummary: { distance: currentDist, time: currentTime }, 
      growthPercent: growth 
    };
  }, [rides]);

  const formatDistance = (dist?: number) => `${dist?.toFixed(1) || '0.0'} km`;
  const formatTime = (seconds?: number) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const renderItem = ({ item, index }: { item: Ride, index: number }) => (
    <AnimatedCard 
      style={styles.activityCard} 
      index={index}
      onPress={() => onNavigate('RideSummary')}
    >
      <View style={styles.cardIndicator} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.activityImage, styles.imagePlaceholder]}>
            <Bike size={24} color="#4ade80" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.relativeDate}>
                {new Date(item.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.activityDate}>
              {new Date(item.startTime).toLocaleString(undefined, { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>DIST</Text>
                <Text style={styles.metricValue}>{formatDistance(item.distance)}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>TIME</Text>
                <Text style={styles.metricValue}>{formatTime(item.duration)}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>AVG</Text>
                <Text style={styles.metricValue}>{item.avgSpeed?.toFixed(1)} km/h</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </AnimatedCard>
  );


  return (
    <SafeAreaView style={styles.container} edges={['right', 'top', 'left']}>
      <View style={styles.header}>
        <AnimatedPressable style={styles.backBtn} onPress={() => onNavigate('Dashboard')} scaleActive={0.8} opacityActive={0.6}>
          <ArrowLeft size={24} color="#1e293b" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>All Activities</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={rides || []}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={() => !isLoading ? <NoActivityCard /> : null}
        ListFooterComponent={() => isLoading ? (
          <View style={{ gap: 16, marginTop: 16 }}>
             {[1,2,3].map(i => <View key={i} style={{ marginHorizontal: 16 }}><Skeleton height={110} borderRadius={16} /></View>)}
          </View>
        ) : null}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            <View style={styles.summarySection}>
              <View style={styles.summaryTitleRow}>
                <Text style={styles.summaryLabel}>THIS MONTH</Text>
                <View style={[
                  styles.badge, 
                  { backgroundColor: growthPercent >= 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                ]}>
                  <Text style={[
                    styles.badgeText, 
                    { color: growthPercent >= 0 ? '#4ade80' : '#ef4444' }
                  ]}>
                    {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(0)}% vs last month
                  </Text>
                </View>
              </View>
              <View style={styles.summaryCards}>
                <AnimatedCard style={styles.summaryCard} index={0} delay={0}>
                  <Text style={styles.summaryCardLabel}>Total Distance</Text>
                  {isLoading ? (
                    <Skeleton width={80} height={24} />
                  ) : (
                    <Text style={styles.summaryCardValue}>{monthlySummary.distance.toFixed(1)} <Text style={styles.unit}>km</Text></Text>
                  )}
                </AnimatedCard>
                <AnimatedCard style={styles.summaryCard} index={1} delay={0}>
                  <Text style={styles.summaryCardLabel}>Total Time</Text>
                  {isLoading ? (
                    <Skeleton width={80} height={24} />
                  ) : (
                    <Text style={styles.summaryCardValue}>{formatTime(monthlySummary.time)}</Text>
                  )}
                </AnimatedCard>

              </View>
            </View>
            <Text style={styles.sectionTitle}>Recent Rides</Text>
          </View>
        )}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <AnimatedPressable style={styles.fab} onPress={() => onNavigate('NewRide')}>
        <Plus size={32} color="#122017" />
      </AnimatedPressable>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(246, 248, 247, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 222, 128, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  backBtn: {
    padding: 8,
  },
  listHeader: {
    padding: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: '#4ade80',
    fontWeight: 'bold',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#94a3b8',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  listPadding: {
    paddingBottom: 80,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#4ade80',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  activityImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  relativeDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activityDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  metric: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});