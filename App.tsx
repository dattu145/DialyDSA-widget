import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProblemViewerScreen from './src/screens/ProblemViewerScreen';
import FilterScreen from './src/screens/FilterScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Daily DSA' }} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="ProblemViewer" component={ProblemViewerScreen} options={{ title: 'Problem' }} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ title: 'Widget Filter' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
