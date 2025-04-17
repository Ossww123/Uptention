// StackNavigator.js (수정)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import FocusModeScreen from '../screens/FocusModeScreen';
import RankingScreen from '../screens/RankingScreen';
import NotificationScreen from '../screens/NotificationScreen';
import OrderCompleteScreen from '../screens/OrderCompleteScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AddressSearchScreen from '../screens/AddressSearchScreen';
import AddressDetailScreen from '../screens/AddressDetailScreen';
import GiftBoxScreen from '../screens/GiftBoxScreen';
import GiftDetailScreen from '../screens/GiftDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UsageStatsDetailScreen from '../screens/UsageStatsDetailScreen'; // 추가

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
        options={{
          headerShown: true,
          headerTitle: '랭킹',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      />
      {/* 앱 사용 통계 상세 화면 추가 */}
      <Stack.Screen 
        name="UsageStatsDetail" 
        component={UsageStatsDetailScreen} 
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="Notification" 
        component={NotificationScreen} 
        options={{
          headerShown: true,
          headerTitle: '알림',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="OrderComplete" 
        component={OrderCompleteScreen} 
        options={{ 
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen 
        name="OrderHistory" 
        component={OrderHistoryScreen} 
        options={{ 
          headerShown: true,
          headerTitle: '주문 내역',
          headerTitleAlign: 'center',
          presentation: 'card',
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen
        name="AddressSearch"
        component={AddressSearchScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddressDetail"
        component={AddressDetailScreen}
        options={{
          headerShown: false,
          unmountOnBlur: false,
        }}
      />
      <Stack.Screen 
        name="GiftBox" 
        component={GiftBoxScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="GiftDetail" 
        component={GiftDetailScreen}
        options={{
          headerShown: true,
          headerTitle: '선물함',
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;