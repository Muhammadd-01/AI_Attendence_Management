import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const colors = {
  Present: { bg: '#064e3b', text: '#34d399' },
  Late: { bg: '#78350f', text: '#fbbf24' },
  Absent: { bg: '#7f1d1d', text: '#f87171' },
  'Half Day': { bg: '#1e3a5f', text: '#60a5fa' },
};

export default function StatusBadge({ status = 'Present' }) {
  const c = colors[status] || colors.Present;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>  
      <Text style={[styles.text, { color: c.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  text: { fontSize: 11, fontWeight: '700' },
});
