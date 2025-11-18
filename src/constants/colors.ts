// src/constants/colors.ts

import { Appearance } from 'react-native';

const colorScheme = Appearance.getColorScheme(); // 'light' or 'dark'

/**
 * Common colors shared by both light and dark themes
 */
const shared = {
  transparent: '#00000000',
  danger: '#db0000',
  green: '#0D842B',
};

/**
 * Light Theme Colors
 */
const lightColors = {
  PrimaryBlue: '#4B5E9E',
  PrimaryGreen: '#85AB8F',
  PrimaryDarkBlue: '#0646A4',
  SecondaryLightBlue: '#70CDF2',
  MidGray: '#989898',
  DarkGray: '#181818',
  Background_Blue: '#D4F1FD',
  LightBG: '#F9F9F9',
  LightGray: '#E3E3E3',
  Light_Blue: '#70CDF2',
  midLightBlue: '#D4F1FD',
  Dark_Blue: '#0646A4',
  Business_Name_Color: '#648eaa',
  Background_Color: '#FFFFFF',
  Slogan_Color: '#B19DD0',
  Icon_Color: '#989898',
  Quaternary_Color: '#35185A',
  primary_color: '#0091EA',
  dark_primary_color: '#0068A8',
  primary_color_opacity: '#0091EAD1',
  black_color: '#0e0e0e',
  text_light_color: '#575757',
  border_light_color: '#EFEFEF',
  light_color_opacity: '#EFEFEF71',
  border_color: '#b0b0b0',
  base_color: '#ffffff',
  popup_background: '#393939ad',
  light_gray: '#d0d0d0',
  dark_grey: '#5a6667',
  text_dark: '#1D3947',
  text_light: '#5F636C',
  background_color_dark: '#007DCAA8',
  background_color_light: '#D3E2E7',
  cardBackground: '#E8EFF1',
  highlightColor: '#E6F2F6',
  gradientColor1: 'rgba(177, 213, 226, 0.88)',
  gradientColor2: '#489FD4',
  gradientColor3: '#268BC8',
  light_yellow_background: '#EBFAE3',
  yellow_background: '#FDF6B2',
  text_dark_brown: '#8E4B10',
  border_outline: '#0074BB',
  splash_bg: '#E8EFF1',
  visit_background: '#f5f5f5',

  input_background: 'rgba(255, 255, 255, 0.2)',
};

/**
 * Dark Theme Colors
 */
const darkColors: typeof lightColors = {
  ...lightColors,
  Background_Color: '#121212',
  base_color: '#1c1c1c',
  text_light_color: '#B0B0B0',
  text_dark: '#ffffff',
  cardBackground: '#242424',
  border_color: '#333',
  popup_background: '#00000099',
  background_color_light: '#1A1A1A',
  background_color_dark: '#2A2A2A',
};

/**
 * Combined Theme with dynamic selection
 */
const colors = {
  ...shared,
  ...(colorScheme === 'dark' ? darkColors : lightColors),
};

export default colors;
