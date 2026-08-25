import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useFocusEffect } from '@react-navigation/native';
import { scanFrame } from '../services/api';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);
  const isFocusedRef = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      isFocusedRef.current = true;
      let interval;
      
      const captureAndScan = async () => {
        if (!isFocusedRef.current || isScanning || !cameraRef.current) return;
        
        setIsScanning(true);
        try {
          const photo = await cameraRef.current.takePictureAsync({
            base64: false,
            quality: 0.3,
          });

          // Compress and resize for faster network transmission
          const manipResult = await manipulateAsync(
            photo.uri,
            [{ resize: { width: 400 } }],
            { compress: 0.7, format: SaveFormat.JPEG, base64: true }
          );

          if (!isFocusedRef.current) return;

          const response = await scanFrame(manipResult.base64);
          
          if (response.success && response.people && response.people.length > 0) {
            setResult(response.people[0]);
          } else {
            setResult(null);
          }
        } catch (error) {
          console.error("Scan error:", error);
        } finally {
          if (isFocusedRef.current) {
            setIsScanning(false);
          }
        }
      };

      interval = setInterval(captureAndScan, 2000);

      return () => {
        isFocusedRef.current = false;
        clearInterval(interval);
      };
    }, [])
  );

  if (!permission) {
    return <View />;
  }

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
      <CameraView 
        style={styles.camera} 
        facing="front"
        ref={cameraRef}
      >
        <View style={styles.overlay}>
          <View style={styles.reticle} />
          
          <View style={styles.resultContainer}>
            {result ? (
              <View style={[styles.resultBox, { borderColor: result.role === 'teacher' ? '#0ea5e9' : '#22c55e' }]}>
                <Text style={styles.resultName}>{result.name} ({result.id})</Text>
                <Text style={styles.resultRole}>{result.role.toUpperCase()}</Text>
                <Text style={styles.resultMatch}>Match: {Math.round(result.confidence * 100)}%</Text>
              </View>
            ) : (
              <View style={[styles.resultBox, { borderColor: '#ef4444' }]}>
                <Text style={styles.resultName}>NO ATTENDEE IN FRAME</Text>
                <Text style={styles.resultRole}>Scanning...</Text>
              </View>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    borderStyle: 'dashed',
  },
  resultContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  resultBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    width: '80%',
  },
  resultName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultRole: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  resultMatch: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  }
});
