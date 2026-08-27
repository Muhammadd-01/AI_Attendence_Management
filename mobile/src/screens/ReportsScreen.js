import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTodayAttendance, getAttendanceByDate } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ReportsScreen() {
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [refreshing, setRefreshing] = useState(false);

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

  const handleExport = async () => {
    let csv = 'Name,ID,Type,Check-In,Check-Out,Status,Duration\n';
    records.forEach(r => {
      csv += `${r.student_name || ''},${r.student_id || ''},${r.person_type || ''},${r.check_in_time || ''},${r.check_out_time || ''},${r.status || ''},${r.duration_minutes || ''}\n`;
    });

    try {
      await Share.share({ message: csv, title: `Attendance Report ${date}` });
    } catch {}
  };

  const present = records.filter(r => r.status === 'Present').length;
  const late = records.filter(r => r.status === 'Late').length;
  const halfDay = records.filter(r => r.status === 'Half Day').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <View style={styles.topBar}>
        <Text style={styles.title}>📋 Reports</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportText}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => {
          const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10));
        }}><Text style={styles.dateBtnText}>◀</Text></TouchableOpacity>
        <Text style={styles.dateText}>{date}</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => {
          const d = new Date(date); d.setDate(d.getDate() + 1);
          if (d.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10)) setDate(d.toISOString().slice(0, 10));
        }}><Text style={styles.dateBtnText}>▶</Text></TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: '#22c55e' }]}>
          <Text style={styles.statValue}>{present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.statValue}>{late}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#ef4444' }]}>
          <Text style={styles.statValue}>{halfDay}</Text>
          <Text style={styles.statLabel}>Half Day</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#6366f1' }]}>
          <Text style={styles.statValue}>{records.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Records */}
      {records.map((r, i) => (
        <View key={i} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{r.student_name || 'Unknown'}</Text>
            <Text style={styles.rowSub}>{r.student_id} • {r.person_type || 'student'}</Text>
            <Text style={styles.rowTime}>In: {r.check_in_time || '—'} | Out: {r.check_out_time || '—'}</Text>
          </View>
          <StatusBadge status={r.status || 'Present'} />
        </View>
      ))}

      {records.length === 0 && <Text style={styles.empty}>No records for this date.</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  exportBtn: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  exportText: { color: '#f1f5f9', fontWeight: '700', fontSize: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 16 },
  dateBtn: { backgroundColor: '#1e293b', borderRadius: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  dateBtnText: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
  dateText: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderLeftWidth: 3 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  rowSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  rowTime: { fontSize: 10, color: '#6366f1', marginTop: 2 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 },
});
