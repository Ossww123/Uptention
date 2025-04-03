// AddressDetailScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const AddressDetailScreen = ({ navigation, route }) => {
  const { address } = route.params;
  const [detailAddress, setDetailAddress] = useState('');

  const handleSave = () => {
    navigation.navigate('CheckoutScreen', { 
      address: { ...address, detailAddress },
    });
  };

  return (
    <View style={styles.container}>
      {/* 주소 정보 표시 */}
      <Text>{address.roadAddress}</Text>

      {/* 상세 주소 입력 필드 */}
      <TextInput
        style={styles.input}
        value={detailAddress}
        onChangeText={setDetailAddress}
        placeholder="상세 주소를 입력해주세요"
      />

      {/* 저장 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>저장</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#FFFFFF',
    },
    addressText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: '#CCCCCC',
      borderRadius: 8,
      paddingHorizontal: 15,
      fontSize: 16,
      backgroundColor: '#F8F8F8',
      marginBottom: 20,
    },
    button: {
      backgroundColor: '#FF8C00',
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });
  

export default AddressDetailScreen;