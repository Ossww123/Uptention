import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import FocusModeScreen from '../screens/FocusModeScreen';
import NotificationScreen from '../screens/NotificationScreen';

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
        name="Notification" 
        component={NotificationScreen} 
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;