import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#6C63FF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          contentStyle: { backgroundColor: '#F0EFFF' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ title: '💸 SplitSmart' }} />
        <Stack.Screen name="create-group" options={{ title: 'New Group' }} />
        <Stack.Screen name="group/[id]" options={{ title: 'Group' }} />
        <Stack.Screen name="add-expense" options={{ title: 'Add Expense' }} />
        <Stack.Screen name="scanner" options={{ title: '📷 Scan Receipt' }} />
      </Stack>
    </>
  );
}
