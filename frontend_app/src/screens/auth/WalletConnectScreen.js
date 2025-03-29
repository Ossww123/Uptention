import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// 글로벌 Buffer 객체가 없는 경우 추가
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const APP_URL_SCHEME = 'uptention'; // 앱 URL 스키마 설정

const WalletConnectScreen = ({ onWalletConnected }) => {
  const [loading, setLoading] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(null);
  const [deepLink, setDeepLink] = useState(null);
  const [dappKeyPair] = useState(nacl.box.keyPair());
  const [sharedSecret, setSharedSecret] = useState(null);
  const [session, setSession] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [connecting, setConnecting] = useState(false);
  
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
  
  // 지갑 연결 정보 저장
  const saveWalletConnection = async (walletPublicKey) => {
    try {
      await AsyncStorage.setItem('wallet_public_key', walletPublicKey);
      // 연결 성공 시 다음 화면으로 이동
      setTimeout(() => {
        onWalletConnected();
      }, 1000);
    } catch (error) {
      console.error('Failed to save wallet connection:', error);
      Alert.alert('오류', '지갑 연결 정보 저장 중 오류가 발생했습니다.');
    }
  };

  // DeepLink 처리 설정
  useEffect(() => {
    // 앱이 시작될 때 초기 URL 가져오기
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        setDeepLink(url);
      }
    };

    getInitialURL();

    // DeepLink 리스너 등록
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      linkingSubscription.remove();
    };
  }, []);

  // DeepLink 핸들러
  const handleDeepLink = useCallback(({ url }) => {
    setDeepLink(url);
  }, []);

  // DeepLink 변경 시 처리
  useEffect(() => {
    if (!deepLink) return;

    try {
      // URL에서 데이터 추출
      const [urlWithoutParams, queryString] = deepLink.split('?');
      const isConnectPath = urlWithoutParams.includes('onConnect');
      const isDisconnectPath = urlWithoutParams.includes('onDisconnect');
      const params = new URLSearchParams(queryString);

      // 에러 처리
      if (params.get("errorCode")) {
        console.error('Connection error:', params.get("errorMessage"));
        Alert.alert('연결 오류', params.get("errorMessage") || '지갑 연결 중 오류가 발생했습니다.');
        return;
      }

      // 연결 처리
      if (isConnectPath) {
        const phantom_encryption_public_key = params.get("phantom_encryption_public_key");
        const data = params.get("data");
        const nonce = params.get("nonce");

        if (!phantom_encryption_public_key || !data || !nonce) {
          console.error('Missing connection parameters');
          return;
        }

        // 공유 암호 생성
        const sharedSecretDapp = nacl.box.before(
          bs58.decode(phantom_encryption_public_key),
          dappKeyPair.secretKey
        );

        // 데이터 복호화
        const connectData = decryptPayload(
          data,
          nonce,
          sharedSecretDapp
        );

        setSharedSecret(sharedSecretDapp);
        setSession(connectData.session);
        setPublicKey(connectData.public_key);
        
        // 지갑 연결 성공 처리
        saveWalletConnection(connectData.public_key);
      }

      // 연결 해제 처리
      if (isDisconnectPath) {
        setPublicKey(null);
        setSharedSecret(null);
        setSession(null);
        
        // 지갑 연결 정보 삭제
        AsyncStorage.removeItem('wallet_public_key');
      }
    } catch (error) {
      console.error('Error processing deeplink:', error);
      Alert.alert('오류', '지갑 연결 처리 중 오류가 발생했습니다.');
    }
  }, [deepLink, dappKeyPair.secretKey, decryptPayload, saveWalletConnection]);
  
  // 지갑 연결 함수
  const connect = async () => {
    try {
      setConnecting(true);
      
      // 리다이렉트 URL 생성
      const redirectUrl = Linking.createURL('onConnect');
      
      // 연결 URL 파라미터 설정
      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        cluster: "devnet", // Solana 네트워크 설정
        app_url: "https://j12d211.p.ssafy.io", // 앱 URL
        redirect_link: redirectUrl
      });

      // Phantom 앱 딥링크 URL 생성
      const url = Platform.OS === 'android'
        ? `https://phantom.app/ul/v1/connect?${params.toString()}`
        : `phantom://ul/v1/connect?${params.toString()}`;

      // Phantom 앱 열기
      await Linking.openURL(url);
    } catch (err) {
      console.error('Connection error:', err);
      Alert.alert('연결 오류', 'Phantom 지갑 연결 중 오류가 발생했습니다.');
    } finally {
      setConnecting(false);
    }
  };
  
  // 지갑 연결 해제 함수
  const disconnect = async () => {
    try {
      if (!session || !sharedSecret) {
        console.error('No active session to disconnect');
        return;
      }
      
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
    } catch (err) {
      console.error('Disconnect error:', err);
      Alert.alert('연결 해제 오류', 'Phantom 지갑 연결 해제 중 오류가 발생했습니다.');
    }
  };
  
  // Phantom 앱 설치 확인 및 처리
  const checkPhantomInstallation = async () => {
    try {
      // Android에서는 앱이 설치되어 있는지 직접 확인할 수 없음
      // iOS에서는 canOpenURL로 확인 가능
      if (Platform.OS === 'ios') {
        const canOpenPhantom = await Linking.canOpenURL('phantom://');
        setIsPhantomInstalled(canOpenPhantom);
      } else {
        // Android는 일단 설치되어 있다고 가정하고 진행
        setIsPhantomInstalled(true);
      }
    } catch (error) {
      console.error('Failed to check Phantom installation:', error);
      setIsPhantomInstalled(false);
    }
  };
  
  // 컴포넌트 마운트 시 Phantom 설치 확인
  useEffect(() => {
    checkPhantomInstallation();
  }, []);
  
  // Phantom 앱 다운로드
  const openPhantomDownload = () => {
    const url = 'https://phantom.app/download';
    Linking.openURL(url);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/phantom-logo.png')} 
          style={styles.walletLogo}
          defaultSource={require('../../../assets/phantom-logo.png')}
        />
        
        <Text style={styles.title}>지갑 연동하기</Text>
        
        <Text style={styles.description}>
          UPTENTION에서 코인을 채굴하고 보상을 받기 위해 
          Phantom 지갑을 연동해주세요.
        </Text>
        
        {isPhantomInstalled === false ? (
          // Phantom이 설치되어 있지 않은 경우
          <View style={styles.notInstalledContainer}>
            <Text style={styles.notInstalledText}>
              Phantom 앱이 설치되어 있지 않습니다.
            </Text>
            
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={openPhantomDownload}
            >
              <Text style={styles.buttonText}>Phantom 다운로드</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Phantom이 설치되어 있는 경우
          <View style={styles.walletActions}>
            {publicKey ? (
              // 지갑이 연결된 경우
              <View style={styles.connectedContainer}>
                <View style={styles.walletInfo}>
                  <Ionicons name="wallet" size={24} color="#4CAF50" />
                  <Text style={styles.walletAddress}>
                    {`${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}`}
                  </Text>
                </View>
                
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={styles.disconnectButton}
                    onPress={disconnect}
                  >
                    <Text style={styles.disconnectButtonText}>연결 해제</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.continueButton}
                    onPress={onWalletConnected}
                  >
                    <Text style={styles.buttonText}>계속하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // 지갑이 연결되지 않은 경우
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={connect}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Image 
                      source={require('../../../assets/phantom-icon.png')} 
                      style={styles.buttonIcon}
                      defaultSource={require('../../../assets/phantom-icon.png')}
                    />
                    <Text style={styles.buttonText}>Phantom 지갑 연결하기</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>지갑 연동 시 혜택</Text>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C00" />
            <Text style={styles.benefitText}>포인트를 코인으로 변환</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C00" />
            <Text style={styles.benefitText}>상품 구매 및 선물하기</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C00" />
            <Text style={styles.benefitText}>우수사원 NFT 획득</Text>
          </View>
        </View>
        
        <Text style={styles.securityNote}>
          UPTENTION은 사용자의 지갑 보안을 최우선으로 생각합니다.
          개인 키는 절대 저장하지 않으며, 블록체인 상의 거래만 진행합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default WalletConnectScreen;