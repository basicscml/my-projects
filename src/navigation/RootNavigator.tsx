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
import { ListScreen } from '../screens/ListScreen';
import { ReceiptsScreen } from '../screens/ReceiptsScreen';
import { ScanReceiptScreen } from '../screens/ScanReceiptScreen';
import { ReceiptDetailScreen } from '../screens/ReceiptDetailScreen';
import { StoresScreen } from '../screens/StoresScreen';
import { StoreEditorScreen } from '../screens/StoreEditorScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ color, fontSize: 18 }}>{icon}</Text>;
}

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
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="✓" color={color} /> }}
      />
      <Tab.Screen
        name="List"
        component={ListScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="🛒" color={color} /> }}
      />
      <Tab.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} /> }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="☰" color={color} /> }}
      />
    </Tab.Navigator>
  );
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
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="RoutineEditor"
        component={RoutineEditorScreen}
        options={{ presentation: 'modal', title: 'Routine' }}
      />
      <Stack.Screen name="RoutineRunner" component={RoutineRunnerScreen} options={{ title: '' }} />
      <Stack.Screen
        name="ScanReceipt"
        component={ScanReceiptScreen}
        options={{ presentation: 'modal', title: 'Scan receipt' }}
      />
      <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} options={{ title: 'Receipt' }} />
      <Stack.Screen name="Stores" component={StoresScreen} options={{ title: 'Stores' }} />
      <Stack.Screen
        name="StoreEditor"
        component={StoreEditorScreen}
        options={{ presentation: 'modal', title: 'Store' }}
      />
    </Stack.Navigator>
  );
}
