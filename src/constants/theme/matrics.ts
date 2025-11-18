import {moderateScale, verticalScale} from 'react-native-size-matters';

export const Spacing = {
  none: 0,
  xxs: moderateScale(2),
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(40),
  xxxl: moderateScale(64),
};

export const BorderRadius = {
  none: 0,
  xs: moderateScale(2),
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(16),
  xl: moderateScale(24),
  pill: moderateScale(999),
  full: 9999,
};

export const IconSize = {
  xs: moderateScale(12),
  sm: moderateScale(16),
  md: moderateScale(24),
  lg: moderateScale(32),
  xl: moderateScale(48),
  xxl: moderateScale(64),
};

export const BorderWidth = {
  hairline: 0.5,
  thin: 1,
  regular: 2,
  thick: 4,
};

export const Layout = {
  headerHeight: verticalScale(60),
  footerHeight: verticalScale(56),
  tabBarHeight: verticalScale(54),
  inputHeight: verticalScale(44),
  buttonHeight: verticalScale(42),
  cardHeight: verticalScale(120),
  avatarSm: moderateScale(32),
  avatarMd: moderateScale(48),
  avatarLg: moderateScale(72),
  imageHeightLg: verticalScale(150),
};

export const Shadow = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
};

export const ZIndex = {
  background: -1,
  base: 0,
  dropdown: 10,
  modal: 100,
  loader: 999,
};

export const Grid = {
  gutter: Spacing.sm,
  column: moderateScale(24),
  rowGap: Spacing.md,
};
