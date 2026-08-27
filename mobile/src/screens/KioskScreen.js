import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useFocusEffect } from '@react-navigation/native';
import { scanFrame, recordCheckIn, recordCheckOut } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function KioskScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [detected, setDetected] = useState(null);
  const [actionType, setActionType] = useState('check-in');
  const [status, setStatus] = useState('idle');
  const isFocusedRef = useRef(false);
  const isScanningRef = useRef(false);
  const lastProcessedRef = useRef(null);

  const todayKey = new Date().toISOString().slice(0, 10);

  const isAlreadyProcessed = async (action, id) => {
    try {
      const stored = JSON.parse(await AsyncStorage.getItem(`kiosk_${action}`) || '{}');
      if (stored.date === todayKey && stored.ids?.includes(id)) return true;
    } catch {}
    return false;
  };

  const markProcessed = async (action, id) => {
    try {
      const stored = JSON.parse(await AsyncStorage.getItem(`kiosk_${action}`) || '{}');
      const ids = stored.date === todayKey ? (stored.ids || []) : [];
      ids.push(id);
      await AsyncStorage.setItem(`kiosk_${action}`, JSON.stringify({ date: todayKey, ids }));
    } catch {}
  };

  useFocusEffect(useCallback(() => {
    isFocusedRef.current = true;
    let interval;

    const scan = async () => {
      if (!isFocusedRef.current || isScanningRef.current || !cameraRef.current || status === 'success') return;
      isScanningRef.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.3 });
        const manip = await manipulateAsync(photo.uri, [{ resize: { width: 400 } }], { compress: 0.7, format: SaveFormat.JPEG, base64: true });
        if (!isFocusedRef.current) return;

        const res = await scanFrame(manip.base64, { targetRole: 'faculty' });
        if (res?.data?.face_detected && res.data.results?.length > 0) {
          const match = res.data.results[0];
          const isTeacher = String(match.student_id).startsWith('TCH') || String(match.student_id).startsWith('T-') || String(match.student_id).startsWith('PRN') || match.role === 'teacher';

          const person = {
            id: match.student_id,
            name: match.name || (match.recognized ? 'Faculty' : 'Unknown'),
            role: isTeacher ? 'teacher' : 'student',
            confidence: Math.round((match.confidence || 0.95) * 100),
            recognized: match.recognized,
            error: !match.recognized || match.error || !isTeacher,
            is_student: match.is_student_kiosk_violation || (!isTeacher && match.recognized),
          };
          setDetected(person);

          // Auto check-in/out for recognized teachers
          if (person.recognized && isTeacher && !person.error && status === 'idle' && lastProcessedRef.current !== person.id) {
            const alreadyDone = await isAlreadyProcessed(actionType, person.id);
            if (alreadyDone) {
              Alert.alert('Already Recorded', `${person.name} has already ${actionType === 'check-in' ? 'checked in' : 'checked out'} today.`);
              lastProcessedRef.current = person.id;
              return;
            }

            setStatus('processing');
            try {
              let record;
              if (actionType === 'check-in') {
                const r = await recordCheckIn({ student_id: person.id, student_name: person.name, person_type: 'teacher', confidence: person.confidence / 100 });
                record = r.data?.data || r.data;
                if (record?.already_checked_in) {
                  Alert.alert('Already Checked In', `${person.name} is already checked in today.`);
                } else {
                  Alert.alert('Check-In ✅', `${person.name} checked in successfully!`);
                }
              } else {
                const r = await recordCheckOut({ student_id: person.id, student_name: person.name, person_type: 'teacher' });
                record = r.data?.data || r.data;
                if (record?.already_checked_out) {
                  Alert.alert('Already Checked Out', `${person.name} has already checked out today.`);
                } else {
                  Alert.alert('Check-Out ✅', `${person.name} checked out successfully!`);
                }
              }
              await markProcessed(actionType, person.id);
              lastProcessedRef.current = person.id;
              setStatus('success');
              setTimeout(() => { setStatus('idle'); setDetected(null); }, 3000);
            } catch (err) {
              Alert.alert('Error', 'Failed to record attendance.');
              setStatus('idle');
            }
          }
        } else {
          // Debounce: keep detected for 1.5s
          setTimeout(() => { if (isFocusedRef.current) setDetected(null); }, 1500);
        }
      } catch {} finally {
        isScanningRef.current = false;
      }
    };

    interval = setInterval(scan, 600);
    return () => { isFocusedRef.current = false; clearInterval(interval); };
  }, [actionType, status]));

  // Reset when action changes
  const switchAction = (a) => { setActionType(a); lastProcessedRef.current = null; setDetected(null); setStatus('idle'); };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) return (
    <View style={styles.container}>
      <Text style={styles.permText}>Camera permission required</Text>
      <TouchableOpacity style={styles.permBtn} onPress={requestPermission}><Text style={styles.permBtnText}>Grant Permission</Text></TouchableOpacity>
    </View>
  );

  const borderColor = detected ? (detected.is_student ? '#3b82f6' : detected.error ? '#ef4444' : '#22c55e') : '#334155';
  const statusText = detected ? (detected.is_student ? '🎓 STUDENT DETECTED' : detected.error ? '❓ UNKNOWN PERSON' : `✅ ${detected.name}`) : '🔍 SCANNING...';

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, actionType === 'check-in' && { backgroundColor: '#065f46' }]} onPress={() => switchAction('check-in')}>
          <Text style={styles.toggleText}>📥 Check-In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, actionType === 'check-out' && { backgroundColor: '#7f1d1d' }]} onPress={() => switchAction('check-out')}>
          <Text style={styles.toggleText}>📤 Check-Out</Text>
        </TouchableOpacity>
      </View>

      {/* Camera */}
      <View style={[styles.cameraBox, { borderColor }]}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef}>
          <View style={styles.overlay}>
            {/* Reticle */}
            <View style={[styles.reticle, { borderColor }]} />

            {/* Status Bar */}
            <View style={[styles.statusBar, { backgroundColor: detected ? (detected.error ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)') : 'rgba(0,0,0,0.7)' }]}>
              <Text style={styles.statusText}>{statusText}</Text>
              {detected && !detected.error && <Text style={styles.confText}>Confidence: {detected.confidence}%</Text>}
            </View>
          </View>
        </CameraView>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Faculty Presence Scanner</Text>
        <Text style={styles.infoSub}>Teachers & Principal step into frame for automatic {actionType}</Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 8 },
  toggleBtn: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  toggleText: { color: '#f1f5f9', fontWeight: '700', fontSize: 14 },
  cameraBox: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reticle: { width: width * 0.55, height: width * 0.55, borderWidth: 2, borderRadius: 16, borderStyle: 'dashed' },
  statusBar: { position: 'absolute', bottom: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  statusText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  confText: { color: '#d1fae5', fontSize: 11, marginTop: 2 },
  infoBox: { marginTop: 12, alignItems: 'center' },
  infoTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '700' },
  infoSub: { color: '#64748b', fontSize: 12, marginTop: 4, textAlign: 'center' },
  permText: { color: '#f1f5f9', fontSize: 16, textAlign: 'center', marginTop: 100 },
  permBtn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20, marginHorizontal: 40 },
  permBtnText: { color: '#fff', fontWeight: '700' },
});
