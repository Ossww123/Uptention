import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeliveryAddressBottomSheet from '../components/DeliveryAddressBottomSheet';

const GiftDetailScreen = ({ route }) => {
  const { item } = route.params;
  const [isBottomSheetVisible, setIsBottomSheetVisible] = React.useState(false);

  const handleReceiveGift = () => {
    setIsBottomSheetVisible(true);
  };

  const handleSubmitAddress = (addressData) => {
    // 여기에서 배송지 정보를 처리하는 로직을 구현합니다
    console.log('배송지 정보:', addressData);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>케이크 이미지</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.storeName}>{item.storeName}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{item.itemName}</Text>
            <Text style={styles.quantity}>{item.quantity}매</Text>
          </View>
          <View style={styles.senderContainer}>
            <Text style={styles.senderLabel}>보낸이 : </Text>
            <Text style={styles.senderName}>{item.sender}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleReceiveGift}>
            <Text style={styles.buttonText}>수령하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DeliveryAddressBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        onSubmit={handleSubmitAddress}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: width,
    height: width,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999999',
    fontSize: 14,
  },
  infoContainer: {
    width: width,
    padding: 20,
  },
  storeName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  quantity: {
    fontSize: 16,
    color: '#000000',
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderLabel: {
    fontSize: 14,
    color: '#333333',
  },
  senderName: {
    fontSize: 14,
    color: '#333333',
    marginRight: 'auto',
  },
  date: {
    fontSize: 14,
    color: '#999999',
  },
  button: {
    marginTop: 0,
    backgroundColor: '#FF8C00',
    marginTop: 80,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GiftDetailScreen; 