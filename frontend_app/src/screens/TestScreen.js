import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';
import { StyleSheet, Text, View, Button, Platform, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as Linking from 'expo-linking';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useWallet } from '../contexts/WalletContext';

// 기본 설정
const DEVNET_CONNECTION = new Connection('https://api.devnet.solana.com', {
  wsEndpoint: 'wss://api.devnet.solana.com/',
  commitment: 'confirmed'
});

// WORK 토큰 민트 주소 (여기에 본인의 토큰 주소를 넣으세요)
const YOUR_TOKEN_MINT = new PublicKey('5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n');

// 메모 프로그램 ID
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Buffer 설정
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

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

const TestScreen = () => {
  const { 
    publicKey,
    tokenBalance,
    handleConnectWallet,
    connecting,
    sendSPLToken,
    deepLink,          // WalletContext에서 가져옴
    dappKeyPair,       // WalletContext에서 가져옴
    sharedSecret,      // WalletContext에서 가져옴
    session,          // WalletContext에서 가져옴
  } = useWallet();

  // TestScreen에서는 UI 관련 상태만 관리
  const [recipientAddress, setRecipientAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSendingToken, setIsSendingToken] = useState(false);

  // 토큰 전송 함수
  const handleSendToken = async () => {
    if (!publicKey || !recipientAddress || !tokenAmount) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      setIsSendingToken(true);
      await sendSPLToken(recipientAddress, tokenAmount, memo);
    } catch (error) {
      console.error('토큰 전송 오류:', error);
      Alert.alert('오류', '토큰 전송 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSendingToken(false);
    }
  };

  // 상태 변화 모니터링을 위한 useEffect
  useEffect(() => {
    console.log('=== 지갑 상태 로그 ===');
    console.log('deepLink:', deepLink);
    console.log('dappKeyPair:', {
      publicKey: dappKeyPair ? bs58.encode(dappKeyPair.publicKey) : null,
      secretKey: dappKeyPair ? '비공개' : null
    });
    console.log('sharedSecret:', sharedSecret ? '존재함' : '없음');
    console.log('session:', session);
    console.log('publicKey:', publicKey);
    console.log('tokenBalance:', tokenBalance);
    console.log('==================');
  }, [deepLink, dappKeyPair, sharedSecret, session, publicKey, tokenBalance]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phantom 지갑 테스트</Text>
      
      {!publicKey ? (
        <Button 
          title={connecting ? "연결 중..." : "Phantom 지갑 연결"}
          onPress={handleConnectWallet}
          disabled={connecting}
        />
      ) : (
        <View style={styles.walletContainer}>
          <Text style={styles.walletInfo}>
            연결된 지갑: {publicKey.slice(0, 8)}...{publicKey.slice(-4)}
          </Text>
          
          <View style={styles.sendContainer}>
            <Text style={styles.sendTitle}>WORK 토큰 전송</Text>
            <TextInput
              style={styles.input}
              placeholder="받는 주소"
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="WORK 토큰 수량"
              value={tokenAmount}
              onChangeText={setTokenAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="메모 (선택사항)"
              value={memo}
              onChangeText={setMemo}
              placeholderTextColor="#666"
            />
            <Button
              title={isSendingToken ? "전송 중..." : "WORK 토큰 전송하기"}
              onPress={handleSendToken}
              disabled={isSendingToken || !recipientAddress || !tokenAmount}
              color="#4CAF50"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
    alignItems: 'center',
    padding: 16,
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
});

export default TestScreen; 