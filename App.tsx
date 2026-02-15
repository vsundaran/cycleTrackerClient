import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Dashboard from './components/Screens/Dashboard';
import ActiveRideRouteHighlight from './components/Screens/ActiveRideRouteHighlight';
import RideSummary from './components/Screens/RideSummary';
import SignUp from './components/Screens/SignUp';
import SignIn from './components/Screens/SignIn';
import ActivitiesList from './components/Screens/ActivitiesList';
import ProfileHeader from './components/Screens/ProfileHeader';
import RideTracking from './components/Screens/RideTracking';
import BottomNav from './components/BottomNav';

import { ScreenTransition } from './animations/components/ScreenTransition';

const SCREEN_MAP: { [key: string]: React.ComponentType<any> } = {
  'Dashboard': Dashboard,
  'ActiveRide': RideTracking,
  'RouteHighlight': ActiveRideRouteHighlight,
  'RideSummary': RideSummary,
  'SignUp': SignUp,
  'SignIn': SignIn,
  'Activities': ActivitiesList,
  'Profile': ProfileHeader,
  'NewRide': RideTracking,
};

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // If user is already logged in, we are already on Dashboard by default,
      // but we could explicitly set it or handle specific landing logic here.
      setCurrentScreen('Dashboard');
    } else if (!isLoading && !user) {
      setCurrentScreen('SignIn');
    }
  }, [user, isLoading]);

  const CurrentScreenComponent = SCREEN_MAP[currentScreen];
  const showBottomNav = !['SignUp', 'SignIn'].includes(currentScreen);

  const navigate = (screenName: string) => {
    if (SCREEN_MAP[screenName]) {
      setCurrentScreen(screenName);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Render the current screen */}
      <View style={{ flex: 1 }}>
        <ScreenTransition key={currentScreen}>
          <CurrentScreenComponent onNavigate={navigate} />
        </ScreenTransition>
      </View>

      {/* Global Bottom Navigation */}
      {showBottomNav && (
        <BottomNav currentScreen={currentScreen} onNavigate={navigate} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
