import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTeachers, addTeacher, deleteTeacher, syncAI } from '../services/api';

export default function TeachersScreen({ navigation }) {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', teacher_id: '', email: '', subject: '', assignedClass: '' });

  const load = async () => {
    try { const d = await getTeachers(); setTeachers(Array.isArray(d) ? d : []); } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = teachers.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.teacher_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name.trim() || !form.teacher_id.trim()) return Alert.alert('Error', 'Name and ID are required.');
    try {
      await addTeacher(form);
      setShowAdd(false);
      setForm({ name: '', teacher_id: '', email: '', subject: '', assignedClass: '' });
      load();
      Alert.alert('Success', 'Teacher added successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add teacher.');
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Teacher', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteTeacher(id); load(); } catch { Alert.alert('Error', 'Failed to delete.'); }
      }},
    ]);
  };

  const handleSync = async () => {
    try {
      await syncAI();
      Alert.alert('AI Sync', 'AI models synced successfully!');
    } catch {
      Alert.alert('Error', 'AI sync failed.');
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Teachers ({teachers.length})</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#0ea5e9' }]} onPress={handleSync}>
            <Text style={styles.addBtnText}>🔄 Sync AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
            <Text style={styles.addBtnText}>{showAdd ? '✕' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#64748b" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
          <TextInput style={styles.input} placeholder="Teacher ID (e.g. TCH-001)" placeholderTextColor="#64748b" value={form.teacher_id} onChangeText={v => setForm(p => ({ ...p, teacher_id: v }))} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Subject" placeholderTextColor="#64748b" value={form.subject} onChangeText={v => setForm(p => ({ ...p, subject: v }))} />
          <TextInput style={styles.input} placeholder="Assigned Class" placeholderTextColor="#64748b" value={form.assignedClass} onChangeText={v => setForm(p => ({ ...p, assignedClass: v }))} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitText}>Add Teacher</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput style={styles.search} placeholder="Search teachers..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />

      {filtered.map((t, i) => (
        <TouchableOpacity key={i} style={styles.row} onLongPress={() => handleDelete(t.id || t.teacher_id, t.name)}
          onPress={() => navigation.navigate('Capture', { personId: t.teacher_id, role: 'teacher', name: t.name })}>
          <View style={[styles.rowAvatar, { backgroundColor: '#0c4a6e' }]}>
            <Text style={styles.rowAvatarText}>{(t.name || 'T')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{t.name}</Text>
            <Text style={styles.rowSub}>{t.teacher_id} • {t.subject || 'No Subject'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.rowClass}>{t.assignedClass || '—'}</Text>
            <Text style={styles.trainHint}>Tap → Train AI</Text>
          </View>
        </TouchableOpacity>
      ))}

      {filtered.length === 0 && <Text style={styles.empty}>No teachers found.</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  formCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 10, fontSize: 14 },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  search: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 12, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8 },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowAvatarText: { color: '#f1f5f9', fontWeight: '800', fontSize: 16 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  rowSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  rowClass: { fontSize: 12, color: '#0ea5e9', fontWeight: '600' },
  trainHint: { fontSize: 9, color: '#6366f1', marginTop: 2 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 },
});
