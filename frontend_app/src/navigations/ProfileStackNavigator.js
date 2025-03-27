import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';

const Stack = createNativeStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen 
        name="OrderHistory" 
        component={OrderHistoryScreen}
        options={{
          headerShown: true,
          headerTitle: '주문 내역',
          headerTitleAlign: 'center',
          headerShadowVisible: false, // 헤더 그림자 제거
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator; 