import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bike, Edit3, Map as DistanceIcon, Timer, Gauge, Flame, LogOut } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile } from '../../hooks/useUser';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';
import { CustomModal } from '../ui/CustomModal';

export default function ProfileHeader({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user: authUser, logout } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [name, setName] = useState(authUser?.name || 'Alex Rivera');

  // Sync state with profile data when it loads
  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    onNavigate('SignIn');
  };

  const handleSaveName = async () => {
    setIsEditing(false);
    if (name.trim() !== '' && name !== profile?.name) {
      try {
        await updateProfileMutation.mutateAsync({ name: name.trim() });
      } catch (err) {
        console.error('Failed to update name:', err);
        // Revert to old name on error
        setName(profile?.name || authUser?.name || '');
      }
    }
  };


  const stats = profile?.lifetimeStats || {
    totalDistance: 0,
    totalDuration: 0,
    avgSpeed: 0,
    totalCalories: 0
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return { hrs, mins };
  };

  const duration = formatDuration(stats.totalDuration);

  return (
    <SafeAreaView style={styles.container}>
      <CustomModal
        isVisible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        type="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      {/* Header Nav */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Dashboard')}>
          <ArrowLeft size={24} color="#0f1a13" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBg}>
              <Bike size={60} color="#4ade80" />
            </View>
          </View>
          <View style={styles.nameRow}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <>
                <Text style={styles.name}>{name}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Edit3 size={18} color="#94a3b8" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>LIFETIME PERFORMANCE</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <DistanceIcon size={20} color="#4ade80" />
              <View>
                <Text style={styles.statLabel}>Total Distance</Text>
                {isLoading ? (
                  <Skeleton width={60} height={24} />
                ) : (
                  <Text style={styles.statValue}>{stats.totalDistance.toFixed(1)} <Text style={styles.unit}>km</Text></Text>
                )}
              </View>
            </View>
            <View style={styles.statCard}>
              <Timer size={20} color="#4ade80" />
              <View>
                <Text style={styles.statLabel}>Total Duration</Text>
                {isLoading ? (
                  <Skeleton width={80} height={24} />
                ) : (
                  <Text style={styles.statValue}>
                    {duration.hrs}<Text style={styles.unit}>h</Text> {duration.mins}<Text style={styles.unit}>m</Text>
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.statCard}>
              <Gauge size={20} color="#4ade80" />
              <View>
                <Text style={styles.statLabel}>Avg Speed</Text>
                {isLoading ? (
                  <Skeleton width={60} height={24} />
                ) : (
                  <Text style={styles.statValue}>{stats.avgSpeed.toFixed(1)} <Text style={styles.unit}>km/h</Text></Text>
                )}
              </View>
            </View>
            <View style={styles.statCard}>
              <Flame size={20} color="#4ade80" />
              <View>
                <Text style={styles.statLabel}>Total Calories</Text>
                {isLoading ? (
                  <Skeleton width={60} height={24} />
                ) : (
                  <Text style={styles.statValue}>{Math.round(stats.totalCalories || 0)} <Text style={styles.unit}>kcal</Text></Text>
                )}
              </View>
            </View>
          </View>
        </View>


        {/* Logout Action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f1a13',
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    padding: 4,
    marginBottom: 16,
  },
  avatarBg: {
    flex: 1,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f1a13',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f1a13',
    borderBottomWidth: 1,
    borderBottomColor: '#4ade80',
    padding: 0,
    minWidth: 150,
  },
  statsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(15, 26, 19, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.1)',
    gap: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(15, 26, 19, 0.7)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f1a13',
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8f7',
    marginHorizontal: 24,
    marginTop: 40,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.1)',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});