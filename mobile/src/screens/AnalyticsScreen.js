import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardStats, getTodayAttendance } from '../services/api';
import StatCard from '../components/StatCard';

export default function AnalyticsScreen() {
  const [stats, setStats] = useState({});
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, r] = await Promise.allSettled([getDashboardStats(), getTodayAttendance()]);
      if (s.status === 'fulfilled') setStats(s.value);
      if (r.status === 'fulfilled') setRecords(Array.isArray(r.value) ? r.value : []);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const teachers = records.filter(r => r.person_type === 'teacher' || String(r.student_id).startsWith('TCH'));
  const students = records.filter(r => r.person_type !== 'teacher' && !String(r.student_id).startsWith('TCH'));
  const present = records.filter(r => r.status === 'Present').length;
  const late = records.filter(r => r.status === 'Late').length;
  const halfDay = records.filter(r => r.status === 'Half Day').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <Text style={styles.title}>📊 Analytics</Text>

      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <StatCard title="Total Students" value={stats.total_students ?? 0} icon="🎓" color="#22c55e" />
          <StatCard title="Total Teachers" value={stats.total_teachers ?? 0} icon="👨‍🏫" color="#0ea5e9" />
        </View>
        <View style={styles.gridCol}>
          <StatCard title="Present Today" value={present} icon="✅" color="#6366f1" />
          <StatCard title="Late Today" value={late} icon="⏰" color="#f59e0b" />
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Breakdown</Text>
        <SummaryRow label="Students Present" value={students.length} total={stats.total_students || 0} color="#22c55e" />
        <SummaryRow label="Teachers Present" value={teachers.length} total={stats.total_teachers || 0} color="#0ea5e9" />
        <SummaryRow label="On Time" value={present} total={records.length || 1} color="#6366f1" />
        <SummaryRow label="Late Arrivals" value={late} total={records.length || 1} color="#f59e0b" />
        <SummaryRow label="Half Day" value={halfDay} total={records.length || 1} color="#ef4444" />
      </View>

      {/* Attendance Rate */}
      <View style={styles.rateCard}>
        <Text style={styles.rateTitle}>Overall Attendance Rate</Text>
        <Text style={styles.rateValue}>{stats.attendance_rate ? `${Math.round(stats.attendance_rate)}%` : '—'}</Text>
        <View style={styles.rateBar}>
          <View style={[styles.rateBarFill, { width: `${Math.min(stats.attendance_rate || 0, 100)}%` }]} />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SummaryRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={summaryStyles.row}>
      <View style={[summaryStyles.dot, { backgroundColor: color }]} />
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}/{total}</Text>
      <Text style={[summaryStyles.pct, { color }]}>{pct}%</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  label: { flex: 1, color: '#94a3b8', fontSize: 13 },
  value: { color: '#f1f5f9', fontWeight: '600', fontSize: 13, marginRight: 12 },
  pct: { fontWeight: '800', fontSize: 13, width: 40, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginTop: 8, marginBottom: 16 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  gridCol: { flex: 1 },
  summaryCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
  rateCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  rateTitle: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  rateValue: { fontSize: 48, fontWeight: '900', color: '#6366f1', marginVertical: 8 },
  rateBar: { width: '100%', height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  rateBarFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
});
