import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTodayAttendance, getAttendanceByDate } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function AttendanceScreen() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('all'); // all, students, teachers

  const load = async () => {
    try {
      const d = date === new Date().toISOString().slice(0, 10)
        ? await getTodayAttendance()
        : await getAttendanceByDate(date);
      setRecords(Array.isArray(d) ? d : []);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, [date]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = records.filter(r => {
    const matchSearch = (r.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.student_id || '').toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'all' ||
      (tab === 'teachers' && (r.person_type === 'teacher' || String(r.student_id).startsWith('TCH'))) ||
      (tab === 'students' && r.person_type !== 'teacher' && !String(r.student_id).startsWith('TCH'));
    return matchSearch && matchTab;
  });

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <Text style={styles.title}>Attendance Records</Text>

      {/* Date Selector */}
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => {
          const d = new Date(date);
          d.setDate(d.getDate() - 1);
          setDate(d.toISOString().slice(0, 10));
        }}>
          <Text style={styles.dateBtnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>{date}</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => {
          const d = new Date(date);
          d.setDate(d.getDate() + 1);
          const tomorrow = d.toISOString().slice(0, 10);
          if (tomorrow <= new Date().toISOString().slice(0, 10)) setDate(tomorrow);
        }}>
          <Text style={styles.dateBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['all', 'students', 'teachers'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'all' ? 'All' : t === 'students' ? '🎓 Students' : '👨‍🏫 Teachers'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.search} placeholder="Search..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />

      <Text style={styles.count}>{filtered.length} records</Text>

      {filtered.map((r, i) => (
        <View key={i} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{r.student_name || 'Unknown'}</Text>
            <Text style={styles.rowSub}>{r.student_id} • In: {r.check_in_time || '—'} • Out: {r.check_out_time || '—'}</Text>
            {r.duration_minutes ? <Text style={styles.rowDuration}>{Math.round(r.duration_minutes)} min</Text> : null}
          </View>
          <StatusBadge status={r.status || 'Present'} />
        </View>
      ))}

      {filtered.length === 0 && <Text style={styles.empty}>No attendance records for this date.</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginTop: 8, marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 16 },
  dateBtn: { backgroundColor: '#1e293b', borderRadius: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  dateBtnText: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
  dateText: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontWeight: '600', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  search: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 8, fontSize: 14 },
  count: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  rowSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  rowDuration: { fontSize: 10, color: '#6366f1', marginTop: 2, fontWeight: '600' },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 },
});
