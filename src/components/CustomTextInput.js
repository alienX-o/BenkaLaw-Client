import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { BorderRadius, Spacing } from '../constants/theme/matrics';
import { FontSize } from '../constants/theme/typography';
import colors from '../constants/colors'

const CustomTextInput = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
  ...rest
}) => {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.text_light_color}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
};

export default CustomTextInput;

const styles = StyleSheet.create({
  inputWrapper: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: colors.light_color_opacity,
    color: colors.text_dark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.md,
  },
});
