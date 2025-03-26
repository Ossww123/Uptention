import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Platform, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as Linking from 'expo-linking';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

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
  const [tokenAmount, setTokenAmount] = useState('');
  const [isSendingToken, setIsSendingToken] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // 잔액 조회 함수
  const fetchBalances = async (walletAddress) => {
    try {
      setIsLoading(true);
      
      // SOL 잔액 조회
      const solBalance = await DEVNET_CONNECTION.getBalance(new PublicKey(walletAddress));
      setSolBalance(solBalance / LAMPORTS_PER_SOL);

      // SPL 토큰 잔액 조회
      const tokenAccounts = await DEVNET_CONNECTION.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: YOUR_TOKEN_MINT }
      );

      console.log('토큰 계정 정보:', tokenAccounts);

      if (tokenAccounts.value.length > 0) {
        const tokenBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        console.log('조회된 토큰 잔액:', tokenBalance);
        setTokenBalance(tokenBalance);
      } else {
        console.log('토큰 계정이 없습니다. Associated Token Account 확인 필요');
        // Associated Token Account 주소 조회
        const ata = await getAssociatedTokenAddress(
          YOUR_TOKEN_MINT,
          new PublicKey(walletAddress)
        );
        console.log('ATA 주소:', ata.toString());
        
        // ATA 정보 직접 조회
        const ataInfo = await DEVNET_CONNECTION.getParsedAccountInfo(ata);
        if (ataInfo.value) {
          const parsedData = ataInfo.value.data.parsed.info.tokenAmount;
          console.log('ATA 잔액 정보:', parsedData);
          setTokenBalance(parsedData.uiAmount);
        } else {
          setTokenBalance(0);
        }
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

  // SOL 및 SPL 토큰 잔액 구독
  useEffect(() => {
    if (!publicKey) return;

    const subscribeToBalances = async () => {
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

        // Associated Token Account 주소 가져오기
        const ata = await getAssociatedTokenAddress(
          YOUR_TOKEN_MINT,
          walletPublicKey
        );

        // SPL 토큰 잔액 구독
        const tokenSubscriptionId = DEVNET_CONNECTION.onAccountChange(
          ata,
          async (accountInfo) => {
            try {
              if (accountInfo && accountInfo.data) {
                // 계정 정보 직접 파싱
                const ataInfo = await DEVNET_CONNECTION.getParsedAccountInfo(ata);
                if (ataInfo.value && ataInfo.value.data.parsed.info.tokenAmount) {
                  const tokenAmount = ataInfo.value.data.parsed.info.tokenAmount;
                  console.log('실시간 토큰 잔액 업데이트:', tokenAmount);
                  setTokenBalance(tokenAmount.uiAmount);
                } else {
                  console.log('토큰 계정 데이터 없음');
                  setTokenBalance(0);
                }
              } else {
                console.log('계정 정보 없음');
                setTokenBalance(0);
              }
            } catch (error) {
              console.error('토큰 데이터 파싱 오류:', error);
              setTokenBalance(0);
            }
          },
          'confirmed'
        );

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

    subscribeToBalances();
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

  // SOL 잔액 전송 함수
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

  // SPL 토큰 전송 함수
  const sendSPLToken = async () => {
    if (!publicKey || !recipientAddress || !tokenAmount) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      setIsSendingToken(true);
      const transaction = new Transaction();
      
      const senderPubKey = new PublicKey(publicKey);
      let recipientPubKey;
      
      try {
        if (!recipientAddress.match(/^[1-9A-HJ-NP-Za-km-z]+$/)) {
          throw new Error('올바른 Solana 주소 형식이 아닙니다.');
        }
        recipientPubKey = new PublicKey(recipientAddress.trim());
        
        if (!PublicKey.isOnCurve(recipientPubKey.toBytes())) {
          throw new Error('유효하지 않은 Solana 주소입니다.');
        }
      } catch (error) {
        Alert.alert('주소 오류', error.message);
        return;
      }

      const parsedAmount = parseFloat(tokenAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        Alert.alert('금액 오류', '올바른 금액을 입력해주세요.');
        return;
      }

      // 보내는 사람의 토큰 계정 주소 가져오기
      const senderTokenAccount = await getAssociatedTokenAddress(
        YOUR_TOKEN_MINT,
        senderPubKey
      );

      // 받는 사람의 토큰 계정 주소 가져오기
      const recipientTokenAccount = await getAssociatedTokenAddress(
        YOUR_TOKEN_MINT,
        recipientPubKey
      );

      // 받는 사람의 토큰 계정이 있는지 확인
      const recipientTokenAccountInfo = await DEVNET_CONNECTION.getAccountInfo(recipientTokenAccount);

      // 받는 사람의 토큰 계정이 없다면 생성
      if (!recipientTokenAccountInfo) {
        const createAtaInstruction = createAssociatedTokenAccountInstruction(
          senderPubKey,
          recipientTokenAccount,
          recipientPubKey,
          YOUR_TOKEN_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        transaction.add(createAtaInstruction);
      }

      // 토큰 데시멀 정보 가져오기
      const tokenInfo = await DEVNET_CONNECTION.getParsedAccountInfo(YOUR_TOKEN_MINT);
      const decimals = tokenInfo.value?.data.parsed.info.decimals || 0;
      console.log('Token decimals:', decimals);

      // SPL 토큰 전송 명령 생성
      const transferInstruction = createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        senderPubKey,
        Math.floor(parsedAmount * Math.pow(10, decimals)),
        [],
        TOKEN_PROGRAM_ID
      );

      transaction.add(transferInstruction);

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
      console.error('토큰 전송 오류:', error);
      Alert.alert('오류', '토큰 전송 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSendingToken(false);
    }
  };

  // 트랜잭션 결과 처리를 위한 useEffect 수정
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
          
          // 트랜잭션 확인 및 잔액 업데이트
          const checkTransactionAndUpdateBalance = async () => {
            try {
              // 트랜잭션 확인
              const signature = transactionData.signature;
              await DEVNET_CONNECTION.confirmTransaction(signature);
              console.log('트랜잭션 확인됨:', signature);
              
              // 잔액 새로고침
              if (publicKey) {
                await fetchBalances(publicKey);
              }
            } catch (error) {
              console.error('트랜잭션 확인 오류:', error);
            }
          };

          // 트랜잭션 확인 및 잔액 업데이트 실행
          checkTransactionAndUpdateBalance();
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

  // 트랜잭션 내역 조회 함수
  const fetchTransactionHistory = async () => {
    if (!publicKey) return;
    
    try {
      setIsLoadingTx(true);
      const walletPublicKey = new PublicKey(publicKey);
      
      // 최근 3개의 트랜잭션으로 제한하여 시그니처 가져오기
      const signatures = await DEVNET_CONNECTION.getSignaturesForAddress(
        walletPublicKey,
        { limit: 5 }
      );

      // 각 시그니처에 대한 트랜잭션 정보를 순차적으로 가져오기
      const processedTxs = [];
      for (const sig of signatures) {
        try {
          // 각 요청 사이에 지연 시간 추가
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const tx = await DEVNET_CONNECTION.getParsedTransaction(sig.signature);
          if (tx) {
            const signature = sig.signature;
            const timestamp = new Date(sig.blockTime * 1000);
            const type = tx.transaction.message.instructions[0].program;
            const status = tx.meta?.err ? '실패' : '성공';

            processedTxs.push({
              signature,
              timestamp,
              type: type === 'system' ? 'SOL 전송' : 'SPL 토큰 전송',
              status
            });
          }
        } catch (txError) {
          console.error('개별 트랜잭션 조회 오류:', txError);
          // 개별 트랜잭션 오류는 무시하고 계속 진행
          continue;
        }
      }

      setTransactions(processedTxs);
    } catch (error) {
      console.error('트랜잭션 내역 조회 오류:', error);
      if (error.message.includes('429') || error.message.includes('Too many requests')) {
        Alert.alert('알림', '잠시 후 다시 시도해주세요.');
      } else {
        Alert.alert('오류', '트랜잭션 내역을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoadingTx(false);
    }
  };

  // 지갑 연결 시 트랜잭션 내역 조회
  useEffect(() => {
    if (publicKey) {
      fetchTransactionHistory();
    }
  }, [publicKey]);

  // 트랜잭션 상세 정보 보기
  const viewTransactionDetails = async (signature) => {
    const url = `https://solscan.io/tx/${signature}?cluster=devnet`;
    await Linking.openURL(url);
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.innerContainer}>
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
                      {tokenBalance !== null ? 
                        (typeof tokenBalance === 'number' && !isNaN(tokenBalance)) ? 
                          `${tokenBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 9
                          })} WORK` 
                        : '0 WORK' 
                      : '조회 실패'}
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
                placeholder="SOL 수량"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
              <Button
                title={sending ? "전송 중..." : "SOL 전송하기"}
                onPress={sendToken}
                disabled={sending || !recipientAddress || !amount}
                color="#4CAF50"
              />

              <View style={styles.separator} />

              <Text style={styles.sendTitle}>WORK 토큰 전송</Text>
              <TextInput
                style={styles.input}
                placeholder="WORK 토큰 수량"
                value={tokenAmount}
                onChangeText={setTokenAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
              />
              <Button
                title={isSendingToken ? "전송 중..." : "WORK 토큰 전송하기"}
                onPress={sendSPLToken}
                disabled={isSendingToken || !recipientAddress || !tokenAmount}
                color="#4CAF50"
              />
            </View>

            {/* 트랜잭션 내역 섹션 */}
            <View style={styles.transactionContainer}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionTitle}>최근 거래 내역</Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchTransactionHistory}
                  disabled={isLoadingTx}
                >
                  <Text style={styles.refreshButtonText}>
                    {isLoadingTx ? "로딩 중..." : "새로고침"}
                  </Text>
                </TouchableOpacity>
              </View>

              {transactions.map((tx, index) => (
                <TouchableOpacity
                  key={tx.signature}
                  style={styles.transactionItem}
                  onPress={() => viewTransactionDetails(tx.signature)}
                >
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>{tx.type}</Text>
                    <Text style={styles.transactionDate}>
                      {tx.timestamp.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.transactionStatus}>
                    <Text style={[
                      styles.statusText,
                      { color: tx.status === '성공' ? '#4CAF50' : '#ff6b6b' }
                    ]}>
                      {tx.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {transactions.length === 0 && !isLoadingTx && (
                <Text style={styles.noTransactions}>
                  거래 내역이 없습니다.
                </Text>
              )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1f36',
    marginBottom: 24,
    marginTop: 40,
  },
  walletContainer: {
    width: '100%',
    alignItems: 'center',
  },
  walletInfo: {
    width: '100%',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f36',
    marginBottom: 16,
    textAlign: 'left',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: 16,
    paddingVertical: 12,
  },
  sendContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f36',
    marginBottom: 16,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#f7f9fc',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#2d3748',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f2f5',
    width: '100%',
    marginVertical: 20,
  },
  transactionContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f36',
  },
  refreshButton: {
    backgroundColor: '#f7f9fc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshButtonText: {
    color: '#4a5568',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#718096',
  },
  transactionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f7f9fc',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 24,
    fontSize: 15,
  }
});

