// StoreStackNavigator.js 수정
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreScreen from '../screens/StoreScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen'; // 결제 화면 import 추가

const Stack = createNativeStackNavigator();

const StoreStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // 화면 전환 애니메이션 조정
        animation: 'slide_from_right',
        // 문제가 될 수 있는 옵션 변경
        freezeOnBlur: false,
        // 화면 유지 설정
        detachPreviousScreen: false,
        detachInactiveScreens: false, // 추가: 비활성 화면 분리 방지
      }}
    >
      <Stack.Screen 
        name="StoreMain" 
        component={StoreScreen}
        options={{
          // 화면이 항상 메모리에 유지되도록 설정
          unmountOnBlur: false
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{
          unmountOnBlur: false // 추가: 화면 유지 설정
        }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          unmountOnBlur: false // 추가: 화면 유지 설정
        }}
      />
      <Stack.Screen 
        name="CheckoutScreen" 
        component={CheckoutScreen}
        options={{
          unmountOnBlur: false // 추가: 화면 유지 설정
        }}
      />
    </Stack.Navigator>
  );
};

export default StoreStackNavigator;