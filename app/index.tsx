import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

const screens = [
  { id: 'active-ride', title: 'Active Ride Tracking' },
  { id: 'route-highlight', title: 'Active Ride with Route Highlight' },
  { id: 'ride-summary', title: 'Ride Summary' },
  { id: 'sign-up', title: 'Sign Up (No Nav)' },
  { id: 'sign-in', title: 'Sign In (No Social)' },
  { id: 'activities-list', title: 'Activities List (No Filter Icon)' },
  { id: 'profile-header', title: 'Refined Profile Header' },
  { id: 'dashboard', title: 'Dashboard with Logo Avatar' },
  { id: 'ride-not-started', title: 'Ride Tracking - Not Started' },
];

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cycle Tracker Screens</Text>
        <Text style={styles.subtitle}>Select a screen to view implementation</Text>
      </View>
      <FlatList
        data={screens}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/screens/${item.id}`} asChild>
            <TouchableOpacity style={styles.item}>
              <Text style={styles.itemText}>{item.title}</Text>
              <ChevronRight color="#CBD5E0" size={20} />
            </TouchableOpacity>
          </Link>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
});
