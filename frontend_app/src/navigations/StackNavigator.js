import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import FocusModeScreen from '../screens/FocusModeScreen';
import RankingScreen from '../screens/RankingScreen';

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={BottomTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FocusMode" 
        component={FocusModeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Ranking" 
        component={RankingScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator; 