import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, TextInput, Modal, ActionSheetIOS } from 'react-native';
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
import FCMUtils from '../utils/FCMUtils';
import { post } from '../services/api';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const DEVNET_CONNECTION = new Connection('https://api.devnet.solana.com', {
  wsEndpoint: 'wss://api.devnet.solana.com/',
  commitment: 'confirmed'
});

const YOUR_TOKEN_MINT = new PublicKey('5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n');

const APP_URL_SCHEME = 'com.anonymous.uptention';

const DEFAULT_PROFILE_IMAGE_URL = 'https://ddnwvg9t77g5o.cloudfront.net/profile-default.jpg';

// 이미지 처리 관련 상수
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const ProfileScreen = ({ navigation }) => {
  const { 
    publicKey,
    tokenBalance,
    solBalance,
    handleConnectWallet,
    handleDisconnectWallet,
    connecting,
    fetchBalances
  } = useWallet();
  
  const { userId, authToken, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 이미지 미리보기 관련 상태 추가
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 잔액 변화 감지 및 화면 업데이트
  useEffect(() => {
    if (publicKey) {
      fetchBalances(publicKey);
    }
  }, [publicKey, fetchBalances]);

  useEffect(() => {
    console.log('WORK 토큰 잔액 변화 감지:', tokenBalance);
  }, [tokenBalance]);

  useEffect(() => {
    console.log('SOL 잔액 변화 감지:', solBalance);
  }, [solBalance]);

  // 로그아웃 함수 수정
  const handleLogout = async () => {
    try {
      // FCM 토큰 가져오기
      const fcmToken = await FCMUtils.getFCMToken();
      
      // 확인 대화상자 표시
      Alert.alert(
        "로그아웃",
        "정말 로그아웃 하시겠습니까?",
        [
          {
            text: "취소",
            style: "cancel"
          },
          {
            text: "로그아웃",
            onPress: async () => {
              try {
                // 지갑 연결 해제 처리
                if (publicKey) {
                  await handleDisconnectWallet();
                }

                // 서버에 로그아웃 요청 (FCM 토큰은 api.js에서 자동으로 헤더에 추가)
                await post('/logout', {});
                console.log('로그아웃 API 요청 성공');
                
                // Context를 통한 로그아웃 처리
                await logout();
                
                // 알림 표시
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
                console.error('로그아웃 처리 오류:', error);
                Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
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

  // 이미지 파일 유효성 검사
  const validateImageFile = (file) => {
    // 파일 크기 검사
    if (file.fileSize > MAX_FILE_SIZE) {
      Alert.alert(
        '파일 크기 초과',
        `이미지 크기는 2MB 이하여야 합니다. 현재 크기: ${(file.fileSize / (1024 * 1024)).toFixed(2)}MB`
      );
      return false;
    }

    // MIME 타입 검사
    const fileType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      Alert.alert('지원하지 않는 형식', '지원하는 이미지 형식은 JPG, JPEG, PNG 입니다.');
      return false;
    }

    return true;
  };

  // 중앙 크롭된 미리보기 생성
  const createCenteredCropPreview = async (imageUri, imageWidth, imageHeight) => {
    try {
      // 이미지의 가로/세로 중 작은 값 기준으로 정사각형 크롭
      const size = Math.min(imageWidth, imageHeight);
      const xOffset = Math.floor((imageWidth - size) / 2);
      const yOffset = Math.floor((imageHeight - size) / 2);
      
      // expo-image-manipulator로 미리보기용 이미지 크롭
      const manipResult = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: xOffset,
              originY: yOffset,
              width: size,
              height: size,
            },
          },
          // 미리보기 용도이므로 적당한 크기로 리사이징
          { resize: { width: 300, height: 300 } }
        ],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      
      return {
        previewUri: manipResult.uri,
        cropInfo: {
          x: xOffset,
          y: yOffset,
          size: size,
          originalWidth: imageWidth,
          originalHeight: imageHeight
        }
      };
    } catch (error) {
      console.error('이미지 미리보기 생성 오류:', error);
      return null;
    }
  };

  // 이미지 업로드 함수 수정
  const handleImageUpload = async () => {
    if (!userId || !authToken) {
      Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      return;
    }

    // iOS의 경우 ActionSheet가 자동으로 닫히므로 Android에서만 모달을 닫음
    if (Platform.OS === 'android') {
      setShowEditModal(false);
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

      const image = result.assets[0];
      
      // 이미지 파일 유효성 검사
      if (!validateImageFile(image)) {
        return;
      }

      // 원본 이미지 상태 저장
      setSelectedImage(image);
      
      // 중앙 크롭된 미리보기 생성
      const previewResult = await createCenteredCropPreview(
        image.uri,
        image.width,
        image.height
      );
      
      if (previewResult) {
        setPreviewImage(previewResult);
        setShowPreviewModal(true);
      } else {
        Alert.alert('오류', '이미지 미리보기를 생성하는데 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택 중 문제가 발생했습니다.');
    }
  };

  // 미리보기 확인 후 업로드 처리
  const confirmAndUpload = async () => {
    try {
      // 미리보기 모달 닫기
      setShowPreviewModal(false);
      
      // 원본 이미지로 FormData 생성
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
    } finally {
      // 임시 상태 초기화
      setSelectedImage(null);
      setPreviewImage(null);
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
        fetchUserInfo(); // 프로필 정보 새로고침
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      Alert.alert('오류', '이미지 삭제에 실패했습니다.');
    }
  };

  const handleEditPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '프로필 사진 변경', '프로필 사진 삭제', '비밀번호 변경'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          anchor: 150,
          alignItems: 'center',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleImageUpload();
          } else if (buttonIndex === 2) {
            Alert.alert(
              '프로필 사진 삭제',
              '프로필 사진을 삭제하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { 
                  text: '삭제', 
                  style: 'destructive',
                  onPress: handleDeleteImage 
                }
              ]
            );
          } else if (buttonIndex === 3) {
            setShowPasswordModal(true);
          }
        }
      );
    } else {
      // Android의 경우 Modal을 사용하여 커스텀 UI 구현
      setShowEditModal(true);
    }
  };

  const validatePasswordInput = (text) => {
    // 영문, 숫자, 허용된 특수문자만 입력 가능
    return text.replace(/[^A-Za-z0-9!@#$%^&*]/g, '');
  };

  const handlePasswordChange = async () => {
    // 비밀번호 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }
  
    // 비밀번호 검증 (영문, 숫자 포함, 특수문자 선택적, 8~15자)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,15}$/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert('오류', '비밀번호는 영문, 숫자가 반드시 포함되어야 하며 8~15자여야 합니다.');
      return;
    }
  
    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }
  
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/users/${userId}/password`,
        {
          currentPassword: currentPassword,
          newPassword: newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.status === 200) {
        Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다.');
        // 모달 닫고 입력값 초기화
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      if (error.response?.status === 400) {
        Alert.alert('오류', '현재 비밀번호가 일치하지 않습니다.');
      } else {
        Alert.alert('오류', '비밀번호 변경 중 문제가 발생했습니다.');
      }
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
              onPress={handleEditPress}
            >
              <View style={styles.editIconContainer}>
                <Ionicons name="settings-outline" size={22} color="#FF8C00" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <View style={styles.profileImageContainer}>
                {userInfo?.profileImage ? (
                  <Image 
                    source={{ uri: `${userInfo.profileImage}?w=105&h=105&t=cover&f=webp` }} 
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileImage} />
                )}
              </View>
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
                <Text style={[styles.tokenValue, { color: '#FF8C00' }]}>
                  {tokenBalance !== null ? `${tokenBalance} ` : '연결 필요'}
                </Text>
              </View>
              <View style={styles.tokenItem}>
                <Text style={styles.tokenLabel}>SOLANA</Text>
                <Text style={[styles.tokenValue, { color: '#FF8C00' }]}>
                  {solBalance !== null ? `${Number(solBalance).toFixed(4)} ` : '연결 필요'}
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
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('NFT')}
            >
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

          {/* 비밀번호 변경 모달 */}
          <Modal
            visible={showPasswordModal}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>비밀번호 변경</Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="현재 비밀번호"
                    value={currentPassword}
                    onChangeText={(text) => setCurrentPassword(validatePasswordInput(text))}
                    secureTextEntry={secureTextEntry}
                    maxLength={15}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  >
                    <Ionicons
                      name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="새 비밀번호"
                    value={newPassword}
                    onChangeText={(text) => setNewPassword(validatePasswordInput(text))}
                    secureTextEntry={secureTextEntry}
                    maxLength={15}
                  />
                </View>
                <Text style={styles.passwordHint}>
                  비밀번호는 영문, 숫자 포함 8~15자 (특수문자 !@#$%^&* 사용 가능)
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="새 비밀번호 확인"
                    value={confirmPassword}
                    onChangeText={(text) => setConfirmPassword(validatePasswordInput(text))}
                    secureTextEntry={secureTextEntry}
                    maxLength={15}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowPasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handlePasswordChange}
                  >
                    <Text style={styles.confirmButtonText}>변경</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* 프로필 편집 모달 */}
          <Modal
            visible={showEditModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.editModalContainer}>
              <View style={styles.editModalContent}>
                <Text style={styles.editModalTitle}>프로필 편집</Text>
                <TouchableOpacity
                  style={styles.editModalButton}
                  onPress={async () => {
                    setShowEditModal(false);
                    // 약간의 딜레이 후 갤러리 실행
                    setTimeout(() => {
                      handleImageUpload();
                    }, 100);
                  }}
                >
                  <Text style={styles.editModalButtonText}>프로필 사진 변경</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalButton, userInfo?.profileImage === DEFAULT_PROFILE_IMAGE_URL && { opacity: 0.5 }]}
                  onPress={() => {
                    setShowEditModal(false);
                    if (userInfo?.profileImage !== DEFAULT_PROFILE_IMAGE_URL) {
                      Alert.alert(
                        '프로필 사진 삭제',
                        '프로필 사진을 삭제하시겠습니까?',
                        [
                          { text: '취소', style: 'cancel' },
                          { 
                            text: '삭제', 
                            style: 'destructive',
                            onPress: handleDeleteImage 
                          }
                        ]
                      );
                    }
                  }}
                  disabled={userInfo?.profileImage === DEFAULT_PROFILE_IMAGE_URL}
                >
                  <Text style={styles.editModalButtonText}>프로필 사진 삭제</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editModalButton}
                  onPress={() => {
                    setShowEditModal(false);
                    setShowPasswordModal(true);
                  }}
                >
                  <Text style={styles.editModalButtonText}>비밀번호 변경</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.editModalCancelButton]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.editModalCancelText}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* 이미지 미리보기 모달 추가 */}
          <Modal
            visible={showPreviewModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowPreviewModal(false)}
          >
            <View style={styles.previewModalContainer}>
              <View style={styles.previewModalContent}>
                <Text style={styles.previewModalTitle}>프로필 이미지 미리보기</Text>
                
                {previewImage && (
                  <View style={styles.previewImageContainer}>
                    <Image 
                      source={{ uri: previewImage.previewUri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.previewHint}>
                      이미지는 1:1 비율로 가운데가 크롭됩니다
                    </Text>
                  </View>
                )}
                
                <View style={styles.previewModalButtons}>
                  <TouchableOpacity
                    style={[styles.previewModalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowPreviewModal(false);
                      setSelectedImage(null);
                      setPreviewImage(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.previewModalButton, styles.confirmButton]}
                    onPress={confirmAndUpload}
                  >
                    <Text style={styles.confirmButtonText}>적용</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const additionalStyles = StyleSheet.create({
  previewModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  previewModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  previewImageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  previewModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  previewModalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#FF8C00',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

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
    right: -12,
    top: -12,
    zIndex: 1,
  },
  editIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#FF8C00',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  editModalButton: {
    width: '100%',
    paddingVertical: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editModalButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
  },
  editModalCancelButton: {
    marginBottom: 0,
    backgroundColor: '#f8f8f8',
    borderColor: '#f8f8f8',
  },
  editModalCancelText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  passwordHint: {
    fontSize: 11,
    color: '#888',
    marginBottom: 10,
    marginTop: -5,
    alignSelf: 'flex-start',
    paddingLeft: 10,
  },
  
  ...additionalStyles,
});

export default ProfileScreen; 