import { authService } from '@/services/authService';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !phone || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.register(email, password, name, phone);
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.5)" />
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          keyboardVerticalOffset={0}
        >
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.subtitle}>Join us and start your journey</Text>

              {/* Your name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'name' && styles.inputWrapperFocused
                ]}>
                  <Feather name="user" size={20} color="#6366F1" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Phone number */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'phone' && styles.inputWrapperFocused
                ]}>
                  <Feather name="smartphone" size={20} color="#6366F1" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'email' && styles.inputWrapperFocused
                ]}>
                  <Feather name="mail" size={20} color="#6366F1" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              {/* Set password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'password' && styles.inputWrapperFocused
                ]}>
                  <Feather name="lock" size={20} color="#6366F1" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Set password again */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'confirmPassword' && styles.inputWrapperFocused
                ]}>
                  <Feather name="lock" size={20} color="#6366F1" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleCreate}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Feather 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreate}
                activeOpacity={0.9}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5', '#4338CA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.createButtonText}>Create Account</Text>
                      <Feather name="arrow-right" size={20} color="#FFF" style={styles.buttonIcon} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                  <View style={styles.socialIconWrapper}>
                    <Feather name="chrome" size={24} color="#DB4437" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                  <View style={styles.socialIconWrapper}>
                    <Feather name="facebook" size={24} color="#1877F2" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                  <View style={styles.socialIconWrapper}>
                    <Feather name="github" size={24} color="#181717" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Sign in link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signInLink}>Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 30 : 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#F9FAFB',
  },
  inputWrapperFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    paddingVertical: Platform.OS === 'android' ? 8 : 0,
  },
  createButton: {
    marginTop: 20,
    marginBottom: 18,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  socialIconWrapper: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
});