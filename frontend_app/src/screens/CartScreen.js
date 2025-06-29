import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { get, post, patch, del } from "../services/api";

const CartScreen = ({ navigation }) => {
  // 장바구니 상품 상태 관리
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isQuantityEditing, setIsQuantityEditing] = useState(false);

  // 수량 변경 디바운싱을 위한 타이머 ref
  const quantityTimersRef = useRef({});

  // 컴포넌트 마운트 시 장바구니 데이터 로드
  useEffect(() => {
    fetchCartItems();

    // 컴포넌트 언마운트 시 모든 타이머 정리
    return () => {
      Object.values(quantityTimersRef.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  // 장바구니 데이터 불러오기
  const fetchCartItems = async () => {
    try {
      setLoading(true);

      const { data, ok } = await get("/shopping-cart");

      if (!ok) {
        throw new Error(data.message || "장바구니 조회에 실패했습니다.");
      }

      // API에서 받아온 데이터를 UI에 맞게 변환
      const formattedData = data.map((item) => ({
        ...item,
        selected: true, // 기본적으로 모든 아이템 선택 상태로 설정
        image: { uri: item.thumbnail }, // 이미지 URI 설정
      }));

      setCartItems(formattedData);
    } catch (error) {
      console.error("장바구니 조회 오류:", error);
      Alert.alert("오류", error.message || "장바구니 불러오기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 수량 변경 함수 (디바운싱 적용)
  const updateQuantity = (cartId, increment) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.cartId === cartId) {
          const currentQuantity =
            item.quantity === "" ? 0 : Number(item.quantity);

          // 새 수량 계산 (1~99 범위 제한)
          const newQuantity = Math.max(
            1,
            Math.min(99, currentQuantity + increment)
          );

          // 이전 타이머가 있다면 취소
          if (quantityTimersRef.current[cartId]) {
            clearTimeout(quantityTimersRef.current[cartId]);
          }

          // 새 타이머 설정 (500ms 후 API 호출)
          quantityTimersRef.current[cartId] = setTimeout(() => {
            updateCartItemQuantity(cartId, newQuantity);
            // 타이머 참조 삭제
            delete quantityTimersRef.current[cartId];
          }, 500);

          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.price,
          };
        }
        return item;
      })
    );
  };

  // 키보드 입력으로 수량 변경 함수
  const handleQuantityChange = (cartId, text) => {
    // 숫자만 입력 가능하도록 필터링
    const numericValue = text.replace(/[^0-9]/g, "");

    // 빈 문자열은 그대로 허용 (임시 상태로 저장)
    let newValue = numericValue;

    // 앞에 오는 0 제거 (예: "01" -> "1"), 단 완전히 비어있게 되면 빈 문자열 유지
    if (newValue !== "") {
      newValue = newValue.replace(/^0+/, "") || "";
    }

    // 숫자로 변환 (빈 문자열이면 0으로 처리)
    let numValue = newValue === "" ? 0 : parseInt(newValue, 10);

    // 99 초과 값 처리
    if (numValue > 99) numValue = 99;

    // 문자열 값으로 변환 (빈 문자열이면 그대로 유지)
    newValue = newValue === "" ? "" : numValue.toString();

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.cartId === cartId) {
          // 이전 타이머가 있다면 취소
          if (quantityTimersRef.current[cartId]) {
            clearTimeout(quantityTimersRef.current[cartId]);
          }

          // 빈 문자열이 아닌 경우에만 API 호출과 totalPrice 계산
          if (newValue !== "") {
            // 새 타이머 설정 (1초 후 API 호출)
            quantityTimersRef.current[cartId] = setTimeout(() => {
              // 실제 API 호출 전에 유효성 검사 (1~99 범위)
              const validValue = Math.max(1, Math.min(99, numValue));
              updateCartItemQuantity(cartId, validValue);
              delete quantityTimersRef.current[cartId];

              // 입력값이 0이었다면 UI에서 1로 표시 (API 호출 후)
              if (numValue === 0) {
                setCartItems((prevItems) =>
                  prevItems.map((item) =>
                    item.cartId === cartId
                      ? { ...item, quantity: 1, totalPrice: item.price }
                      : item
                  )
                );
              }
            }, 1000);

            return {
              ...item,
              quantity: newValue, // 임시로 빈 문자열 혹은 입력된 값 그대로 표시
              totalPrice: numValue * item.price,
            };
          } else {
            // 빈 문자열인 경우 quantity만 업데이트하고 totalPrice는 유지
            return {
              ...item,
              quantity: newValue, // 빈 문자열 그대로 표시
            };
          }
        }
        return item;
      })
    );
  };

  // 키보드 입력이 끝난 후 호출되는 함수
  const handleQuantityBlur = (cartId, quantity) => {
    // 빈 문자열이거나 0인 경우 기본값 1로 설정
    if (quantity === "" || quantity === "0") {
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.cartId === cartId) {
            return {
              ...item,
              quantity: 1,
              totalPrice: 1 * item.price,
            };
          }
          return item;
        })
      );

      // API 호출로 서버에 업데이트
      updateCartItemQuantity(cartId, 1);
      return;
    }

    // 문자열을 숫자로 변환
    const numValue = parseInt(quantity, 10);

    // 숫자가 유효하지 않은 경우 기본값 1로 설정
    if (isNaN(numValue) || numValue < 1) {
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.cartId === cartId) {
            return {
              ...item,
              quantity: 1,
              totalPrice: 1 * item.price,
            };
          }
          return item;
        })
      );

      // API 호출로 서버에 업데이트
      updateCartItemQuantity(cartId, 1);
    } else if (numValue > 99) {
      // 99 초과인 경우 최대값 99로 설정
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.cartId === cartId) {
            return {
              ...item,
              quantity: 99,
              totalPrice: 99 * item.price,
            };
          }
          return item;
        })
      );

      // API 호출로 서버에 업데이트
      updateCartItemQuantity(cartId, 99);
    }
  };

  // 수량 변경 API 호출
  const updateCartItemQuantity = async (cartId, quantity) => {
    try {
      const { ok, data } = await patch(`/shopping-cart/${cartId}/quantity`, {
        quantity,
      });

      if (!ok) {
        throw new Error(data.message || "수량 변경에 실패했습니다.");
      }

      console.log(`카트 아이템 ${cartId} 수량이 ${quantity}로 변경되었습니다.`);
    } catch (error) {
      console.error("장바구니 수량 변경 오류:", error);
      Alert.alert(
        "오류",
        error.message || "장바구니 수량 변경에 실패했습니다."
      );
      // 오류 발생 시 장바구니 새로고침
      fetchCartItems();
    }
  };

  // 상품 선택 토글 함수
  const toggleSelection = (cartId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartId === cartId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // 선택 삭제 함수
  const deleteSelected = async () => {
    const selectedCartIds = cartItems
      .filter((item) => item.selected)
      .map((item) => item.cartId);

    if (selectedCartIds.length === 0) {
      Alert.alert("알림", "선택된 상품이 없습니다.");
      return;
    }

    try {
      const { ok, data } = await del("/shopping-cart", {
        body: JSON.stringify(selectedCartIds),
      });

      if (!ok) {
        throw new Error(data.message || "삭제에 실패했습니다.");
      }

      // 성공적으로 삭제된 경우, UI에서도 해당 아이템 제거
      setCartItems((prevItems) => prevItems.filter((item) => !item.selected));

      // 알림 표시
      Alert.alert("알림", "선택한 상품이 장바구니에서 삭제되었습니다.");
    } catch (error) {
      console.error("장바구니 삭제 오류:", error);
      Alert.alert("오류", error.message || "장바구니 삭제에 실패했습니다.");
    }
  };

  // 상품 개별 삭제 함수
  const deleteItem = async (cartId) => {
    try {
      const { ok, data } = await del("/shopping-cart", {
        body: JSON.stringify([cartId]), // 배열 형태로 전송
      });

      if (!ok) {
        throw new Error(data.message || "삭제에 실패했습니다.");
      }

      // 성공적으로 삭제된 경우, UI에서도 해당 아이템 제거
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.cartId !== cartId)
      );

      // 알림 표시
      Alert.alert("알림", "상품이 장바구니에서 삭제되었습니다.");
    } catch (error) {
      console.error("장바구니 삭제 오류:", error);
      Alert.alert("오류", error.message || "장바구니 삭제에 실패했습니다.");
    }
  };

  // 전체 선택/해제 함수
  const toggleSelectAll = () => {
    const allSelected = cartItems.every((item) => item.selected);
    setCartItems((prevItems) =>
      prevItems.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  // 장바구니 새로고침
  const handleRefresh = () => {
    setRefreshing(true);
    fetchCartItems().finally(() => setRefreshing(false));
  };

  // 상품 검증 및 결제 페이지로 이동
  const handleCheckout = async () => {
    const selectedItems = cartItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      Alert.alert("알림", "선택된 상품이 없습니다.");
      return;
    }

    try {
      setLoading(true);

      // 주문 검증 API 요청 데이터 준비
      const orderVerifyData = selectedItems.map((item) => ({
        itemId: item.itemId,
        price: item.price,
        quantity: item.quantity,
      }));

      // 주문 검증 API 호출
      const { data, ok, status } = await post(
        "/orders/verify",
        orderVerifyData
      );

      if (ok) {
        // 검증 성공 시 결제 페이지로 이동
        const totalPrice = selectedItems.reduce(
          (total, item) => total + item.totalPrice,
          0
        );

        // cartId를 포함한 선택된 아이템 정보 전달
        const itemsWithCartId = selectedItems.map((item) => ({
          ...data.find((verifiedItem) => verifiedItem.itemId === item.itemId),
          cartId: item.cartId,
        }));

        navigation.navigate("CheckoutScreen", {
          selectedItems: itemsWithCartId,
          totalPrice: totalPrice,
        });
      } else {
        // 에러 코드에 따른 처리
        let errorMessage = "상품 검증 중 오류가 발생했습니다.";

        if (status === 400) {
          errorMessage = data.message || "재고가 부족한 상품이 있습니다.";
        } else if (status === 404) {
          errorMessage = data.message || "존재하지 않는 상품이 있습니다.";
        } else if (status === 409) {
          errorMessage = data.message || "상품 가격이 변경되었습니다.";
        }

        Alert.alert("주문 확인", errorMessage, [
          {
            text: "확인",
            onPress: handleRefresh, // 오류 발생 시 장바구니 새로고침
          },
        ]);
      }
    } catch (error) {
      console.error("주문 검증 오류:", error);
      Alert.alert(
        "오류",
        "주문 검증 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  // 장바구니 상품 목록 렌더링
  const renderCartItems = () => {
    return cartItems.map((item) => {
      // 이미지 URL 최적화 (80x80 크기에 맞게 설정)
      const optimizedImageUrl = item.image.uri
        ? `${item.image.uri}?w=80&h=80&t=cover&f=webp`
        : item.image;
      return (
        <View key={item.cartId} style={styles.cartItem}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleSelection(item.cartId)}
          >
            <Ionicons
              name={item.selected ? "checkbox" : "square-outline"}
              size={24}
              color={item.selected ? "#FF8C00" : "#999"}
            />
          </TouchableOpacity>

          <Image
            source={item.image.uri ? { uri: optimizedImageUrl } : item.image}
            style={styles.itemImage}
          />

          <View style={styles.itemInfo}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleContainer}>
                <Text style={styles.itemBrand}>{item.brand}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteItem(item.cartId)}
                style={styles.deleteButton}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.itemPrice}>{item.price} WORK</Text>

            <View style={styles.quantityStockContainer}>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={() => {
                    // 입력 필드에 포커스가 있는 경우 먼저 blur 처리
                    if (isQuantityEditing) {
                      handleQuantityBlur(item.cartId, item.quantity);
                      setIsQuantityEditing(false);
                    }
                    // 그 다음 수량 감소 (수량이 1보다 클 때만 작동)
                    if (Number(item.quantity) > 1) {
                      updateQuantity(item.cartId, -1);
                    }
                  }}
                  style={[
                    styles.quantityButton,
                    Number(item.quantity) <= 1 && styles.quantityButtonDisabled,
                  ]}
                  disabled={Number(item.quantity) <= 1}
                >
                  <Text
                    style={[
                      styles.quantityButtonText,
                      Number(item.quantity) <= 1 &&
                        styles.quantityButtonTextDisabled,
                    ]}
                  >
                    -
                  </Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={String(item.quantity)}
                  onChangeText={(text) =>
                    handleQuantityChange(item.cartId, text)
                  }
                  onBlur={() => {
                    handleQuantityBlur(item.cartId, item.quantity);
                    setIsQuantityEditing(false);
                  }}
                  onFocus={() => {
                    setIsQuantityEditing(true);
                    const currentQuantity = String(item.quantity);
                    if (currentQuantity === "1") {
                      setCartItems((prevItems) =>
                        prevItems.map((i) =>
                          i.cartId === item.cartId ? { ...i, quantity: "" } : i
                        )
                      );
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus={true}
                />

                <TouchableOpacity
                  onPress={() => {
                    // 수량이 99보다 작을 때만 작동
                    if (Number(item.quantity) < 99) {
                      updateQuantity(item.cartId, 1);
                    }
                  }}
                  style={[
                    styles.quantityButton,
                    Number(item.quantity) >= 99 &&
                      styles.quantityButtonDisabled,
                  ]}
                  disabled={Number(item.quantity) >= 99}
                >
                  <Text
                    style={[
                      styles.quantityButtonText,
                      Number(item.quantity) >= 99 &&
                        styles.quantityButtonTextDisabled,
                    ]}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 재고 수량에 따른 조건부 스타일링 */}
              {item.stockQuantity <= 5 ? (
                <Text style={styles.lowStockText}>
                  남은 재고: {item.stockQuantity}
                </Text>
              ) : (
                <Text style={styles.stockText}>
                  남은 재고: {item.stockQuantity}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    });
  };

  // 장바구니 비었을 때 렌더링
  const renderEmptyCart = () => {
    return (
      <View style={styles.emptyCartContainer}>
        <Image
          source={require("../../assets/cart-icon.png")}
          style={styles.emptyCartIcon}
        />
        <Text style={styles.emptyCartTitle}>장바구니가 비어있어요.</Text>
        <Text style={styles.emptyCartSubtitle}>
          장바구니를 새로운 상품으로 채워 보세요.
        </Text>

        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate("StoreMain")}
        >
          <Text style={styles.browseButtonText}>상품 보러 가기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 계산 섹션 렌더링
  const renderSummary = () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    const itemCount = selectedItems.length;
    const totalPrice = selectedItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>주문 상품 수</Text>
          <Text style={styles.summaryValue}>총 {itemCount}개</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 결제금액</Text>
          <Text style={styles.summaryPrice}>
            {totalPrice.toLocaleString()} WORK
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (selectedItems.length === 0 || isQuantityEditing) &&
              styles.disabledButton,
          ]}
          onPress={handleCheckout}
          disabled={selectedItems.length === 0 || loading || isQuantityEditing}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.checkoutButtonText}>
              결제 {totalPrice.toLocaleString()} WORK
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // 전체 선택 헤더 렌더링
  const renderSelectionHeader = () => {
    const allSelected =
      cartItems.length > 0 && cartItems.every((item) => item.selected);

    return (
      <View style={styles.selectionHeader}>
        <TouchableOpacity
          style={styles.selectAllContainer}
          onPress={toggleSelectAll}
        >
          <View
            style={[
              styles.checkbox,
              allSelected ? styles.checkboxSelected : styles.checkboxUnselected,
            ]}
          >
            {allSelected && (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.selectAllText}>
            전체 선택 ({cartItems.filter((item) => item.selected).length}/
            {cartItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={deleteSelected}>
          <Text style={styles.selectionHeaderAction}>선택 삭제</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 로딩 화면 렌더링
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF8C00" />
      <Text style={styles.loadingText}>장바구니를 불러오는 중...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>장바구니</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        renderLoading()
      ) : cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <View style={styles.contentContainer}>
          <ScrollView style={styles.scrollContainer}>
            <Text style={styles.sectionTitle}>주문 상세</Text>
            {renderSelectionHeader()}
            {renderCartItems()}
          </ScrollView>
          {renderSummary()}
        </View>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#888888",
    marginTop: 10,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: "#FF8C00",
  },
  checkboxUnselected: {
    backgroundColor: "#EEEEEE",
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: "500",
  },
  selectionHeaderAction: {
    fontSize: 14,
    color: "#888888",
  },
  cartItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    position: "relative",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: "#f5f5f5",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  itemTitleContainer: {
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  itemBrand: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // 기존 quantity 스타일을 TextInput용으로 수정
  quantityInput: {
    fontSize: 16,
    fontWeight: "500",
    width: 40,
    textAlign: "center",
    padding: 0,
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    backgroundColor: "#FFFFFF",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#555555",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  checkoutButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 15,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyCartIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
    tintColor: "#CCCCCC",
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: "#888888",
    marginBottom: 30,
    textAlign: "center",
  },
  browseButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  quantityStockContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  stockText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  lowStockText: {
    fontSize: 14,
    color: "#FF5722",
    fontWeight: "500",
  },
  quantityButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  quantityButtonTextDisabled: {
    color: "#CCCCCC",
  },
});

export default CartScreen;
