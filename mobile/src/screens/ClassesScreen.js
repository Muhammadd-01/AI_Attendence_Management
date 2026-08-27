import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getClasses } from '../services/api';

export default function ClassesScreen() {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const d = await getClasses(); setClasses(Array.isArray(d) ? d : []); } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = classes.filter(c => {
    const name = typeof c === 'string' ? c : c.name || c.class_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <Text style={styles.title}>Classes ({classes.length})</Text>

      <TextInput style={styles.search} placeholder="Search classes..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />

      {filtered.map((c, i) => {
        const name = typeof c === 'string' ? c : c.name || c.class_name || `Class ${i + 1}`;
        const count = typeof c === 'object' ? c.student_count || c.count || 0 : 0;
        const teacher = typeof c === 'object' ? c.teacher_name || c.teacher || '' : '';
        return (
          <View key={i} style={styles.row}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>🏫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{name}</Text>
              {teacher ? <Text style={styles.rowSub}>Teacher: {teacher}</Text> : null}
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}</Text>
              <Text style={styles.countLabel}>Students</Text>
            </View>
          </View>
        );
      })}

      {filtered.length === 0 && <Text style={styles.empty}>No classes found.</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginBottom: 12, marginTop: 8 },
  search: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 12, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#312e81', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 22 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  rowSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  countBadge: { alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  countText: { fontSize: 18, fontWeight: '800', color: '#6366f1' },
  countLabel: { fontSize: 9, color: '#94a3b8' },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 },
});
