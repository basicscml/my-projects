import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { RootStackParamList, TabParamList } from './types';
import { TodayScreen } from '../screens/TodayScreen';
import { RoutinesScreen } from '../screens/RoutinesScreen';
import { RoutineEditorScreen } from '../screens/RoutineEditorScreen';
import { RoutineRunnerScreen } from '../screens/RoutineRunnerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTitleStyle: { color: theme.text, fontWeight: '800' },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="✓" color={color} />,
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon icon="☰" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ color, fontSize: 18 }}>{icon}</Text>;
}

export function RootNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTitleStyle: { color: theme.text, fontWeight: '800' },
        headerTintColor: theme.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RoutineEditor"
        component={RoutineEditorScreen}
        options={{ presentation: 'modal', title: 'Routine' }}
      />
      <Stack.Screen
        name="RoutineRunner"
        component={RoutineRunnerScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
