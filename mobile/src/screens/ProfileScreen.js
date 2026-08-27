import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useApp } from '../context/AppContext';

export default function ProfileScreen() {
  const { user, logout } = useApp();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const roleColor = user?.role === 'principal' ? '#f59e0b' : user?.role === 'teacher' ? '#0ea5e9' : '#22c55e';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Avatar */}
        <View style={[styles.avatar, { borderColor: roleColor }]}>
          {user?.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          )}
        </View>

        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '22' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{(user?.role || 'principal').toUpperCase()}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <InfoRow label="Email" value={user?.email || '—'} />
          <InfoRow label="ID" value={user?.teacher_id || user?.student_id || user?.id || '—'} />
          {user?.assignedClass && <InfoRow label="Assigned Class" value={user.assignedClass} />}
          {user?.phone && <InfoRow label="Phone" value={user.phone} />}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginTop: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', borderWidth: 3, marginBottom: 16 },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#f1f5f9' },
  name: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  roleText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  infoSection: { width: '100%', marginTop: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { fontSize: 13, color: '#94a3b8' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#f1f5f9' },
  logoutBtn: { backgroundColor: '#7f1d1d', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16 },
  logoutText: { color: '#fca5a5', fontSize: 16, fontWeight: '700' },
});
