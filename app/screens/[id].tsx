import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import Dashboard from '../../components/Screens/Dashboard';
import ActiveRideTracking from '../../components/Screens/ActiveRideTracking';
import ActiveRideRouteHighlight from '../../components/Screens/ActiveRideRouteHighlight';
import RideSummary from '../../components/Screens/RideSummary';
import SignUp from '../../components/Screens/SignUp';
import SignIn from '../../components/Screens/SignIn';
import ActivitiesList from '../../components/Screens/ActivitiesList';
import ProfileHeader from '../../components/Screens/ProfileHeader';
import RideTrackingNotStarted from '../../components/Screens/RideTrackingNotStarted';

const screenMap: { [key: string]: React.ComponentType } = {
  'dashboard': Dashboard,
  'active-ride': ActiveRideTracking,
  'route-highlight': ActiveRideRouteHighlight,
  'ride-summary': RideSummary,
  'sign-up': SignUp,
  'sign-in': SignIn,
  'activities-list': ActivitiesList,
  'profile-header': ProfileHeader,
  'ride-not-started': RideTrackingNotStarted,
};

export default function ScreenRenderer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ScreenComponent = screenMap[id as string];

  if (!ScreenComponent) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: id, headerShown: false }} />
      <ScreenComponent />
    </>
  );
}
