// AddressDetailScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
  const [error, setError] = useState("");

  const MAX_LENGTH = 30; // 최대 글자 수 제한

  // 상세주소 유효성 검사 및 필터링
  const validateAndFilterAddress = (text) => {
    // 특수문자 필터링 (허용: 숫자, 영문, 한글, 공백, 쉼표, 하이픈, 괄호)
    const filteredText = text.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣,\-()]/g, "");

    // 연속된 공백 하나로 변환
    const normalizedText = filteredText.replace(/\s+/g, " ");

    // 최대 길이 제한
    const trimmedText = normalizedText.substring(0, MAX_LENGTH);

    setDetailAddress(trimmedText);

    // 유효성 검사
    if (trimmedText.trim().length < 2) {
      setError("상세주소는 최소 2자 이상 입력해주세요");
    } else {
      setError("");
    }
  };

  // AddressDetailScreen.js 파일 내부의 handleSave 함수 수정
  const handleSave = () => {
    // 앞뒤 공백 제거
    const trimmedAddress = detailAddress.trim();

    if (trimmedAddress.length < 2) {
      setError("상세주소는 최소 2자 이상 입력해주세요");
      return;
    } // 완전한 주소 객체 생성
    const completeAddress = {
      zonecode: address.zonecode,
      roadAddress: address.roadAddress,
      detailAddress: trimmedAddress,
      buildingName: address.buildingName || "",
    };

    // 전체 주소 문자열 생성 (필요한 경우 사용)
    const fullAddressString = address.zonecode
      ? `[${address.zonecode}] ${address.roadAddress} ${trimmedAddress}`
      : `${address.roadAddress} ${trimmedAddress}`;

    // PaymentBottomSheet에서 온 경우
    if (prevScreen === "PaymentBottomSheet") {
      navigation.navigate("ProductDetail", {
        address: completeAddress, // 주소 객체 전체를 전달
        product: product,
        productId: product.itemId,
        showPaymentSheet: true,
        fromAddressDetail: true, // 주소 입력에서 돌아왔음을 표시
      });
    }
    // DeliveryAddressBottomSheet에서 온 경우
    else if (prevScreen === "DeliveryAddressBottomSheet") {
      // 기존 item의 모든 정보를 유지하고 주소만 업데이트
      // 기존 item의 모든 정보를 유지하고 주소만 업데이트
      const updatedItem = {
        ...item,
        address: fullAddressString, // 문자열 형식 주소 사용
        addressObject: completeAddress, // 객체 형식 주소도 함께 저장 (필요시)
      };

      navigation.navigate("GiftDetail", {
        item: updatedItem,
        refreshKey: Date.now(),
        showDeliveryAddressBottomSheet: true,
      });
    }
    // CheckoutScreen에서 온 경우
    else {
      // route.params에서 필요한 모든 파라미터 추출
      const { productId } = route.params || {};

      navigation.reset({
        index: 2,
        routes: [
          { name: "StoreMain" },
          { name: "Cart" },
          {
            name: "CheckoutScreen",
            params: {
              address: {
                zonecode: address.zonecode,
                roadAddress: address.roadAddress,
                detailAddress: trimmedAddress,
                buildingName: address.buildingName || ''
              },
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
          style={[styles.input, error ? styles.inputError : null]}
          value={detailAddress}
          onChangeText={validateAndFilterAddress}
          placeholder="상세 주소 입력 (예: 101동 1502호)"
          placeholderTextColor="#999"
          maxLength={MAX_LENGTH}
          returnKeyType="done"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.charCount}>
          {detailAddress.length}/{MAX_LENGTH}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!detailAddress.trim() || error) && styles.buttonDisabled,
        ]}
        onPress={handleSave}
        disabled={!detailAddress.trim() || !!error}
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
    position: "relative",
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
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    position: "absolute",
    right: 0,
    bottom: -20,
    fontSize: 12,
    color: "#999",
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
