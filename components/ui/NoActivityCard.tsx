import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bike } from 'lucide-react-native';

export const NoActivityCard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Bike size={32} color="#94A3B8" />
      </View>
      <Text style={styles.title}>No hits yet!</Text>
      <Text style={styles.subtitle}>Your cycling adventures will appear here once you start your first ride.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
