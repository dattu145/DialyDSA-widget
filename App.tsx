import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProblemViewerScreen from './src/screens/ProblemViewerScreen';
import FilterScreen from './src/screens/FilterScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { StorageService } from './src/services/storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    const config = await StorageService.getConfig();
    setInitialRoute(config ? 'Home' : 'Settings');
  };

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Daily DSA' }} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="ProblemViewer" component={ProblemViewerScreen} options={{ title: 'Problem' }} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ title: 'Widget Filter' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Setup', headerLeft: () => null }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
