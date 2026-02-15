import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RideStatus = 'not_started' | 'active' | 'paused';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RideState {
  rideId: string | null;
  status: RideStatus;
  startTime: number | null;
  distance: number; // in km
  routeCoordinates: Coordinate[];
  currentSpeed: number; // in km/h
  lastLocation: Coordinate | null;
  
  // Actions
  startRide: (rideId: string) => void;
  pauseRide: () => void;
  resumeRide: () => void;
  stopRide: () => void;
  updateTrackingData: (data: Partial<Pick<RideState, 'distance' | 'currentSpeed' | 'lastLocation' | 'routeCoordinates'>>) => void;
  resetRide: () => void;
}

export const useRideStore = create<RideState>()(
  persist(
    (set) => ({
      rideId: null,
      status: 'not_started',
      startTime: null,
      distance: 0,
      routeCoordinates: [],
      currentSpeed: 0,
      lastLocation: null,

      startRide: (rideId) => set({
        rideId,
        status: 'active',
        startTime: Date.now(),
        distance: 0,
        routeCoordinates: [],
        currentSpeed: 0,
        lastLocation: null,
      }),

      pauseRide: () => set({ status: 'paused' }),

      resumeRide: () => set({ status: 'active' }),

      stopRide: () => set({ status: 'not_started' }),

      updateTrackingData: (data) => set((state) => ({
        ...state,
        ...data,
      })),

      resetRide: () => set({
        rideId: null,
        status: 'not_started',
        startTime: null,
        distance: 0,
        routeCoordinates: [],
        currentSpeed: 0,
        lastLocation: null,
      }),
    }),
    {
      name: 'ride-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
