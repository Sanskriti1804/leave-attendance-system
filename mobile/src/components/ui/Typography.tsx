import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption' | 'button';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = theme.colors.text,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: theme.typography.sizes.xxl,
          fontWeight: theme.typography.weights.bold,
        };
      case 'h2':
        return {
          fontSize: theme.typography.sizes.xl,
          fontWeight: theme.typography.weights.semibold,
        };
      case 'caption':
        return {
          fontSize: theme.typography.sizes.xs,
          fontWeight: theme.typography.weights.regular,
          color: theme.colors.textSecondary,
        };
      case 'button':
        return {
          fontSize: theme.typography.sizes.m,
          fontWeight: theme.typography.weights.semibold,
        };
      case 'body':
      default:
        return {
          fontSize: theme.typography.sizes.m,
          fontWeight: theme.typography.weights.regular,
        };
    }
  };

  return (
    <Text
      style={[
        getVariantStyles(),
        { color, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
