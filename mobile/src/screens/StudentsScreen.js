import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStudents, addStudent, deleteStudent } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', student_id: '', class_name: '', email: '' });

  const load = async () => {
    try { const d = await getStudents(); setStudents(Array.isArray(d) ? d : []); } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.student_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name.trim() || !form.student_id.trim()) return Alert.alert('Error', 'Name and ID are required.');
    try {
      await addStudent(form);
      setShowAdd(false);
      setForm({ name: '', student_id: '', class_name: '', email: '' });
      load();
      Alert.alert('Success', 'Student added successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add student.');
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Student', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteStudent(id); load(); } catch { Alert.alert('Error', 'Failed to delete.'); }
      }},
    ]);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Students ({students.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>{showAdd ? '✕' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#64748b" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
          <TextInput style={styles.input} placeholder="Student ID" placeholderTextColor="#64748b" value={form.student_id} onChangeText={v => setForm(p => ({ ...p, student_id: v }))} />
          <TextInput style={styles.input} placeholder="Class (e.g. 10-A)" placeholderTextColor="#64748b" value={form.class_name} onChangeText={v => setForm(p => ({ ...p, class_name: v }))} />
          <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor="#64748b" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitText}>Add Student</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput style={styles.search} placeholder="Search students..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />

      {filtered.map((s, i) => (
        <TouchableOpacity key={i} style={styles.row} onLongPress={() => handleDelete(s.id || s.student_id, s.name)}>
          <View style={styles.rowAvatar}>
            <Text style={styles.rowAvatarText}>{(s.name || 'S')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{s.name}</Text>
            <Text style={styles.rowSub}>{s.student_id} • {s.class_name || 'No Class'}</Text>
          </View>
          <Text style={styles.rowClass}>{s.class_name || '—'}</Text>
        </TouchableOpacity>
      ))}

      {filtered.length === 0 && <Text style={styles.empty}>No students found.</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  formCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 10, fontSize: 14 },
  submitBtn: { backgroundColor: '#22c55e', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  search: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 12, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 8 },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowAvatarText: { color: '#f1f5f9', fontWeight: '800', fontSize: 16 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  rowSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  rowClass: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 40 },
});
