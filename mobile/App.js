import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppProvider, useApp } from './src/context/AppContext';
import LoadingSpinner from './src/components/LoadingSpinner';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StudentsScreen from './src/screens/StudentsScreen';
import TeachersScreen from './src/screens/TeachersScreen';
import ClassesScreen from './src/screens/ClassesScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import KioskScreen from './src/screens/KioskScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StudentPortalScreen from './src/screens/StudentPortalScreen';
import PeopleMenuScreen from './src/screens/PeopleMenuScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#0f172a' },
  headerTintColor: '#f1f5f9',
  headerTitleStyle: { fontWeight: '700' },
};

const tabOptions = {
  tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b', height: 60, paddingBottom: 8 },
  tabBarActiveTintColor: '#6366f1',
  tabBarInactiveTintColor: '#64748b',
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
  headerStyle: { backgroundColor: '#0f172a' },
  headerTintColor: '#f1f5f9',
  headerTitleStyle: { fontWeight: '700' },
};

// ── Principal Tabs ──
function PrincipalTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />, title: 'Dashboard' }} />
      <Tab.Screen name="People" component={PeopleStack} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="👥" color={color} />, headerShown: false, title: 'People' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} />, title: 'Attendance' }} />
      <Tab.Screen name="More" component={MoreStack} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />, headerShown: false, title: 'More' }} />
    </Tab.Navigator>
  );
}

// ── Teacher Tabs ──
function TeacherTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />, title: 'Dashboard' }} />
      <Tab.Screen name="LiveScan" component={ScannerScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="📡" color={color} />, title: 'Live Scan' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} />, title: 'Attendance' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />, title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Student Tabs ──
function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="MyAttendance" component={StudentPortalScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />, title: 'My Attendance' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />, title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── People Sub-Stack (Students/Teachers/Classes) ──
function PeopleStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PeopleMenu" component={PeopleMenuScreen} options={{ title: 'People' }} />
      <Stack.Screen name="StudentsMain" component={StudentsScreen} options={{ title: 'Students' }} />
      <Stack.Screen name="TeachersMain" component={TeachersScreen} options={{ title: 'Teachers' }} />
      <Stack.Screen name="ClassesMain" component={ClassesScreen} options={{ title: 'Classes' }} />
      <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Train AI Face' }} />
    </Stack.Navigator>
  );
}

// ── More Sub-Stack (Analytics/Reports/Settings/Profile) ──
function MoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="SettingsPage" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Live Scanner' }} />
      <Stack.Screen name="Kiosk" component={KioskScreen} options={{ title: 'Faculty Kiosk' }} />
    </Stack.Navigator>
  );
}

// ── More Menu Screen ──
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function MoreMenuScreen({ navigation }) {
  const { user } = useApp();
  const items = [
    { emoji: '📡', label: 'Live Scanner', screen: 'Scanner' },
    { emoji: '🏢', label: 'Faculty Kiosk', screen: 'Kiosk' },
    { emoji: '📊', label: 'Analytics', screen: 'Analytics' },
    { emoji: '📋', label: 'Reports', screen: 'Reports' },
    { emoji: '⚙️', label: 'Settings', screen: 'SettingsPage' },
    { emoji: '👤', label: 'Profile', screen: 'Profile' },
  ];

  return (
    <View style={menuStyles.container}>
      {items.map((item, i) => (
        <TouchableOpacity key={i} style={menuStyles.item} onPress={() => navigation.navigate(item.screen)}>
          <Text style={menuStyles.emoji}>{item.emoji}</Text>
          <Text style={menuStyles.label}>{item.label}</Text>
          <Text style={menuStyles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const menuStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  emoji: { fontSize: 24, marginRight: 14 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  arrow: { fontSize: 22, color: '#64748b' },
});

// ── Tab Icon Helper ──
function TabIcon({ emoji, color }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

// ── Main Navigator ──
function MainNavigator() {
  const { user, loading } = useApp();

  if (loading) return <LoadingSpinner message="Loading..." />;

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  const role = user.role || 'principal';

  // Principal gets full access with People sub-nav that has Students/Teachers/Classes
  if (role === 'principal') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PrincipalHome" component={PrincipalTabs} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ ...screenOptions, headerShown: true, title: 'Live Scanner' }} />
        <Stack.Screen name="Kiosk" component={KioskScreen} options={{ ...screenOptions, headerShown: true, title: 'Faculty Kiosk' }} />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ ...screenOptions, headerShown: true, title: 'Train AI Face' }} />
      </Stack.Navigator>
    );
  }

  if (role === 'teacher') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TeacherHome" component={TeacherTabs} />
      </Stack.Navigator>
    );
  }

  // Student
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentHome" component={StudentTabs} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <MainNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
