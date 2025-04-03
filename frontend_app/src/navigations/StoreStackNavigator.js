// StoreStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoreScreen from '../screens/StoreScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AddressSearchScreen from '../screens/AddressSearchScreen'; // 주소 검색 화면 import 추가

const Stack = createNativeStackNavigator();

const StoreStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        freezeOnBlur: false,
        detachPreviousScreen: false,
        detachInactiveScreens: false,
      }}
    >
      <Stack.Screen 
        name="StoreMain" 
        component={StoreScreen}
        options={{
          unmountOnBlur: false
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{
          unmountOnBlur: false
        }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          unmountOnBlur: false
        }}
      />
      <Stack.Screen 
        name="CheckoutScreen" 
        component={CheckoutScreen}
        options={{
          unmountOnBlur: false
        }}
      />
      {/* 주소 검색 화면 추가 */}
      <Stack.Screen 
        name="AddressSearch" 
        component={AddressSearchScreen}
        options={{
          unmountOnBlur: false
        }}
      />
    </Stack.Navigator>
  );
};

export default StoreStackNavigator;