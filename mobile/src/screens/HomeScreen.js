import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Attendance System</Text>
      <Text style={styles.subtitle}>Mobile Agent</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Scanner')}
      >
        <Text style={styles.buttonText}>📡 Open Live Scanner</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => navigation.navigate('Capture')}
      >
        <Text style={styles.buttonText}>📸 Capture & Train Face</Text>
      </TouchableOpacity>
      
      <Text style={styles.note}>
        Make sure to update src/services/api.js with your laptop's local IP address before scanning!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    marginTop: 40,
    color: '#888',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  }
});
