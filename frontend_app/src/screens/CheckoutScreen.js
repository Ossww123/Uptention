import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CheckoutScreen = ({ navigation, route }) => {
  // CartScreen에서 전달받은 선택된 상품 정보와 총 가격
  const { selectedItems = [], totalPrice = 0 } = route.params || {};
  const [address, setAddress] = useState(null);

  // 라우트 파라미터에서 주소 정보 받아오기
  useEffect(() => {
    if (route.params?.address) {
      setAddress(route.params.address);
    }
  }, [route.params]);

  // 더미 데이터 - 배송 정보
  const shippingAddress = {
    address: "경상북도 진평시 진평길 55-5",
    detail: "최강아파트 211호",
  };

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

  // 결제 정보 (CartScreen에서 전달받은 총액 사용)
  const paymentInfo = {
    availableWorkCoins: 10.0, // 실제 환경에서는 API로 사용자의 보유 코인 조회
    productTotal: totalPrice > 0 ? totalPrice : 5.8, // 전달받은 총액 사용 또는 더미 데이터
    get finalAmount() {
      return this.availableWorkCoins - this.productTotal;
    }, // 계산값
    paymentAmount: totalPrice > 0 ? totalPrice : 1.0, // 결제 금액
  };

  // 뒤로 가기
  const handleGoBack = () => {
    navigation.goBack();
  };

  // 결제하기
  const handlePayment = () => {
    if (!address || !address.detailAddress) {
      Alert.alert('배송지 정보', '배송지 주소를 입력해주세요.');
      return;
    }
    // 결제 처리 로직
    // 실제 환경에서는 여기서 결제 API 호출 등의 로직이 들어갈 수 있습니다
    navigation.navigate("PaymentComplete");
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

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 배송 정보 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>배송 정보</Text>

          <View style={styles.addressContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={24} color="#666" />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>배송 주소</Text>
              {address ? (
                <>
                  <Text
                    style={styles.addressText}
                  >{`[${address.zonecode}] ${address.roadAddress}`}</Text>
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
              onPress={() => navigation.navigate("AddressSearch")}
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
                {paymentInfo.availableWorkCoins.toFixed(1)} WORK
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
              <Text style={styles.paymentValue}>
                {paymentInfo.finalAmount.toFixed(1)} WORK
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 결제 버튼 */}
      <View style={styles.paymentButtonContainer}>
        <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
          <Text style={styles.paymentButtonText}>
            결제 {paymentInfo.paymentAmount.toFixed(1)} WORK
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
});

export default CheckoutScreen;
