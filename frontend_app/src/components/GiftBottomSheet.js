import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { post, get } from '../services/api';
import { API_BASE_URL } from '../config/config';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { height } = Dimensions.get('window');

const SHOP_WALLET_ADDRESS = '4uDQ7uwEe1iy8R5vYtSvD6vNfcyeTLy8YKyVe44RKR92';

const GiftBottomSheet = ({ 
  visible, 
  onClose, 
  product,
  navigation
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [showUserList, setShowUserList] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { tokenBalance, publicKey, sendSPLToken } = useWallet();
  const { authToken, userId } = useAuth();

  // 사용자 목록 조회
  const fetchUsers = async (cursor = null) => {
    try {
      console.log('=== 사용자 목록 조회 시작 ===');
      
      const params = {
        userRole: 'ROLE_MEMBER',
        sort: 'NAMES_ASC',
        size: 20,
        excludeUserId: userId
      };

      if (cursor) {
        params.cursor = cursor;
      }

      console.log('API 요청 파라미터:', params);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/users`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API 응답 데이터:', response.data);

      if (response.status === 200) {
        const newUsers = response.data.users
          .filter(user => {
            console.log('필터링 중인 사용자:', user.userId, '현재 사용자:', userId);
            return user.userId !== userId && user.userId !== Number(userId);
          })
          .map(user => ({
            id: user.userId,
            name: user.name,
            employeeNumber: user.employeeNumber,
            wallet: user.wallet
          }));

        console.log('필터링 후 사용자 데이터:', newUsers);

        if (cursor) {
          setUsers(prev => [...prev, ...newUsers]);
        } else {
          setUsers(newUsers);
        }

        setHasNextPage(response.data.hasNextPage);
        setNextCursor(response.data.nextCursor);
      }
    } catch (error) {
      console.error('=== 사용자 목록 조회 오류 ===');
      console.error('에러 타입:', error.name);
      console.error('에러 메시지:', error.message);
      console.error('에러 상태 코드:', error.response?.status);
      console.error('에러 응답 데이터:', error.response?.data);
      
      Alert.alert(
        '오류',
        '사용자 목록을 불러오는데 실패했습니다.',
        [{ text: '확인' }]
      );
    }
  };

  // 모달이 열릴 때 사용자 목록 조회
  useEffect(() => {
    if (showUserList) {
      fetchUsers();
    }
  }, [showUserList]);

  // 사용자 선택 처리
  const handleSelectUser = (user) => {
    console.log('=== 사용자 선택 ===');
    console.log('선택된 사용자 전체 정보:', JSON.stringify(user, null, 2));
    console.log('선택된 사용자 ID:', user.id);
    
    setSelectedUser(user);
    setShowUserList(false);
  };

  // 사용자 목록 렌더링
  const renderUserItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        index !== users.length - 1 && styles.userItemWithBorder
      ]}
      onPress={() => handleSelectUser(item)}
    >
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmployeeNumber}>{item.employeeNumber}</Text>
    </TouchableOpacity>
  );

  const handleGift = async () => {
    try {
      console.log('=== 선물하기 시작 ===');
      console.log('선택된 사용자 정보:', JSON.stringify(selectedUser, null, 2));
      
      if (!selectedUser || !selectedUser.id) {
        console.log('선택된 사용자 없음 또는 ID 없음:', selectedUser);
        Alert.alert('알림', '받는 사람을 선택해주세요.');
        return;
      }

      setLoading(true);
      
      // 1. 주문 검증 API 요청 데이터 준비
      const orderVerifyData = [{
        itemId: product.itemId,
        price: product.price,
        quantity: 1
      }];
      
      console.log('=== 선물하기 검증 시작 ===');
      console.log('검증 요청 데이터:', JSON.stringify(orderVerifyData, null, 2));
      
      // 2. 주문 검증 API 호출
      const { data: verifyData, ok, status } = await post("/orders/verify", orderVerifyData);
      
      console.log('검증 응답:', JSON.stringify(verifyData, null, 2));
      console.log('검증 상태:', ok ? '성공' : '실패');
      
      if (ok) {
        console.log('=== 검증 성공: 선물하기 진행 ===');
        
        // 3. 선물하기 처리 로직
        const giftData = {
          itemId: product.itemId,
          receiverId: selectedUser.id
        };

        console.log('선물하기 요청 데이터:', JSON.stringify(giftData, null, 2));

        const response = await axios.post(
          `${API_BASE_URL}/api/orders/gift`,
          giftData,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('선물하기 API 응답:', JSON.stringify(response.data, null, 2));

        const { orderId, paymentAmount } = response.data;

        if (orderId && paymentAmount) {
          console.log('=== 토큰 전송 시작 ===');
          console.log('주문 번호:', orderId);
          console.log('결제 금액:', paymentAmount);
          
          // 4. 토큰 전송
          const memo = `ORDER_${orderId}`;
          await sendSPLToken(
            SHOP_WALLET_ADDRESS,
            paymentAmount.toString(),
            memo
          );

          console.log('=== 토큰 전송 완료 ===');

          onClose();
          navigation.navigate('OrderComplete', {
            orderId: orderId,
            paymentAmount: paymentAmount,
            isGift: true,
            recipientName: selectedUser.name
          });
        }
      } else {
        // 검증 실패 처리
        let errorMessage = "상품 검증 중 오류가 발생했습니다.";
        
        if (verifyData?.code) {
          switch (verifyData.code) {
            case 'X002':
              errorMessage = "검증할 상품 목록이 없습니다.";
              break;
            case 'ITEM_001':
              errorMessage = "상품이 존재하지 않습니다.";
              break;
            case 'ITEM_004':
              errorMessage = "재고가 부족한 상품이 있습니다.";
              break;
            case 'ITEM_006':
              errorMessage = "상품 가격이 변경되었습니다.";
              break;
            case 'ITEM_007':
              errorMessage = "삭제된 상품입니다.";
              break;
            default:
              errorMessage = verifyData.message || "상품 검증 중 오류가 발생했습니다.";
          }
        }
        
        console.log('=== 검증 실패 ===');
        console.log('실패 코드:', verifyData?.code);
        console.log('실패 사유:', errorMessage);
        
        Alert.alert("주문 확인", errorMessage, [
          {
            text: "확인",
            onPress: onClose
          }
        ]);
      }
    } catch (error) {
      console.error('=== 선물하기 오류 ===');
      console.error('에러 타입:', error.name);
      console.error('에러 메시지:', error.message);
      console.error('에러 응답:', error.response?.data);
      
      let errorMessage = "선물하기 처리 중 오류가 발생했습니다.";
      
      if (error.response?.data?.code) {
        switch (error.response.data.code) {
          case 'ITEM_004':
            errorMessage = "재고가 부족한 상품이 있습니다.";
            break;
          case 'X002':
            errorMessage = "[receiverId] 선물 받는 사용자 id는 필수입니다.";
            break;
          case 'USER_001':
            errorMessage = "사용자를 찾을 수 없습니다.";
            break;
          default:
            errorMessage = error.response.data.message || "선물하기 처리 중 오류가 발생했습니다.";
        }
      }
      
      Alert.alert(
        "오류",
        errorMessage,
        [
          {
            text: "확인",
            onPress: onClose
          }
        ]
      );
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.headerTitle}>선물하기</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* 상품 정보 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>선물할 상품</Text>
              <View style={styles.productItem}>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productQuantity}>1개</Text>
                <Text style={styles.productPrice}>{product.price} WORK</Text>
              </View>
            </View>

            {/* 받는 사람 정보 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>받는 사람</Text>
              
              {/* 사용자 선택 버튼 */}
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.searchInput}
                  onPress={() => setShowUserList(true)}
                >
                  <Text style={selectedUser ? styles.selectedUserText : styles.searchPlaceholder}>
                    {selectedUser ? `${selectedUser.name} (${selectedUser.employeeNumber})` : '받는 사람을 선택하세요'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 결제 금액 섹션 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>결제 금액</Text>
              <View style={styles.paymentInfoContainer}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>보유 WORK</Text>
                  <Text style={styles.paymentValue}>{tokenBalance || '0'} WORK</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>상품 WORK</Text>
                  <Text style={styles.paymentValue}>{product.price} WORK</Text>
                </View>
                <View style={[styles.paymentRow, styles.finalPaymentRow]}>
                  <Text style={styles.paymentLabel}>결제 후 WORK</Text>
                  <Text style={styles.paymentValue}>
                    {tokenBalance ? (Number(tokenBalance) - product.price).toFixed(1) : '0'} WORK
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* 선물하기 버튼 */}
          <View style={styles.giftButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.giftButton,
                !selectedUser && styles.giftButtonDisabled
              ]}
              onPress={handleGift}
              disabled={loading || !selectedUser}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.giftButtonText}>선물하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 사용자 목록 모달 */}
      <Modal
        transparent
        visible={showUserList}
        animationType="fade"
        onRequestClose={() => setShowUserList(false)}
      >
        <View style={styles.userListModal}>
          <View style={styles.userListContainer}>
            <View style={styles.userListHeader}>
              <Text style={styles.userListTitle}>받는 사람 선택</Text>
              <TouchableOpacity 
                style={styles.closeUserList}
                onPress={() => setShowUserList(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.employeeNumber}
              onEndReached={() => {
                if (hasNextPage) {
                  fetchUsers(nextCursor);
                }
              }}
              onEndReachedThreshold={0.5}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  productItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  productBrand: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  selectedUserText: {
    color: '#000',
    fontSize: 16,
  },
  paymentInfoContainer: {
    backgroundColor: '#f8f8f0',
    borderRadius: 12,
    padding: 15,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  finalPaymentRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    marginTop: 10,
    paddingTop: 15,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#333',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  giftButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  giftButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  giftButtonDisabled: {
    backgroundColor: '#ccc',
  },
  giftButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userListModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  userListContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: height * 0.7,
  },
  userListHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeUserList: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15
  },
  userItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmployeeNumber: {
    fontSize: 14,
    color: '#666',
  },
});

export default GiftBottomSheet; 