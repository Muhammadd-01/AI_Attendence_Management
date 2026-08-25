import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import CaptureScreen from './src/screens/CaptureScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'AI Attendance Manager' }}
          />
          <Stack.Screen 
            name="Scanner" 
            component={ScannerScreen} 
            options={{ title: 'Live Scanner' }}
          />
          <Stack.Screen 
            name="Capture" 
            component={CaptureScreen} 
            options={{ title: 'Register Face' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
