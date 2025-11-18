import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';
import { FontSize, Spacing } from '../constants/theme';

/**
 * A centered loading indicator component.
 */
export const CenteredLoader = () => (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color={colors.PrimaryGreen} />
  </View>
);

/**
 * A component to display when a list is empty.
 * @param {{ text: string }} props - The component props.
 * @param {string} props.text - The message to display.
 */
export const EmptyListComponent = ({ text }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyListText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyListText: {
    fontSize: FontSize.md,
    color: colors.dark_gray,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
});
