import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ title, value, icon, color = '#6366f1', sub }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>  
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.value}>{value ?? '—'}</Text>
          <Text style={styles.title}>{title}</Text>
          {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28 },
  value: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  title: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  sub: { fontSize: 11, color: '#64748b', marginTop: 2 },
});
