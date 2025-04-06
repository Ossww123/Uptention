import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import Postcode from '@actbase/react-daum-postcode';
import { Ionicons } from '@expo/vector-icons';

const AddressSearchScreen = ({ navigation, route }) => {
  // 주소 데이터 가져오기 함수
  const getAddressData = (data) => {
    // 기본 주소 결정 로직
    let defaultAddress = data.buildingName === 'N' 
      ? data.apartment 
      : data.buildingName;

    // 완전한 주소 정보 생성
    const completeAddress = {
      zonecode: data.zonecode,
      roadAddress: data.address,
      buildingName: defaultAddress,
      detailAddress: '' // 상세 주소는 나중에 입력
    };

    // prevScreen이 PaymentBottomSheet인 경우와 아닌 경우를 구분
    if (route.params?.prevScreen === 'PaymentBottomSheet') {
      navigation.navigate('AddressDetail', { 
        address: completeAddress,
        prevScreen: 'PaymentBottomSheet',
        product: route.params?.product
      });
    } else if (route.params?.prevScreen === 'DeliveryAddressBottomSheet') {
      navigation.navigate('AddressDetail', {
        address: completeAddress,
        prevScreen: 'DeliveryAddressBottomSheet',
        orderId: route.params?.orderId,
        item: route.params?.item
      });
    } else {
      navigation.navigate('AddressDetail', { 
        address: completeAddress,
        prevItems: route.params?.prevItems,
        prevTotalPrice: route.params?.prevTotalPrice
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주소 검색</Text>
        <View style={styles.emptySpace} />
      </View>

      {/* Daum 우편번호 컴포넌트 */}
      <Postcode
        style={styles.postcodeContainer}
        jsOptions={{ animation: true }}
        onSelected={getAddressData}
        onError={(error) => {
          console.error('주소 검색 중 오류 발생:', error);
          Alert.alert('오류', '주소 검색 중 문제가 발생했습니다.');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 30,
  },
  postcodeContainer: {
    flex: 1,
    width: '100%',
    zIndex: 999,
  },
});

export default AddressSearchScreen;