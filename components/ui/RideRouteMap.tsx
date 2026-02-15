import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { RoutePoint } from '../../hooks/useRides';

interface RideRouteMapProps {
  route: RoutePoint[];
  style?: any;
}

export const RideRouteMap = React.memo(({ route, style }: RideRouteMapProps) => {
  const initialRegion = useMemo(() => {
    if (!route || route.length === 0) {
      return {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const latitudes = route.map(p => p.latitude);
    const longitudes = route.map(p => p.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.005);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.005);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [route]);

  if (!route || route.length === 0) {
    return <View style={[styles.map, styles.placeholder, style]} />;
  }

  return (
    <MapView
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      liteMode={true} // Android optimization for lists
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      pointerEvents="none" // Pass touches through to parent (important for lists)
    >
      <Polyline
        coordinates={route}
        strokeColor="#4ade80"
        strokeWidth={3}
      />
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    backgroundColor: '#f1f5f9',
  },
});
