import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PeopleMenuScreen({ navigation }) {
  const items = [
    { emoji: '🎓', label: 'Students', desc: 'Manage student records', screen: 'StudentsMain', color: '#22c55e' },
    { emoji: '👨‍🏫', label: 'Teachers', desc: 'Manage faculty & train AI', screen: 'TeachersMain', color: '#0ea5e9' },
    { emoji: '🏫', label: 'Classes', desc: 'View class sections', screen: 'ClassesMain', color: '#6366f1' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>People Management</Text>
      {items.map((item, i) => (
        <TouchableOpacity key={i} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
          <View style={[styles.iconBox, { backgroundColor: item.color + '22' }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9', marginTop: 8, marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  emoji: { fontSize: 24 },
  label: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  desc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  arrow: { fontSize: 24, color: '#64748b' },
});
