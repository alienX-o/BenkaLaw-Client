import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { Spacing } from '../../constants/theme/matrics';
import { FontSize } from '../../constants/theme/typography';
import colors from '../../constants/colors';
import { getItem, setItem } from '../../utils/asyncStorage';

const Splash = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        checkUserSession();
      }, 1000);
    });
  }, []);

  const checkUserSession = async () => {
    const token = await getItem('accessToken');

    if (token) {
      navigation.replace('MainApp');
    } else {
      // If no token, navigate to Login
      navigation.replace('Login');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/splash_background.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Animated.Image
          source={require('../../assets/logos/splash_logo.png')}
          resizeMode="contain"
          style={{
            width: '70%',
            height: 200,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }}
        />
      </View>
    </ImageBackground>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 50% white
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
