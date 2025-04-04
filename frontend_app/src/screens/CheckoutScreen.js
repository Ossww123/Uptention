import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { post, del } from '../services/api';

const CheckoutScreen = ({ navigation, route }) => {
  // CartScreen에서 전달받은 선택된 상품 정보와 총 가격
  const { selectedItems: initialItems = [], totalPrice: initialPrice = 0 } = route.params || {};
  const [selectedItems, setSelectedItems] = useState(initialItems);
  const [totalPrice, setTotalPrice] = useState(initialPrice);
  const [address, setAddress] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  
  const { tokenBalance, publicKey, sendSPLToken } = useWallet();
  const { authToken } = useAuth();

  // 최근 배송지 조회
  const fetchRecentAddress = async () => {
    try {
      setIsLoadingAddress(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/delivery-info`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.address) {
        // 주소 문자열을 파싱하여 주소 객체 형식으로 변환
        const addressParts = response.data.address.split(' ');
        const zonecode = addressParts[0].replace('[', '').replace(']', '');
        const roadAddress = addressParts.slice(1, -1).join(' ');
        const detailAddress = addressParts[addressParts.length - 1];

        setAddress({
          zonecode,
          roadAddress,
          detailAddress,
          buildingName: ''
        });
      }
    } catch (error) {
      console.error('최근 배송지 조회 실패:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 컴포넌트 마운트 시 최근 배송지 조회
  useEffect(() => {
    // 주소 검색에서 돌아온 경우가 아닐 때만 최근 배송지 조회
    if (!route.params?.address) {
      fetchRecentAddress();
    }
  }, []);

  // 라우트 파라미터에서 주소 정보 받아오기
  useEffect(() => {
    console.log('Checkout Route Params:', route.params);
    
    // 주소 정보가 있을 때만 주소를 업데이트
    if (route.params?.address) {
      console.log('받은 주소:', route.params.address);
      setAddress(route.params.address);
      setIsLoadingAddress(false);  // 주소 검색에서 돌아왔을 때 로딩 상태 해제
      
      // 주소 검색에서 돌아올 때 이전 상품 정보 복원
      if (route.params.selectedItems) {
        setSelectedItems(route.params.selectedItems);
        setTotalPrice(route.params.totalPrice);
      }
    }
    // 처음 화면 진입 시 상품 정보 설정
    else if (route.params?.selectedItems) {
      setSelectedItems(route.params.selectedItems);
      setTotalPrice(route.params.totalPrice);
    }
  }, [route.params]);

  // 주문 상품 (CartScreen에서 전달받은 데이터가 있으면 사용, 없으면 더미 데이터 사용)
  const orderItems =
    selectedItems.length > 0
      ? selectedItems.map((item) => ({
          id: item.cartId || item.itemId,
          brand: item.brand,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.thumbnail
            ? { uri: item.thumbnail }
            : require("../../assets/product-placeholder.png"),
        }))
      : [
          {
            id: "1",
            brand: "브랜드",
            name: "상품 이름",
            price: 2.9,
            quantity: 1,
            image: require("../../assets/product-placeholder.png"),
          },
          {
            id: "2",
            brand: "브랜드",
            name: "상품 이름",
            price: 2.9,
            quantity: 1,
            image: require("../../assets/product-placeholder.png"),
          },
        ];

  const [paymentInfo, setPaymentInfo] = useState({
    availableWorkCoins: 0,
    productTotal: 0,
    finalAmount: 0
  });

  const SHOP_WALLET_ADDRESS = '4uDQ7uwEe1iy8R5vYtSvD6vNfcyeTLy8YKyVe44RKR92';

  useEffect(() => {
    const calculatePaymentInfo = () => {
      const productTotal = totalPrice > 0 ? totalPrice : 5.8;
      const availableWorkCoins = publicKey && tokenBalance !== null ? Number(tokenBalance) : 0;
      const finalAmount = availableWorkCoins - productTotal;

      setPaymentInfo({
        availableWorkCoins,
        productTotal,
        finalAmount
      });
    };

    calculatePaymentInfo();
  }, [totalPrice, tokenBalance, publicKey]);

  // 뒤로 가기
  const handleGoBack = () => {
    navigation.goBack();
  };

  // 결제하기
  const handlePayment = async () => {
    try {
      // 입력값 검증
      if (!selectedItems || selectedItems.length === 0) {
        Alert.alert('주문 실패', '주문할 상품이 없습니다.');
        return;
      }

      if (!address) {
        Alert.alert('주문 실패', '배송 주소를 입력해주세요.');
        return;
      }

      // 1. 주문 검증 API 요청 데이터 준비
      const orderVerifyData = selectedItems.map(item => ({
        itemId: item.itemId,
        price: item.price,
        quantity: item.quantity
      }));

      console.log('=== 주문 검증 시작 ===');
      console.log('검증 요청 데이터:', JSON.stringify(orderVerifyData, null, 2));

      // 2. 주문 검증 API 호출
      const { data: verifyData, ok, status } = await post("/orders/verify", orderVerifyData);

      console.log('검증 응답:', JSON.stringify(verifyData, null, 2));
      console.log('검증 상태:', ok ? '성공' : '실패');

      if (ok) {
        console.log('=== 검증 성공: 주문 진행 ===');

        try {
          // 1. 주문 생성 API 호출
          const requestData = {
            items: selectedItems.map(item => ({
              itemId: item.itemId,
              quantity: item.quantity
            })),
            address: `${address.roadAddress} ${address.detailAddress}`
          };

          console.log('주문 요청 데이터:', JSON.stringify(requestData, null, 2));

          const response = await axios.post(
            `${API_BASE_URL}/api/orders/purchase`,
            requestData,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('API 응답:', response.data);

          const { orderId, paymentAmount } = response.data;

          if (orderId && paymentAmount) {
            console.log('=== 토큰 전송 프로세스 시작 ===');
            console.log('결제 금액:', paymentAmount);
            console.log('지갑 승인 대기 중...');

            // 2. SPL 토큰 전송
            const result = await sendSPLToken(
              SHOP_WALLET_ADDRESS,
              paymentAmount.toString(),
              `ORDER_${orderId}` // 주문 ID를 메모에 포함
            );

            console.log('=== 토큰 전송 완료 ===');

            // 장바구니에서 주문한 상품 삭제
            const cartIds = selectedItems.map(item => item.cartId).filter(Boolean);
            if (cartIds.length > 0) {
              try {
                const { ok: deleteOk, data: deleteData } = await del("/shopping-cart", {
                  body: JSON.stringify(cartIds)
                });
                
                if (!deleteOk) {
                  console.log('장바구니 아이템 삭제 실패:', deleteData);
                }
              } catch (error) {
                console.error('장바구니 아이템 삭제 중 오류:', error);
              }
            }

            // 3. 주문 완료 화면으로 이동
            navigation.replace('OrderComplete', {
              orderId: orderId,
              paymentAmount: paymentAmount
            });
          } else {
            throw new Error('주문 정보가 올바르지 않습니다.');
          }

        } catch (error) {
          console.error('=== 처리 오류 ===');
          console.error('에러 내용:', error);
          
          // 토큰 전송 거절 에러 체크
          const isUserRejection = 
            error.message?.includes('User rejected the request') || 
            error.message?.includes('NOBRIDGE');
          
          if (isUserRejection) {
            // 사용자가 거래를 거절한 경우
            Alert.alert(
              '결제 취소',
              '결제가 취소되었습니다.',
              [{ text: '확인' }]
            );
          } else {
            // 기타 오류
            Alert.alert(
              '결제 실패',
              '처리 중 오류가 발생했습니다. 다시 시도해주세요.',
              [{ text: '확인' }]
            );
          }
        }
      } else {
        // 검증 실패 처리
        let errorMessage = "상품 검증 중 오류가 발생했습니다.";
        
        if (status === 400) {
          errorMessage = verifyData.message || "재고가 부족한 상품이 있습니다.";
        } else if (status === 404) {
          errorMessage = verifyData.message || "존재하지 않는 상품이 있습니다.";
        } else if (status === 409) {
          errorMessage = verifyData.message || "상품 가격이 변경되었습니다.";
        }
        
        console.log('=== 검증 실패 ===');
        console.log('실패 사유:', errorMessage);
        
        Alert.alert("주문 확인", errorMessage, [
          {
            text: "확인",
            onPress: () => navigation.goBack()
          }
        ]);
      }
    } catch (error) {
      console.error('=== 주문 처리 실패 ===');
      console.error('에러 응답:', error.response?.data);
      console.error('에러 메시지:', error.message);
      
      let errorTitle = '주문 실패';
      let shouldGoBack = false;

      if (error.response?.data) {
        switch (error.response.data.code) {
          case 'ITEM_004':
            errorTitle = '재고 부족';
            errorTitle = '재고가 부족한 상품이 있습니다.\n장바구니를 다시 확인해주세요.';
            shouldGoBack = true;
            break;
          case 'ITEM_001':
            errorTitle = '존재하지 않는 상품';
            errorTitle = '존재하지 않는 상품이 포함되어 있습니다.\n장바구니를 다시 확인해주세요.';
            shouldGoBack = true;
            break;
          case 'X002':
            if (error.response.data.message.includes('address')) {
              errorTitle = '배송 주소';
              errorTitle = '배송 주소를 입력해주세요.';
            } else if (error.response.data.message.includes('items')) {
              errorTitle = '주문 상품 정보';
              errorTitle = '주문 상품 정보가 올바르지 않습니다.';
            } else {
              errorTitle = '입력 정보';
              errorTitle = '주문 정보가 올바르지 않습니다.\n입력 정보를 다시 확인해주세요.';
            }
            break;
          default:
            errorTitle = '처리 중 오류';
            errorTitle = error.response.data.message || '주문 처리 중 오류가 발생했습니다.';
        }
      }

      Alert.alert(
        errorTitle,
        errorTitle,
        [
          {
            text: '확인',
            onPress: () => shouldGoBack && navigation.goBack()
          }
        ]
      );
    }
  };

  // 주소 검색 화면으로 이동
  const handleAddressSearch = () => {
    navigation.navigate("AddressSearch", {
      prevItems: selectedItems,
      prevTotalPrice: totalPrice
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주문서</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 배송 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>배송 정보</Text>

          <View style={styles.addressContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={24} color="#666" />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>배송 주소</Text>
              {isLoadingAddress ? (
                <Text style={styles.addressText}>배송지 정보를 불러오는 중...</Text>
              ) : address ? (
                <>
                  <Text style={styles.addressText}>
                    [{address.zonecode}] {address.roadAddress}
                  </Text>
                  <Text style={styles.addressDetail}>
                    {address.detailAddress}
                  </Text>
                </>
              ) : (
                <Text style={styles.addressText}>배송지를 입력해주세요</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleAddressSearch}
            >
              <Ionicons name="chevron-forward" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 주문 상품 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상품</Text>

          {orderItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.productItem,
                index < orderItems.length - 1 && styles.productItemWithBorder,
              ]}
            >
              <Image source={item.image} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{item.brand}</Text>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productQuantity}>{item.quantity}개</Text>
                <Text style={styles.productPrice}>{item.price} WORK</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 결제 금액 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 금액</Text>

          <View style={styles.paymentInfoContainer}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>보유 WORK</Text>
              <Text style={styles.paymentValue}>
                {publicKey ? `${paymentInfo.availableWorkCoins.toFixed(1)}` : '지갑 연결 필요'} WORK
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>상품 WORK</Text>
              <Text style={styles.paymentValue}>
                {paymentInfo.productTotal.toFixed(1)} WORK
              </Text>
            </View>

            <View style={[styles.paymentRow, styles.finalPaymentRow]}>
              <Text style={styles.paymentLabel}>결제 후 WORK</Text>
              <Text style={[
                styles.paymentValue,
                (!publicKey || paymentInfo.finalAmount < 0) && styles.insufficientBalance
              ]}>
                {publicKey ? `${paymentInfo.finalAmount.toFixed(1)}` : '-'} WORK
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 결제 버튼 */}
      <View style={styles.paymentButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.paymentButton,
            (!publicKey || paymentInfo.finalAmount < 0) && styles.disabledButton
          ]}
          onPress={handlePayment}
          disabled={!publicKey || paymentInfo.finalAmount < 0}
        >
          <Text style={styles.paymentButtonText}>
            {!publicKey ? '지갑 연결 필요' : paymentInfo.finalAmount < 0 ? 'WORK 부족' : '결제하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 3,
  },
  addressDetail: {
    fontSize: 16,
    fontWeight: "500",
  },
  editButton: {
    padding: 5,
  },
  productItem: {
    flexDirection: "row",
    paddingVertical: 15,
  },
  productItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productBrand: {
    fontSize: 14,
    color: "#888",
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentInfoContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  finalPaymentRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginTop: 10,
    paddingTop: 15,
  },
  paymentLabel: {
    fontSize: 16,
    color: "#333",
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  paymentButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  insufficientBalance: {
    color: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});

export default CheckoutScreen;
