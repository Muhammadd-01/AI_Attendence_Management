import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getStudentAttendance } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';

export default function StudentPortalScreen() {
  const { user } = useApp();
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const studentId = user?.student_id || user?.id || '';

  const load = async () => {
    if (!studentId) return;
    try {
      const d = await getStudentAttendance(studentId);
      setRecords(Array.isArray(d) ? d : []);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const present = records.filter(r => r.status === 'Present').length;
  const late = records.filter(r => r.status === 'Late').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const total = records.length || 1;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <Text style={styles.title}>My Attendance</Text>
      <Text style={styles.sub}>{user?.name || 'Student'} • {studentId}</Text>

      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <StatCard title="Present Days" value={present} icon="✅" color="#22c55e" />
          <StatCard title="Late Days" value={late} icon="⏰" color="#f59e0b" />
        </View>
        <View style={styles.gridCol}>
          <StatCard title="Absent Days" value={absent} icon="❌" color="#ef4444" />
          <StatCard title="Rate" value={`${Math.round((present / total) * 100)}%`} icon="📊" color="#6366f1" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>History</Text>
      {records.length === 0 ? (
        <Text style={styles.empty}>No attendance records found.</Text>
      ) : (
        records.slice(0, 50).map((r, i) => (
          <View key={i} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowDate}>{r.date}</Text>
              <Text style={styles.rowTime}>In: {r.check_in_time || '—'} | Out: {r.check_out_time || '—'}</Text>
            </View>
            <StatusBadge status={r.status || 'Present'} />
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginTop: 8 },
  sub: { fontSize: 13, color: '#94a3b8', marginBottom: 16, marginTop: 4 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  gridCol: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 30 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8 },
  rowDate: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  rowTime: { fontSize: 11, color: '#64748b', marginTop: 2 },
});
