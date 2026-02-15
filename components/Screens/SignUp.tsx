import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, User, Mail, Lock, Eye, EyeOff, Check, ArrowRight } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AnimatedInput } from '../../animations/components/AnimatedInput';
import { AnimatedPressable } from '../../animations/components/AnimatedPressable';

export default function SignUp({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!acceptedPrivacy) {
      setError('You must agree to the Privacy Policy');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { token, user } = response.data;
      await login(token, user);
      onNavigate('Dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Decoration */}
      <View style={styles.bgDecorationTop}>
        <Svg width="400" height="400" viewBox="0 0 400 400">
          <Circle cx="400" cy="0" r="300" stroke="#4ade80" strokeWidth="40" opacity="0.1" fill="none" />
          <Circle cx="400" cy="0" r="200" stroke="#4ade80" strokeWidth="20" opacity="0.1" fill="none" />
        </Svg>
      </View>
      <View style={styles.bgDecorationBottom}>
        <Svg width="300" height="300" viewBox="0 0 300 300">
          <Path d="M-50 300C-50 150 100 0 300 0" stroke="#4ade80" strokeWidth="60" opacity="0.1" fill="none" strokeLinecap="round" />
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
                <Bike size={48} color="#4ade80" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the community and start tracking your rides today.</Text>
            </View>

            <View style={styles.formCard}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <AnimatedInput
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                leftElement={<User size={20} color="#94a3b8" />}
              />

              <AnimatedInput
                label="Email Address"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                leftElement={<Mail size={20} color="#94a3b8" />}
              />

              <AnimatedInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                leftElement={<Lock size={20} color="#94a3b8" />}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                  </TouchableOpacity>
                }
              />

               <TouchableOpacity 
                style={styles.termsContainer} 
                onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptedPrivacy && styles.checkboxActive]}>
                  {acceptedPrivacy && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.termsText}>
                  By signing up, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
                </Text>
              </TouchableOpacity>

              <AnimatedPressable 
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSignUp}
                disabled={loading}
                scaleActive={0.96}
              >
                <Text style={styles.submitBtnText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
              </AnimatedPressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => onNavigate('SignIn')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
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
  bgDecorationTop: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  bgDecorationBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  scrollContent: {
    padding: 24,
    minHeight: '100%',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  linkText: {
    color: '#4ade80',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#4ade80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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