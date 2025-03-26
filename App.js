import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as Linking from 'expo-linking';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

// 앱의 URL 스킴 정의
const APP_URL_SCHEME = 'phantomtest';
const DEVNET_CONNECTION = new Connection('https://api.devnet.solana.com', {
  wsEndpoint: 'wss://api.devnet.solana.com/',
  commitment: 'confirmed'
});
const YOUR_TOKEN_MINT = new PublicKey('5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n'); // 여기에 당신의 커스텀 토큰 민트 주소를 넣으세요

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

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

export default function App() {
  const [deepLink, setDeepLink] = useState("");
  const [dappKeyPair] = useState(nacl.box.keyPair());
  const [sharedSecret, setSharedSecret] = useState();
  const [session, setSession] = useState();
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [solBalance, setSolBalance] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  // 잔액 조회 함수
  const fetchBalances = async (walletAddress) => {
    try {
      setIsLoading(true);
      
      // SOL 잔액 조회
      const solBalance = await DEVNET_CONNECTION.getBalance(new PublicKey(walletAddress));
      setSolBalance(solBalance / LAMPORTS_PER_SOL);

      // 커스텀 토큰 잔액 조회
      const tokenAccounts = await DEVNET_CONNECTION.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: YOUR_TOKEN_MINT }
      );

      if (tokenAccounts.value.length > 0) {
        const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        setTokenBalance(tokenBalance);
      } else {
        setTokenBalance(0);
      }
    } catch (error) {
      console.error('잔액 조회 오류:', error);
      setSolBalance(null);
      setTokenBalance(null);
    } finally {
      setIsLoading(false);
    }
  };

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

  // SOL 잔액 구독
  useEffect(() => {
    if (!publicKey) return;

    const subscribeToBalance = async () => {
      try {
        const walletPublicKey = new PublicKey(publicKey);
        // SOL 잔액 구독
        const solSubscriptionId = DEVNET_CONNECTION.onAccountChange(
          walletPublicKey,
          (accountInfo) => {
            setSolBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
          },
          'confirmed'
        );

        // 토큰 계정 찾기 및 구독
        const tokenAccounts = await DEVNET_CONNECTION.getParsedTokenAccountsByOwner(
          walletPublicKey,
          { mint: YOUR_TOKEN_MINT }
        );

        let tokenSubscriptionId;
        if (tokenAccounts.value.length > 0) {
          const tokenAccountPubkey = new PublicKey(tokenAccounts.value[0].pubkey);
          tokenSubscriptionId = DEVNET_CONNECTION.onAccountChange(
            tokenAccountPubkey,
            (accountInfo) => {
              try {
                const parsedData = accountInfo.data.parsed.info.tokenAmount;
                setTokenBalance(parsedData.uiAmount);
              } catch (error) {
                console.error('토큰 데이터 파싱 오류:', error);
              }
            },
            'confirmed'
          );
        }

        // 초기 잔액 설정
        fetchBalances(publicKey);

        // 구독 정리
        return () => {
          DEVNET_CONNECTION.removeAccountChangeListener(solSubscriptionId);
          if (tokenSubscriptionId) {
            DEVNET_CONNECTION.removeAccountChangeListener(tokenSubscriptionId);
          }
        };
      } catch (error) {
        console.error('잔액 구독 오류:', error);
      }
    };

    subscribeToBalance();
  }, [publicKey]);

  const connect = async () => {
    try {
      setConnecting(true);
      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        cluster: "devnet",
        app_url: "https://phantom-test-dapp.com",
        redirect_link: Linking.createURL("onConnect")
      });

      const url = Platform.OS === 'android'
        ? `https://phantom.app/ul/v1/connect?${params.toString()}`
        : `phantom://ul/v1/connect?${params.toString()}`;

      await Linking.openURL(url);
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const payload = { session };
      const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);

      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        nonce: bs58.encode(nonce),
        redirect_link: Linking.createURL("onDisconnect"),
        payload: bs58.encode(encryptedPayload)
      });

      const url = Platform.OS === 'android'
        ? `https://phantom.app/ul/v1/disconnect?${params.toString()}`
        : `phantom://ul/v1/disconnect?${params.toString()}`;

      await Linking.openURL(url);
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  // 토큰 전송 함수
  const sendToken = async () => {
    if (!publicKey || !recipientAddress || !amount) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      setSending(true);
      const transaction = new Transaction();
      
      // SOL 전송을 위한 트랜잭션 생성
      const senderPubKey = new PublicKey(publicKey);
      let recipientPubKey;
      
      try {
        // 주소가 base58 형식인지 확인
        if (!recipientAddress.match(/^[1-9A-HJ-NP-Za-km-z]+$/)) {
          throw new Error('올바른 Solana 주소 형식이 아닙니다.');
        }
        recipientPubKey = new PublicKey(recipientAddress.trim());
        
        // 주소가 유효한지 추가 확인
        if (!PublicKey.isOnCurve(recipientPubKey.toBytes())) {
          throw new Error('유효하지 않은 Solana 주소입니다.');
        }
      } catch (error) {
        Alert.alert('주소 오류', error.message);
        setSending(false);
        return;
      }

      // 금액이 유효한지 확인
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert('금액 오류', '올바른 금액을 입력해주세요.');
        setSending(false);
        return;
      }

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: senderPubKey,
          toPubkey: recipientPubKey,
          lamports: Math.floor(LAMPORTS_PER_SOL * parsedAmount)
        })
      );

      // 트랜잭션 설정
      transaction.feePayer = senderPubKey;
      const { blockhash } = await DEVNET_CONNECTION.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // 트랜잭션 직렬화
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false
      });

      // Phantom에 전송할 페이로드 생성
      const payload = {
        session,
        transaction: bs58.encode(serializedTransaction)
      };

      // 페이로드 암호화
      const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);

      // URL 파라미터 설정
      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        nonce: bs58.encode(nonce),
        redirect_link: Linking.createURL("onSignAndSendTransaction"),
        payload: bs58.encode(encryptedPayload)
      });

      // Phantom 앱 호출
      const url = Platform.OS === 'android'
        ? `https://phantom.app/ul/v1/signAndSendTransaction?${params.toString()}`
        : `phantom://ul/v1/signAndSendTransaction?${params.toString()}`;

      await Linking.openURL(url);
    } catch (error) {
      console.error('전송 오류:', error);
      Alert.alert('오류', '전송 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // 트랜잭션 결과 처리를 위한 useEffect 추가
  useEffect(() => {
    if (!deepLink) return;

    try {
      const [urlWithoutParams, queryString] = deepLink.split('?');
      const isTransactionPath = urlWithoutParams.includes('onSignAndSendTransaction');
      const params = new URLSearchParams(queryString);

      if (isTransactionPath) {
        if (params.get("errorCode")) {
          Alert.alert('전송 오류', params.get("errorMessage") || '알 수 없는 오류가 발생했습니다.');
          return;
        }

        const data = params.get("data");
        const nonce = params.get("nonce");

        if (data && nonce) {
          const transactionData = decryptPayload(data, nonce, sharedSecret);
          console.log('전송 완료:', transactionData);
          Alert.alert('성공', '전송이 완료되었습니다!');
          // 잔액 새로고침
          if (publicKey) {
            fetchBalances(publicKey);
          }
        }
      }
    } catch (error) {
      console.error('트랜잭션 처리 오류:', error);
    }
  }, [deepLink, sharedSecret, publicKey]);

  // Buffer 테스트를 위한 useEffect 추가
  useEffect(() => {
    try {
      console.log('Buffer 테스트 시작');
      const test = Buffer.from("Hello");
      console.log('Buffer 테스트 결과:', test.toString("hex"));
      console.log('Buffer 테스트 성공');
    } catch (error) {
      console.error('Buffer 테스트 실패:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phantom 지갑 테스트</Text>
      
      {!publicKey ? (
        <Button 
          title={connecting ? "연결 중..." : "Phantom 지갑 연결"}
          onPress={connect}
          disabled={connecting}
        />
      ) : (
        <View style={styles.walletContainer}>
          <Text style={styles.walletInfo}>
            연결된 지갑: {publicKey.slice(0, 8)}...{publicKey.slice(-4)}
          </Text>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceTitle}>실시간 잔액 현황</Text>
            {isLoading ? (
              <Text style={styles.loadingText}>잔액 로딩 중...</Text>
            ) : (
              <>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>SOL:</Text>
                  <Text style={styles.balanceValue}>
                    {solBalance !== null ? `${solBalance} SOL` : '조회 실패'}
                  </Text>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>WORK:</Text>
                  <Text style={styles.balanceValue}>
                    {tokenBalance !== null ? `${tokenBalance} WORK` : '조회 실패'}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.sendContainer}>
            <Text style={styles.sendTitle}>SOL 전송</Text>
            <TextInput
              style={styles.input}
              placeholder="받는 주소"
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="수량"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <Button
              title={sending ? "전송 중..." : "전송하기"}
              onPress={sendToken}
              disabled={sending || !recipientAddress || !amount}
              color="#4CAF50"
            />
          </View>

          <Button 
            title="연결 해제" 
            onPress={disconnect}
            color="#ff6b6b"
          />
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  walletContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  walletInfo: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
  },
  balanceContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
    textAlign: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    paddingVertical: 10,
  },
  sendContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  }
});