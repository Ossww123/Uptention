// AddressDetailScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const AddressDetailScreen = ({ navigation, route }) => {
  const { address, prevScreen, product, prevItems, prevTotalPrice } = route.params;
  const [detailAddress, setDetailAddress] = useState('');

  const handleSave = () => {
    const completeAddress = {
      ...address,
      detailAddress
    };

    // PaymentBottomSheet에서 온 경우
    if (prevScreen === 'PaymentBottomSheet') {
      navigation.navigate('ProductDetail', {
        address: completeAddress,
        product: product,
        productId: product.itemId,
        showPaymentSheet: true
      });
    } else {
      // CheckoutScreen에서 온 경우
      navigation.navigate('CheckoutScreen', { 
        address: completeAddress,
        selectedItems: prevItems,
        totalPrice: prevTotalPrice
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.addressContainer}>
        <Text style={styles.label}>도로명 주소</Text>
        <Text style={styles.addressText}>[{address.zonecode}] {address.roadAddress}</Text>
        {address.buildingName && (
          <Text style={styles.buildingName}>{address.buildingName}</Text>
        )}
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.label}>상세 주소</Text>
        <TextInput
          style={styles.input}
          value={detailAddress}
          onChangeText={setDetailAddress}
          placeholder="상세 주소를 입력해주세요"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, !detailAddress && styles.buttonDisabled]} 
        onPress={handleSave}
        disabled={!detailAddress}
      >
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
  addressContainer: {
    marginBottom: 20,
  },
  detailContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  buildingName: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  button: {
    backgroundColor: '#FF8C00',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default AddressDetailScreen;