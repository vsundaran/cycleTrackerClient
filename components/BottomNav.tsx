import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Bike, User } from 'lucide-react-native';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const TABS = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'Activities', label: 'Activities', icon: Bike },
  { id: 'Profile', label: 'Profile', icon: User },
];

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  // Map common screen names to tabs for active state
  const getActiveTab = () => {
    if (['Dashboard'].includes(currentScreen)) return 'Dashboard';
    if (['Activities', 'RideSummary', 'ActiveRide', 'NewRide'].includes(currentScreen)) return 'Activities';
    if (['Profile'].includes(currentScreen)) return 'Profile';
    return '';
  };

  const activeTab = getActiveTab();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { paddingBottom: Math.max(insets.bottom, 16) } // Dynamically adjust based on system navigation bar
    ]}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onNavigate(tab.id)}
          >
            <Icon size={24} color={isActive ? '#4ade80' : '#94a3b8'} />
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderTopWidth: 0, // We'll use color instead of border for simplicity/consistency
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  activeTabLabel: {
    color: '#4ade80',
  },
});
