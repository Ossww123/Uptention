import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as Linking from 'expo-linking';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { launchImageLibrary } from 'react-native-image-picker';
import { removeToken } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const DEVNET_CONNECTION = new Connection('https://api.devnet.solana.com', {
  wsEndpoint: 'wss://api.devnet.solana.com/',
  commitment: 'confirmed'
});

const YOUR_TOKEN_MINT = new PublicKey('5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n');

const APP_URL_SCHEME = 'com.anonymous.uptention';

const ProfileScreen = ({ navigation }) => {
  const { 
    publicKey,
    tokenBalance,
    solBalance,
    handleConnectWallet,
    handleDisconnectWallet,
    connecting
  } = useWallet();
  
  const { userId, authToken, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  // 로그아웃 함수를 컴포넌트 내부로 이동
  const handleLogout = async () => {
    try {
      await logout();
      // 로그아웃 후 앱 초기 화면(로그인 화면)으로 이동
      Alert.alert(
        "로그아웃",
        "로그아웃 되었습니다.",
        [
          {
            text: "확인",
            onPress: () => {
              // 앱을 처음부터 다시 실행하도록 앱 상태 재설정
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  // 잔액 조회 함수
  const fetchBalances = async (walletAddress) => {
    try {
      // SOL 잔액 조회
      const solBalance = await DEVNET_CONNECTION.getBalance(new PublicKey(walletAddress));
      setSolBalance(solBalance / LAMPORTS_PER_SOL);

      // SPL 토큰 잔액 조회
      const tokenAccounts = await DEVNET_CONNECTION.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: YOUR_TOKEN_MINT }
      );

      if (tokenAccounts.value.length > 0) {
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        setTokenBalance(balance);
      } else {
        setTokenBalance(0);
      }
    } catch (error) {
      console.error('잔액 조회 오류:', error);
      setSolBalance(null);
      setTokenBalance(null);
    }
  };

  // 사용자 정보 조회 함수
  const fetchUserInfo = async () => {
    if (!userId || !authToken) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      setUserInfo(response.data);
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleImageUpload = async () => {
    if (!userId || !authToken) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 1,
        includeBase64: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
        return;
      }

      const selectedImage = result.assets[0];
      
      // 이미지 파일로 FormData 생성
      const formData = new FormData();
      formData.append('profileImage', {
        uri: selectedImage.uri,
        type: selectedImage.type,
        name: selectedImage.fileName || 'profile.jpg',
      });

      // 프로필 이미지 업로드 API 호출
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${userId}/profiles`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('성공', '프로필 이미지가 업데이트되었습니다.');
        fetchUserInfo(); // 프로필 정보 새로고침
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      Alert.alert('오류', '이미지 업로드에 실패했습니다.');
    }
  };

  const handleDeleteImage = async () => {
    if (!userId || !authToken) return;

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/users/${userId}/profiles`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.status === 200) {
        Alert.alert('성공', '프로필 이미지가 삭제되었습니다.');
        setShowDeleteButton(false);
        fetchUserInfo(); // 프로필 정보 새로고침
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      Alert.alert('오류', '이미지 삭제에 실패했습니다.');
    }
  };

  const handleImagePress = () => {
    handleImageUpload();  // 항상 갤러리 열기
  };

  const handleLongPress = () => {
    if (userInfo?.profileImage) {
      setShowDeleteButton(!showDeleteButton);  // X 버튼 토글
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleImagePress}
            >
              <Ionicons name="pencil" size={15} color="black" />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={handleImagePress}
                onLongPress={handleLongPress}
                delayLongPress={500}
              >
                {userInfo?.profileImage ? (
                  <>
                    <Image 
                      source={{ uri: `${userInfo.profileImage}?w=100&h=100&t=cover&f=webp` }} 
                      style={styles.profileImage}
                    />
                    {showDeleteButton && (
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={handleDeleteImage}
                      >
                        <Ionicons name="close-circle" size={24} color="red" />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View style={styles.profileImage} />
                )}
              </TouchableOpacity>
              <View style={styles.infoContainer}>
                <View style={styles.textContainer}>
                  <View style={styles.profileDetails}>
                    <Text style={styles.label}>사원번호:</Text>
                    <Text style={styles.label}>이름:</Text>
                    <Text style={styles.label}>아이디:</Text>
                  </View>
                  <View style={styles.profileValues}>
                    <Text style={styles.value}>{userInfo?.employeeNumber || '-'}</Text>
                    <Text style={styles.value}>{userInfo?.name || '-'}</Text>
                    <Text style={styles.value}>{userInfo?.username || '-'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 지갑 섹션 */}
          <View style={styles.walletSection}>
            <Text style={styles.sectionTitle}>지갑</Text>
            <View style={styles.tokenContainer}>
              <View style={styles.tokenItem}>
                <Text style={styles.tokenLabel}>WORK</Text>
                <Text style={styles.tokenValue}>
                  {tokenBalance !== null ? `${tokenBalance}` : '연결 필요'}
                </Text>
              </View>
              <View style={styles.tokenItem}>
                <Text style={styles.tokenLabel}>SOLANA</Text>
                <Text style={styles.tokenValue}>
                  {solBalance !== null ? `${solBalance}` : '연결 필요'}
                </Text>
              </View>
            </View>
          </View>

          {/* 메뉴 섹션 */}
          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('OrderHistory')}
            >
              <Text style={styles.menuText}>주문 내역</Text>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('GiftBox')}
            >
              <Text style={styles.menuText}>선물함</Text>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>NFT</Text>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 130,
    borderRadius: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingRight: 10,
  },
  profileImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    overflow: 'visible',
    marginRight: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E1E1E1',
    borderRadius: 10,
  },
  profileDetails: {
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
    color: '#000',
  },
  value: {
    fontSize: 14,
    marginBottom: 10,
    color: '#000',
    textAlign: 'right',
  },
  editButton: {
    position: 'absolute',
    right: 8,
    top: 5,
    zIndex: 1,
  },
  walletSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginTop: 30,
    borderWidth: 2,
    borderColor: '#F8F8F8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tokenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  tokenLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 33,
    marginTop: 30,
    marginHorizontal: -20,
    borderWidth: 2,
    borderColor: '#F8F8F8',

  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    width: '40%',
    alignSelf: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
  activeNavText: {
    color: '#FF8C00',
  },
  profileValues: {
    justifyContent: 'center',
    height: '100%',
    alignItems: 'flex-end',
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
});

export default ProfileScreen; 