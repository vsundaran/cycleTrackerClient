import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  altitude?: number;
  speed?: number;
}

export interface Ride {
  _id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  distance?: number;
  avgSpeed?: number;
  calories?: number;
  status: 'active' | 'completed';
  route: RoutePoint[];
  createdAt: string;
}

export const useRides = () => {
  return useQuery<Ride[]>({
    queryKey: ['rides'],
    queryFn: async () => {
      const { data } = await api.get('/rides');
      return data;
    },
  });
};

export const useRide = (id: string) => {
  return useQuery<Ride>({
    queryKey: ['ride', id],
    queryFn: async () => {
      const { data } = await api.get(`/rides/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post('/rides', { title });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });
};

export const useUpdateRideCoordinates = () => {
  return useMutation({
    mutationFn: async ({ id, coordinates }: { id: string, coordinates: RoutePoint[] }) => {
      const { data } = await api.put(`/rides/${id}/coordinates`, { coordinates });
      return data;
    },
  });
};

export const useEndRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stats }: { id: string, stats: any }) => {
      const { data } = await api.put(`/rides/${id}/end`, stats);
      return data;
    },
    onSuccess: (data) => {
        // Invalidate 'rides' list and the specific 'ride' to ensure summary gets fresh data
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['ride'] }); 
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
