// src/components/PaymentBottomSheet.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useAuth } from "../contexts/AuthContext";
import { getRecentDeliveryInfo, verifyOrder, createOrder } from '../api/order';

const { height } = Dimensions.get("window");

const SHOP_WALLET_ADDRESS = "4uDQ7uwEe1iy8R5vYtSvD6vNfcyeTLy8YKyVe44RKR92";

const PaymentBottomSheet = ({ visible, onClose, product, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { tokenBalance, publicKey, sendSPLToken } = useWallet();
  const { authToken } = useAuth();

  // 마지막 결제 시도 시간을 저장하는 ref
  const lastPaymentAttempt = useRef(0);
  const PAYMENT_COOLDOWN = 3000; // 3초 쿨다운

  // 최근 주소를 저장할 ref 추가
  const cachedAddress = useRef(null);

  // 최근 배송지 조회
  const fetchRecentAddress = async () => {
    try {
      // 이미 캐시된 주소가 있으면 캐시된 주소 사용
      if (cachedAddress.current) {
        setAddress(cachedAddress.current);
        setIsLoadingAddress(false);
        return;
      }

      setIsLoadingAddress(true);
      const response = await getRecentDeliveryInfo(authToken);

      if (response.ok && response.data) {
        // 주소를 캐시에 저장
        cachedAddress.current = response.data;
        setAddress(response.data);
      } else {
        setAddress(null);
      }
    } catch (error) {
      console.error("최근 배송지 조회 실패:", error);
      setAddress(null);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // 컴포넌트 마운트 시 최근 배송지 조회
  useEffect(() => {
    // 주소 검색에서 돌아온 경우가 아닐 때만 최근 배송지 조회
    if (!navigation.getState().routes.some(
      (route) => route.name === "AddressSearch" || route.name === "AddressDetail"
    )) {
      fetchRecentAddress();
    }
  }, []);

  // 바텀시트가 보일 때 주소 업데이트
  useEffect(() => {
    if (visible) {
      // 캐시된 주소가 있으면 바로 표시
      if (cachedAddress.current) {
        setAddress(cachedAddress.current);
        setIsLoadingAddress(false);
      } else {
        // 캐시된 주소가 없으면 새로 조회
        fetchRecentAddress();
      }
    }
  }, [visible]);

  // 라우트 파라미터에서 주소 정보 받아오기
  useEffect(() => {
    if (visible) {
      const currentRoute = navigation.getState().routes[navigation.getState().routes.length - 1];
      
      if (currentRoute.params?.address) {
        const receivedAddress = currentRoute.params.address;
        
        if (typeof receivedAddress === "object") {
          const newAddress = {
            zonecode: receivedAddress.zonecode || "",
            roadAddress: receivedAddress.roadAddress,
            detailAddress: receivedAddress.detailAddress,
            buildingName: receivedAddress.buildingName || "",
          };
          
          // 새 주소를 캐시에 저장
          cachedAddress.current = newAddress;
          setAddress(newAddress);
        } else if (typeof receivedAddress === "string") {
          const addressParts = receivedAddress.split(" ");
          const zonecodeMatch = addressParts[0].match(/\[(\d+)\]/);
          const zonecode = zonecodeMatch ? zonecodeMatch[1] : "";
          const detailAddress = addressParts[addressParts.length - 1];
          const roadAddress = zonecode
            ? addressParts.slice(1, -1).join(" ")
            : addressParts.slice(0, -1).join(" ");

          const newAddress = {
            zonecode,
            roadAddress,
            detailAddress,
            buildingName: "",
          };
          
          // 새 주소를 캐시에 저장
          cachedAddress.current = newAddress;
          setAddress(newAddress);
        }

        setIsLoadingAddress(false);
      }
    }
  }, [visible, navigation.getState()]);

  const handlePayment = async () => {
    try {
      // 현재 시간 체크
      const now = Date.now();

      // 이전 결제 시도로부터 3초가 지나지 않았다면 무시
      if (now - lastPaymentAttempt.current < PAYMENT_COOLDOWN) {
        console.log("결제 쿨다운 중입니다.");
        return;
      }

      // 결제 진행 중이면 중복 실행 방지
      if (isProcessing) {
        console.log("결제가 이미 진행 중입니다.");
        return;
      }

      if (!address) {
        Alert.alert("주문 실패", "배송 주소를 입력해주세요.");
        return;
      }

      setLoading(true);
      setIsProcessing(true);
      lastPaymentAttempt.current = now;

      // 전체 주소를 하나의 문자열로 결합 (우편번호 포함)
      const fullAddress = address.zonecode
        ? `[${address.zonecode}] ${address.roadAddress} ${address.detailAddress}`
        : `${address.roadAddress} ${address.detailAddress}`;

      // 1. 주문 검증 API 요청 데이터 준비
      const orderItems = [
        {
          itemId: product.itemId,
          price: product.price,
          quantity: 1,
        },
      ];

      console.log("=== 주문 검증 시작 ===");
      console.log("검증 요청 데이터:", JSON.stringify(orderItems, null, 2));

      // 2. 주문 검증 API 호출
      const verifyResponse = await verifyOrder(authToken, orderItems);

      console.log("검증 응답:", JSON.stringify(verifyResponse, null, 2));
      console.log("검증 상태:", verifyResponse.ok ? "성공" : "실패");

      if (verifyResponse.ok) {
        console.log("=== 검증 성공: 결제 진행 ===");

        // 3. 결제 처리 로직
        const orderData = {
          items: [
            {
              itemId: product.itemId,
              quantity: 1,
            },
          ],
          address: fullAddress,
        };

        console.log("결제 요청 데이터:", JSON.stringify(orderData, null, 2));

        const response = await createOrder(authToken, orderData);

        console.log("결제 API 응답:", JSON.stringify(response, null, 2));

        if (response.ok && response.data) {
          const { orderId, paymentAmount } = response.data;

          if (orderId && paymentAmount) {
            console.log("=== 토큰 전송 시작 ===");
            console.log("주문 번호:", orderId);
            console.log("결제 금액:", paymentAmount);

            // 4. 토큰 전송
            const memo = `ORDER_${orderId}`;
            await sendSPLToken(
              SHOP_WALLET_ADDRESS,
              paymentAmount.toString(),
              memo
            );

            console.log("=== 토큰 전송 완료 ===");

            onClose();
            navigation.navigate("OrderComplete", {
              orderId: orderId,
              paymentAmount: paymentAmount,
            });
          }
        }
      } else {
        // 검증 실패 처리
        let errorMessage = "상품 검증 중 오류가 발생했습니다.";

        if (verifyResponse.data?.code) {
          switch (verifyResponse.data.code) {
            case "X002":
              errorMessage = "검증할 상품 목록이 없습니다.";
              break;
            case "ITEM_001":
              errorMessage = "상품이 존재하지 않습니다.";
              break;
            case "ITEM_004":
              errorMessage = "재고가 부족한 상품이 있습니다.";
              break;
            case "ITEM_006":
              errorMessage = "상품 가격이 변경되었습니다.";
              break;
            case "ITEM_007":
              errorMessage = "삭제된 상품입니다.";
              break;
            default:
              errorMessage =
                verifyResponse.data.message || "상품 검증 중 오류가 발생했습니다.";
          }
        }

        console.log("=== 검증 실패 ===");
        console.log("실패 코드:", verifyResponse.data?.code);
        console.log("실패 사유:", errorMessage);

        Alert.alert("주문 확인", errorMessage, [
          {
            text: "확인",
            onPress: () => {
              onClose();
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      console.error("=== 결제 오류 ===");
      console.error("에러 타입:", error.name);
      console.error("에러 메시지:", error.message);
      console.error("에러 응답:", error.response?.data);

      let errorMessage = "결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.";

      if (error.response?.data?.code) {
        switch (error.response.data.code) {
          case "ITEM_004":
            errorMessage = "재고가 부족한 상품이 있습니다.";
            break;
          case "X002":
            errorMessage =
              error.response.data.message ||
              "[address] 배송 주소는 필수입니다.";
            break;
          case "ITEM_001":
            errorMessage = "상품이 존재하지 않습니다.";
            break;
          default:
            errorMessage =
              error.response.data.message ||
              "결제 처리 중 오류가 발생했습니다.";
        }
      }

      Alert.alert("오류", errorMessage, [
        {
          text: "확인",
          onPress: onClose,
        },
      ]);
    } finally {
      setLoading(false);
      setIsProcessing(false);

      // 3초 후에 다시 결제 가능하도록 설정
      setTimeout(() => {
        lastPaymentAttempt.current = 0;
      }, PAYMENT_COOLDOWN);
    }
  };

  // 주소 검색 화면으로 이동
  const handleAddressSearch = () => {
    navigation.navigate("AddressSearch", {
      prevScreen: "PaymentBottomSheet",
      product: product,
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.bottomSheet}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>배송 정보</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* 배송 정보 섹션 */}
            <View style={styles.section}>
              <View style={styles.addressContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={24} color="#666" />
                </View>
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>배송 주소</Text>
                  {isLoadingAddress ? (
                    <Text style={styles.addressText}>
                      배송지 정보를 불러오는 중...
                    </Text>
                  ) : address ? (
                    <>
                      <Text style={styles.addressText}>
                        {address.zonecode ? `[${address.zonecode}] ` : ""}
                        {address.roadAddress}
                      </Text>
                      <Text style={styles.addressDetail}>
                        {address.detailAddress}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.addressText}>
                      배송지를 입력해주세요
                    </Text>
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
              <View style={styles.productItem}>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productQuantity}>1개</Text>
                <Text style={styles.productPrice}>{product.price} WORK</Text>
              </View>
            </View>

            {/* 결제 금액 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>결제 금액</Text>
              <View style={styles.paymentInfoContainer}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>보유 WORK</Text>
                  <Text style={styles.paymentValue}>
                    {publicKey ? `${tokenBalance} WORK` : "지갑 연결 필요"}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>상품 WORK</Text>
                  <Text style={styles.paymentValue}>{product.price} WORK</Text>
                </View>
                <View style={[styles.paymentRow, styles.finalPaymentRow]}>
                  <Text style={styles.paymentLabel}>결제 후 WORK</Text>
                  <Text
                    style={[
                      styles.paymentValue,
                      (!publicKey || tokenBalance - product.price < 0) &&
                        styles.insufficientBalance,
                    ]}
                  >
                    {publicKey
                      ? `${(tokenBalance - product.price).toFixed(1)} WORK`
                      : "-"}
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
                (!publicKey ||
                  tokenBalance - product.price < 0 ||
                  !address ||
                  isProcessing) &&
                  styles.disabledButton,
              ]}
              onPress={handlePayment}
              disabled={
                loading ||
                !publicKey ||
                tokenBalance - product.price < 0 ||
                !address ||
                isProcessing
              }
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.paymentButtonText}>
                  {!publicKey
                    ? "지갑 연결 필요"
                    : !address
                    ? "배송지 입력 필요"
                    : tokenBalance - product.price < 0
                    ? "WORK 부족"
                    : isProcessing
                    ? "결제 처리 중..."
                    : "결제하기"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    right: 15,
    padding: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
  },
  productBrand: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentInfoContainer: {
    backgroundColor: "#f8f8f8",
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
    borderTopColor: "#e5e5e5",
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
    borderTopColor: "#f0f0f0",
  },
  paymentButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  insufficientBalance: {
    color: "#FF3B30",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
});

export default PaymentBottomSheet;
