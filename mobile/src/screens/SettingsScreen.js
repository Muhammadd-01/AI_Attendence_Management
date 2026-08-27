import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, syncAI } from '../services/api';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try { const d = await getSettings(); setSettings(d); } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncAI();
      Alert.alert('Success', 'AI models synced successfully!');
    } catch {
      Alert.alert('Error', 'AI sync failed. Make sure the backend is running.');
    }
    setSyncing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <Text style={styles.title}>⚙️ Settings</Text>

      {/* AI Engine */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Engine</Text>
        <SettingRow label="Detection Model" value={settings.detection_model || 'HOG + Cascade'} />
        <SettingRow label="Recognition Threshold" value={`${settings.recognition_threshold || 0.6}`} />
        <SettingRow label="Min Face Size" value={settings.min_face_size || '30×30'} />

        <TouchableOpacity style={[styles.syncBtn, syncing && { opacity: 0.6 }]} onPress={handleSync} disabled={syncing}>
          <Text style={styles.syncText}>{syncing ? '🔄 Syncing...' : '🔄 Sync AI Models'}</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <SettingRow label="Late Threshold" value={`${settings.late_threshold_minutes || 15} min`} />
        <SettingRow label="School Start" value={settings.school_start_time || '08:00:00'} />
        <SettingRow label="School End" value={settings.school_end_time || '14:00:00'} />
      </View>

      {/* System */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <SettingRow label="Backend" value="http://192.168.100.173:5001" />
        <SettingRow label="Mobile App Version" value="1.0.0" />
        <SettingRow label="Expo SDK" value="54.0.0" />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SettingRow({ label, value }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginTop: 8, marginBottom: 16 },
  section: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  settingLabel: { fontSize: 13, color: '#94a3b8' },
  settingValue: { fontSize: 13, color: '#f1f5f9', fontWeight: '600' },
  syncBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  syncText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
