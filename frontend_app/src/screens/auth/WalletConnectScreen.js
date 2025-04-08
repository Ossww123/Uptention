// src/screens/auth/WalletConnectScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/config';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const WalletConnectScreen = ({ navigation, onWalletConnected }) => {
  const { 
    handleConnectWallet,
    connecting,
    isPhantomInstalled,
    publicKey
  } = useWallet();
  const { userId, authToken } = useAuth();

  // publicKey가 변경될 때마다 실행
  React.useEffect(() => {
    const connectWallet = async () => {
      if (publicKey) {
        try {
          console.log('API 요청 정보:', {
            url: `${API_BASE_URL}/api/users/${userId}/wallet?wallet=${publicKey}`,
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          // 지갑 연결 API 호출
          const response = await axios.post(
            `${API_BASE_URL}/api/users/${userId}/wallet?wallet=${publicKey}`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.status === 200) {
            console.log('지갑 연결 성공:', response.data);
            // onWalletConnected 콜백만 호출
            onWalletConnected();
            navigation.replace('MainApp');
          }
        } catch (error) {
          console.error('지갑 연결 API 오류:', error);
          console.error('에러 상세 정보:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          Alert.alert(
            '오류',
            `지갑 연결에 실패했습니다: ${error.response?.data?.message || error.message}`,
            [{ text: '확인' }]
          );
        }
      }
    };

    connectWallet();
  }, [publicKey, userId, authToken, onWalletConnected, navigation]);

  const handleConnect = async () => {
    try {
      await handleConnectWallet();
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  const openPhantomDownload = () => {
    const url = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/us/app/phantom-solana-wallet/id1598432977'
      : 'https://play.google.com/store/apps/details?id=app.phantom';
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../../assets/tie_icon.png")}
          style={styles.walletLogo}
          defaultSource={require("../../../assets/phantom-logo.png")}
        />

        <Text style={styles.title}>지갑 연동하기</Text>

        <Text style={styles.description}>
          UPTENTION에서 코인을 채굴하고 보상을 받기 위해 Phantom 지갑을
          연동해주세요.
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
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Phantom 지갑 연결하기</Text>
            )}
          </TouchableOpacity>
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
          UPTENTION은 사용자의 지갑 보안을 최우선으로 생각합니다.  개인 키는 
          저장하지 않으며, 블록체인 상의 거래만 진행합니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  walletLogo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#555",
    lineHeight: 24,
  },
  notInstalledContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  notInstalledText: {
    fontSize: 16,
    color: "#FF3B30",
    marginBottom: 15,
    textAlign: "center",
  },
  downloadButton: {
    backgroundColor: "#674EA7",
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  walletActions: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },
  connectButton: {
    backgroundColor: "#674EA7",
    borderRadius: 30,
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  connectedContainer: {
    width: "100%",
    alignItems: "center",
  },
  walletInfo: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  balanceItem: {
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  benefitsContainer: {
    alignSelf: "stretch",
    marginTop: 40,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  securityNote: {
    fontSize: 14,
    textAlign: "center",
    color: "#888",
    marginTop: 30,
    fontStyle: "italic",
  },
});

export default WalletConnectScreen;
