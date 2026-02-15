import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Settings, Navigation, Plus, Minus, Route, Gauge, Pause, Square, RefreshCcw } from 'lucide-react-native';
import Svg, { Polyline } from 'react-native-svg';

export default function ActiveRideRouteHighlight({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.header}>
          <View style={styles.iconBg}>
            <Bike size={20} color="#4ade80" />
          </View>
          <Text style={styles.headerTitle}>New Ride</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Settings size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content Area (Map + Stats) */}
      <View style={styles.main}>
        {/* Map View */}
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVQVjkXGw8wp1c-Yu1zHQOB0NPfJNfMQhOgZCRXN-JmPgUBMjCLMp3zBAvAxQrET3ULAvwnR_XO6GSysXOPDLpxiVWh0UG47u3DLDzM1xqOBIj6AQflsSNqCq3yquWWlZSrLrLJFKKJo_Z36_DpqMjQMeTbk0TgWZi2hQtY2_YjRHN4l1iw0ULzjPdrHIUp1pAGCab4uyFEWiZAvzcgjWHajD4UsiQu7Q6KIhtMdPs0VpvSjGix8jnAI4MzCT9woi-IDRChbkPlmxq' }}
          style={styles.map}
        >
          {/* SVG Route */}
          <Svg style={styles.routeSvg} viewBox="0 0 100 100">
             <Polyline
              points="30,80 35,70 45,65 55,60 60,50 58,40 65,35 75,32 85,30"
              fill="none"
              stroke="#4ade80"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </Svg>

          {/* Map Overlays */}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapBtn}>
              <Navigation size={24} color="#4ade80" />
            </TouchableOpacity>
            <View style={styles.zoomControls}>
              <TouchableOpacity style={[styles.mapBtn, styles.zoomTop]}>
                <Plus size={24} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mapBtn}>
                <Minus size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.statsOverlay}>
            <View style={styles.statsCard}>
              {/* Timer */}
              <View style={styles.timerSection}>
                <Text style={styles.statLabel}>DURATION</Text>
                <Text style={styles.timerValue}>00:42:15</Text>
              </View>

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Route size={14} color="#4ade80" />
                    <Text style={styles.metricLabel}>DISTANCE</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    12.4 <Text style={styles.metricUnit}>km</Text>
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <View style={styles.metricHeader}>
                    <Gauge size={14} color="#4ade80" />
                    <Text style={styles.metricLabel}>AVG SPEED</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    18.6 <Text style={styles.metricUnit}>km/h</Text>
                  </Text>
                </View>
              </View>

              {/* Main Action Buttons */}
              <View style={styles.actionSection}>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.pauseBtn}>
                    <Text style={styles.pauseText}>PAUSE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stopBtn} onPress={() => onNavigate('RideSummary')}>
                    <Text style={styles.stopText}>STOP</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.autoPauseSection}>
                   <RefreshCcw size={16} color="#94a3b8" />
                   <Text style={styles.autoPauseText}>Auto-pause: On</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeHeader: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 222, 128, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  settingsBtn: {
    width: 40,
    alignItems: 'flex-end',
  },
  main: {
    flex: 1,
  },
  map: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  routeSvg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
    zIndex: 2,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoomControls: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoomTop: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderWidth: 0,
  },
  statsOverlay: {
    padding: 16,
    paddingBottom: 24,
    zIndex: 2,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ade80',
    letterSpacing: 2,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1f2937',
    fontVariant: ['tabular-nums'],
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.1)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4ade80',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  actionSection: {
    gap: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4ade80',
  },
  stopBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  stopText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  autoPauseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  autoPauseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});