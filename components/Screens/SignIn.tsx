import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AnimatedInput } from '../../animations/components/AnimatedInput';
import { AnimatedPressable } from '../../animations/components/AnimatedPressable';

export default function SignIn({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [staySignedIn, setStaySignedIn] = React.useState(true);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      await login(token, user, staySignedIn);
      onNavigate('Dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Decoration */}
      <View style={styles.bgDecoration}>
        <Svg width="1000" height="1000" viewBox="0 0 1000 1000">
          <Path d="M0,200 Q250,100 500,200 T1000,200" fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.1" />
          <Path d="M0,400 Q250,300 500,400 T1000,400" fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.1" />
          <Path d="M0,600 Q250,500 500,600 T1000,600" fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.1" />
          <Path d="M0,800 Q250,700 500,800 T1000,800" fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.1" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Bike size={40} color="#4ade80" />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Ready for your next ride?</Text>
            </View>

            <View style={styles.formCard}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <AnimatedInput
                label="Email Address"
                placeholder="rider@cyclingtracker.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={error ? ' ' : undefined} // Trigger shake on error
              />

              <AnimatedInput
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                  </TouchableOpacity>
                }
              />

               <TouchableOpacity 
                style={styles.rememberRow} 
                onPress={() => setStaySignedIn(!staySignedIn)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, staySignedIn && styles.checkboxActive]}>
                  {staySignedIn && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.rememberText}>Stay signed in</Text>
              </TouchableOpacity>

              <AnimatedPressable 
                style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
                onPress={handleLogin}
                disabled={loading}
                scaleActive={0.96}
              >
                <Text style={styles.submitBtnText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
                <ArrowRight size={20} color="#1e293b" />
              </AnimatedPressable>
            </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => onNavigate('SignUp')}>
                  <Text style={styles.footerLink}>Create new account</Text>
                </TouchableOpacity>
              </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f7',
  },
  bgDecoration: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    padding: 24,
    minHeight: '100%',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.1)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  rememberText: {
    fontSize: 14,
    color: 'rgba(15, 23, 42, 0.6)',
  },
  submitBtn: {
    backgroundColor: '#4ade80',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ade80',
  },
});