// src/components/InAppNotification.js
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const InAppNotification = ({ notification, onPress, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  
  useEffect(() => {
    // 알림이 표시될 때 애니메이션
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    
    // 5초 후 자동 닫기
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDismiss = () => {
    // 알림이 사라질 때 애니메이션
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }] }
      ]}
    >
      <TouchableOpacity 
        style={styles.contentContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color="#FF8C00" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title || '새 알림'}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.body || '새 알림이 왔습니다.'}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={handleDismiss}
      >
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    margin: 10,
    marginTop: 0,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1000,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 5,
  },
});

export default InAppNotification;