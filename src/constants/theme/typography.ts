import {moderateScale, verticalScale} from 'react-native-size-matters';

export const FontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  md: moderateScale(14),
  lg: moderateScale(18),
  xl: moderateScale(24),
  xxl: moderateScale(32),
  title: moderateScale(36),
  headline: moderateScale(42),
};

export const LineHeight = {
  xs: verticalScale(14),
  sm: verticalScale(16),
  md: verticalScale(20),
  lg: verticalScale(24),
  xl: verticalScale(30),
  xxl: verticalScale(38),
  title: verticalScale(44),
};

export const FontWeight = {
  thin: '100',
  light: '300',
  regular: '400',
  medium: '500',
  bold: '700',
  heavy: '900',
};

export const FontFamily = {
  primary: 'System',
  secondary: 'System',
  bold: 'System',
};
