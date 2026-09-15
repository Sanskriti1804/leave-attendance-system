import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function UIFallbackIndicator({ style }: { style?: any }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>API DATA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ba1a1a',
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  text: {
    color: '#ba1a1a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});
