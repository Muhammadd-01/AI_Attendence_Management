import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getDashboardStats, getTodayAttendance } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function DashboardScreen({ navigation }) {
  const { user } = useApp();
  const [stats, setStats] = useState({});
  const [todayList, setTodayList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, t] = await Promise.allSettled([getDashboardStats(), getTodayAttendance()]);
      if (s.status === 'fulfilled') setStats(s.value);
      if (t.status === 'fulfilled') setTodayList(Array.isArray(t.value) ? t.value : []);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()} 👋</Text>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.role}>{(user?.role || 'principal').toUpperCase()}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <StatCard title="Total Students" value={stats.total_students ?? 0} icon="🎓" color="#22c55e" />
          <StatCard title="Present Today" value={stats.present_today ?? 0} icon="✅" color="#6366f1" />
        </View>
        <View style={styles.gridCol}>
          <StatCard title="Total Teachers" value={stats.total_teachers ?? 0} icon="👨‍🏫" color="#0ea5e9" />
          <StatCard title="Attendance %" value={stats.attendance_rate ? `${Math.round(stats.attendance_rate)}%` : '—'} icon="📊" color="#f59e0b" />
        </View>
      </View>

      {/* Quick Actions */}
      {user?.role === 'principal' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#065f46' }]} onPress={() => navigation.navigate('Scanner')}>
            <Text style={styles.actionIcon}>📡</Text>
            <Text style={styles.actionText}>Live Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1e3a5f' }]} onPress={() => navigation.navigate('Kiosk')}>
            <Text style={styles.actionIcon}>🏢</Text>
            <Text style={styles.actionText}>Faculty Kiosk</Text>
          </TouchableOpacity>
        </View>
      )}
      {user?.role === 'teacher' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#065f46' }]} onPress={() => navigation.navigate('Scanner')}>
            <Text style={styles.actionIcon}>📡</Text>
            <Text style={styles.actionText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Attendance List */}
      <Text style={styles.sectionTitle}>Today's Attendance ({todayList.length})</Text>
      {todayList.length === 0 ? (
        <Text style={styles.empty}>No attendance records yet today.</Text>
      ) : (
        todayList.slice(0, 20).map((r, i) => (
          <View key={i} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{r.student_name || r.name || 'Unknown'}</Text>
              <Text style={styles.rowSub}>{r.student_id} • {r.check_in_time || '—'}</Text>
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
  header: { marginBottom: 20, marginTop: 8 },
  greeting: { fontSize: 14, color: '#94a3b8' },
  name: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginTop: 4 },
  role: { fontSize: 11, color: '#6366f1', fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  gridCol: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  rowSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
});
