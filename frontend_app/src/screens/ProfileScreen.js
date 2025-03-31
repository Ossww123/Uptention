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
import axios from 'axios';
import { API_BASE_URL } from '../config/config';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const DEVNET_CONNECTION = new Connection('https://api.devnet.solana.com', {
  wsEndpoint: 'wss://api.devnet.solana.com/',
  commitment: 'confirmed'
});

const YOUR_TOKEN_MINT = new PublicKey('5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n');

const APP_URL_SCHEME = 'com.anonymous.uptention';

// 암호화 함수
const encryptPayload = (payload, sharedSecret) => {
  const nonce = nacl.randomBytes(24);
  const encryptedPayload = nacl.box.after(
    Buffer.from(JSON.stringify(payload)),
    nonce,
    sharedSecret
  );
  return [nonce, encryptedPayload];
};

const ProfileScreen = ({ navigation }) => {
  const { 
    publicKey, setPublicKey,
    tokenBalance, setTokenBalance,
    sharedSecret, setSharedSecret,
    session, setSession,
    solBalance, setSolBalance
  } = useWallet();
  
  const [deepLink, setDeepLink] = useState("");
  const [dappKeyPair] = useState(nacl.box.keyPair());
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  // 복호화 함수
  const decryptPayload = useCallback((data, nonce, sharedSecret) => {
    try {
      const decryptedData = nacl.box.open.after(
        bs58.decode(data),
        bs58.decode(nonce),
        sharedSecret
      );

      if (!decryptedData) {
        throw new Error("Failed to decrypt payload");
      }

      return JSON.parse(Buffer.from(decryptedData).toString("utf8"));
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }, []);

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
    try {
      // TODO: 로그인 구현 시 수정 필요
      // - userId는 로그인한 사용자의 ID로 대체
      // - Authorization 헤더의 토큰은 로그인 시 받은 JWT 토큰으로 대체
      // - 예시: const { userId, token } = useAuth();
      const response = await axios.get(`${API_BASE_URL}/api/users/4`, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJjYXRlZ29yeSI6IkF1dGhvcml6YXRpb24iLCJ1c2VySWQiOjQsInJvbGUiOiJST0xFX0FETUlOIiwiaWF0IjoxNzQzMzg0NTI1LCJleHAiOjE3NDU5NzY1MjV9.xUPE1swCITKU4f9vdxqnmUDo2N2kRkv4Ig41jWrBb4o'
        }
      });
      
      setUserInfo(response.data);
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    const initializeDeepLinks = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        setDeepLink(initialUrl);
      }
    };
    initializeDeepLinks();
    const listener = Linking.addEventListener("url", handleDeepLink);
    return () => {
      listener.remove();
    };
  }, []);

  const handleDeepLink = ({ url }) => {
    setDeepLink(url);
  };

  useEffect(() => {
    if (!deepLink) return;

    try {
      const [urlWithoutParams, queryString] = deepLink.split('?');
      const isConnectPath = urlWithoutParams.includes('onConnect');
      const isDisconnectPath = urlWithoutParams.includes('onDisconnect');
      const params = new URLSearchParams(queryString);

      if (params.get("errorCode")) {
        console.error('Connection error:', params.get("errorMessage"));
        return;
      }

      if (isConnectPath) {
        const phantom_encryption_public_key = params.get("phantom_encryption_public_key");
        const data = params.get("data");
        const nonce = params.get("nonce");

        if (!phantom_encryption_public_key || !data || !nonce) {
          return;
        }

        const sharedSecretDapp = nacl.box.before(
          bs58.decode(phantom_encryption_public_key),
          dappKeyPair.secretKey
        );

        const connectData = decryptPayload(
          data,
          nonce,
          sharedSecretDapp
        );

        setSharedSecret(sharedSecretDapp);
        setSession(connectData.session);
        setPublicKey(connectData.public_key);
        
        // 지갑 연결 후 잔액 조회
        fetchBalances(connectData.public_key);
      }

      if (isDisconnectPath) {
        setPublicKey(null);
        setSharedSecret(null);
        setSession(null);
        setSolBalance(null);
        setTokenBalance(null);
      }
    } catch (error) {
      console.error('Error processing deeplink:', error);
    }
  }, [deepLink, decryptPayload, dappKeyPair.secretKey]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      const redirectUrl = Linking.createURL('onConnect');
      console.log('Redirect URL:', redirectUrl); // 디버깅용

      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        cluster: "devnet",
        app_url: "https://phantom.app",
        redirect_link: redirectUrl
      });

      const url = `https://phantom.app/ul/v1/connect?${params.toString()}`;
      console.log('Connection URL:', url); // 디버깅용
      
      await Linking.openURL(url);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('연결 오류', '팬텀 지갑 연결 중 오류가 발생했습니다.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      const redirectUrl = Linking.createURL('onDisconnect');
      const payload = { session };
      const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);

      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        nonce: bs58.encode(nonce),
        redirect_link: redirectUrl,
        payload: bs58.encode(encryptedPayload)
      });

      const url = Platform.OS === 'android'
        ? `https://phantom.app/ul/v1/disconnect?${params.toString()}`
        : `phantom://ul/v1/disconnect?${params.toString()}`;

      await Linking.openURL(url);
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('연결 해제 오류', '팬텀 지갑 연결 해제 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* 상단 지갑 아이콘 */}
          <View style={styles.headerSection}>
            <TouchableOpacity 
              style={styles.walletIconContainer}
              onPress={publicKey ? handleDisconnectWallet : handleConnectWallet}
            >
              <Ionicons 
                name={publicKey ? "wallet" : "wallet-outline"} 
                size={25} 
                color={publicKey ? "#4CAF50" : "black"} 
              />
              {publicKey && <View style={styles.connectedDot} />}
            </TouchableOpacity>
          </View>

          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={15} color="black" />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <View style={styles.profileImageContainer}>
                {userInfo?.profileImage ? (
                  <Image 
                    source={{ uri: userInfo.profileImage }} 
                    style={styles.profileImage}
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

          <TouchableOpacity style={styles.logoutButton}>
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
  headerSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  walletIconContainer: {
    padding: 8,
  },
  connectedDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
});

export default ProfileScreen; 