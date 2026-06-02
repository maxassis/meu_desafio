import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="desafios" />
      <Stack.Screen name="map" />
      <Stack.Screen name="rastreador" />
      <Stack.Screen name="buy" />
      <Stack.Screen name="gps" />
      <Stack.Screen name="(tasks)" />
      <Stack.Screen name="(configurations)" />
    </Stack>
  )
}
