import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  safeArea = true,
}) => {
  const Container = safeArea ? SafeAreaView : React.Fragment;
  const containerProps = safeArea ? { style: [styles.container, style] } : {};

  return (
    <Container {...containerProps}>
      <KeyboardAvoidingView
        style={[styles.keyboardAvoidingView, !safeArea && style]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});
