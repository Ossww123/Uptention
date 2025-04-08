// AddressDetailScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const AddressDetailScreen = ({ navigation, route }) => {
  const {
    address,
    prevScreen,
    product,
    prevItems,
    prevTotalPrice,
    orderId,
    item,
  } = route.params;
  const [detailAddress, setDetailAddress] = useState("");

  // AddressDetailScreen.js 파일 내부의 handleSave 함수 수정
  const handleSave = () => {
    const completeAddress = {
      ...address,
      detailAddress,
    };

    // PaymentBottomSheet에서 온 경우
    if (prevScreen === "PaymentBottomSheet") {
      navigation.navigate("ProductDetail", {
        address: completeAddress,
        product: product,
        productId: product.itemId,
        showPaymentSheet: true,
      });
    }
    // DeliveryAddressBottomSheet에서 온 경우
    else if (prevScreen === "DeliveryAddressBottomSheet") {
      // 기존 item의 모든 정보를 유지하고 주소만 업데이트
      const updatedItem = {
        ...item,
        address: `${address.roadAddress} ${detailAddress}`,
      };

      navigation.navigate("GiftDetail", {
        item: updatedItem,
        refreshKey: Date.now(),
        showDeliveryAddressBottomSheet: true,
      });
    }
    // CheckoutScreen에서 온 경우 (이 부분 수정)
    else {
      // route.params에서 필요한 모든 파라미터 추출
      const { productId } = route.params || {};

      // navigation.reset({
      //   index: 3,
      //   routes: [
      //     { name: 'StoreMain' },
      //     {
      //       name: 'ProductDetail',
      //       params: { productId: productId }  // 저장된 productId 사용
      //     },
      //     { name: 'Cart' },
      //     {
      //       name: 'CheckoutScreen',
      //       params: {
      //         address: completeAddress,
      //         selectedItems: prevItems,
      //         totalPrice: prevTotalPrice,
      //         productId: productId  // productId도 함께 전달 (필요시)
      //       }
      //     }
      //   ]
      // });
      navigation.reset({
        index: 2, // 2번째 화면(결제페이지)으로 이동
        routes: [
          { name: "StoreMain" },
          { name: "Cart" },
          {
            name: "CheckoutScreen",
            params: {
              address: completeAddress,
              selectedItems: prevItems,
              totalPrice: prevTotalPrice,
            },
          },
        ],
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.addressContainer}>
        <Text style={styles.label}>도로명 주소</Text>
        <Text style={styles.addressText}>
          [{address.zonecode}] {address.roadAddress}
        </Text>
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
    backgroundColor: "#FFFFFF",
  },
  addressContainer: {
    marginBottom: 20,
  },
  detailContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  buildingName: {
    fontSize: 14,
    color: "#666",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#F8F8F8",
  },
  button: {
    backgroundColor: "#FF8C00",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default AddressDetailScreen;
