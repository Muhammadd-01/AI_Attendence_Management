import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Picker } from '@react-native-picker/picker';

import { getStudents, getTeachers, triggerAutoTrain } from '../services/api';
import { uploadFaceImage } from '../services/supabase';

export default function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  const TOTAL_SAMPLES = 20;

  useEffect(() => {
    fetchPeople(role);
  }, [role]);

  const fetchPeople = async (currentRole) => {
    try {
      const data = currentRole === 'student' ? await getStudents() : await getTeachers();
      setPeople(data);
      if (data.length > 0) {
        setSelectedPerson(data[0].id || data[0].student_id || data[0].teacher_id);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch people. Check API connection.');
    }
  };

  const startTraining = async () => {
    if (!selectedPerson || !cameraRef.current) return;
    
    setIsLoading(true);
    setProgress(0);
    setMessage('Capturing and uploading images...');
    
    const imageUrls = [];
    
    try {
      for (let i = 0; i < TOTAL_SAMPLES; i++) {
        // Capture photo
        const photo = await cameraRef.current.takePictureAsync({
          base64: false,
          quality: 0.5,
        });
        
        // Resize
        const manipResult = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 500 } }],
          { compress: 0.8, format: SaveFormat.JPEG, base64: true }
        );
        
        // Upload to Supabase
        const publicUrl = await uploadFaceImage(
          selectedPerson,
          role,
          manipResult.base64,
          i + 1
        );
        imageUrls.push(publicUrl);
        setProgress(((i + 1) / TOTAL_SAMPLES) * 100);
      }
      
      setMessage('Images uploaded. Training AI...');
      
      // Train AI
      const result = await triggerAutoTrain(selectedPerson, role, imageUrls);
      
      if (result.success) {
        setMessage(`Success! AI trained on ${result.encodings_count} embeddings.`);
      } else {
        setMessage(`Training error: ${result.error}`);
      }
      
    } catch (error) {
      console.error(error);
      setMessage('An error occurred during training.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="front" ref={cameraRef}>
        <View style={styles.overlay}>
          {/* Controls Overlay */}
          <View style={styles.controlsContainer}>
            <View style={styles.pickerRow}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={role}
                  onValueChange={(val) => setRole(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Student" value="student" />
                  <Picker.Item label="Teacher" value="teacher" />
                </Picker>
              </View>
              
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedPerson}
                  onValueChange={(val) => setSelectedPerson(val)}
                  style={styles.picker}
                >
                  {people.map(p => (
                    <Picker.Item 
                      key={p.id || p.student_id || p.teacher_id} 
                      label={p.name} 
                      value={p.id || p.student_id || p.teacher_id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.messageText}>{message}</Text>
              
              {isLoading ? (
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="large" color="#007bff" />
                  <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.captureButton} onPress={startTraining}>
                  <Text style={styles.captureButtonText}>Start Auto-Capture & Train</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  statusBox: {
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  captureButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
