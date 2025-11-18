import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { BorderRadius, Spacing } from '../../constants/theme/matrics';
import colors from '../../constants/colors';
import { FontSize } from '../../constants/theme';
import VectorIcons from '../../assets/vectorIcons/VectorIcons';
import { api } from '../../utils/http.common';
import { setItem } from '../../utils/asyncStorage';
import { isValidEmail } from '../../utils/Validations';
import { showToast } from '../../utils/toastUtils';
import { checkNetworkConnection } from '../../utils/networkUtils';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // 1. Input Validation
    if (!email.trim() || !password.trim()) {
      showToast(
        'error',
        'Validation Error',
        'Email and password are required.',
      );
      return;
    }
    if (!isValidEmail(email)) {
      showToast(
        'error',
        'Validation Error',
        'Please enter a valid email address.',
      );
      return;
    }

    // 2. Network Connectivity Check
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      return; // Toast is shown inside the utility
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password,
      });
      console.log('login response', response);
      // 3. Handle Successful Response
      if (response && response.accessToken && response.refreshToken) {
        console.log('accessToken', response.accessToken);
        console.log('refreshToken', response.refreshToken);

        await setItem('accessToken', response.accessToken);
        await setItem('refreshToken', response.refreshToken);
        console.log('tokens saved successfully');
        showToast(
          'success',
          'Success',
          response.message || 'Login successful!',
        );

        navigation.replace('MainApp');
      } else {
        showToast(
          'error',
          'Login Failed',
          response.message || 'Invalid credentials.',
        );
      }
    } catch (error) {
      // The api helper logs the detailed error, we just show a user-friendly message
      const errorMessage =
        error.response?.data?.message ||
        'An unexpected error occurred. Please try again.';
      showToast('error', 'Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/splash_background.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.overlay} />
          {/* Top Section */}
          <View style={styles.topSection}>
            <Image
              source={require('../../assets/logos/splash_logo.png')}
              resizeMode="contain"
              style={styles.logo}
            />
            <Text style={styles.welcomeText}>
              Welcome to{'\n'}Benincasa Law{'\n'}Firm
            </Text>
          </View>

          {/* Bottom Section (Form) */}
          <View style={styles.formSection}>
            <View>
              <TextInput
                placeholder="Enter Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Enter Password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <VectorIcons
                    icon="Ionicons"
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.base_color} />
                ) : (
                  <Text style={styles.proceedText}>Proceed</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  topSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.sm * 1.5,
  },
  formSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.sm * 1.5,
    paddingBottom: Spacing.xxl,
  },
  logo: {
    width: '70%',
    height: 150,
    alignSelf: 'flex-start',
  },
  welcomeText: {
    fontSize: FontSize.xxl,
    fontFamily: 'AlanSans-SemiBold',
    color: colors.black_color,
    marginBottom: Spacing.lg,
  },
  input: {
    borderColor: '#B5B5B5',
    backgroundColor: '#FFFFFFCC',
    borderRadius: BorderRadius.md * 1.2,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    fontFamily: 'AlanSans-Bold',
    marginBottom: Spacing.md,
    height: 50,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  passwordInput: {
    borderColor: '#B5B5B5',
    backgroundColor: '#FFFFFFCC',
    borderRadius: BorderRadius.md * 1.2,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    fontFamily: 'AlanSans-Bold',
    height: 50,
    paddingRight: 50, // Make space for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  eyeIconText: {
    fontSize: 20,
  },
  proceedButton: {
    backgroundColor: colors.PrimaryGreen,
    borderRadius: BorderRadius.md * 1.2,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  proceedText: {
    color: colors.base_color,
    fontSize: FontSize.md,
    fontFamily: 'AlanSans-SemiBold',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
});
