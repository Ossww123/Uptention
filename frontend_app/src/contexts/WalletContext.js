import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import 'react-native-url-polyfill/auto';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, TransactionInstruction } from '@solana/web3.js';
import { 
  createTransferInstruction, 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction
} from '@solana/spl-token';
import AsyncStorage from '@react-native-async-storage/async-storage';


if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

const WalletContext = createContext();

// Connection 및 Token Mint 상수 추가
const DEVNET_CONNECTION = new Connection('https://api.devnet.solana.com', {
  wsEndpoint: 'wss://api.devnet.solana.com/',
  commitment: 'confirmed'
});

const YOUR_TOKEN_MINT = new PublicKey('5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n');

// 상수 추가
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// AsyncStorage 키 상수 추가
const WALLET_STORAGE_KEY = '@wallet_info';

export const WalletProvider = ({ children }) => {
  const [tokenBalance, setTokenBalance] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [sharedSecret, setSharedSecret] = useState(null);
  const [session, setSession] = useState(null);
  const [solBalance, setSolBalance] = useState(null);

  const [deepLink, setDeepLink] = useState("");
  const [dappKeyPair] = useState(nacl.box.keyPair());
  const [connecting, setConnecting] = useState(false);

  const encryptPayload = (payload, sharedSecret) => {
    const nonce = nacl.randomBytes(24);
    const encryptedPayload = nacl.box.after(
      Buffer.from(JSON.stringify(payload)),
      nonce,
      sharedSecret
    );
    return [nonce, encryptedPayload];
  };

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
      throw error;
    }
  }, []);

  const handleDeepLink = ({ url }) => {
    setDeepLink(url);
  };

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      const redirectUrl = Linking.createURL('onConnect');
      
      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        cluster: "devnet",
        app_url: "https://phantom.app",
        redirect_link: redirectUrl
      });

      const url = `https://phantom.app/ul/v1/connect?${params.toString()}`;
      
      await Linking.openURL(url);
    } catch (error) {
      throw error;
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
      // 저장된 지갑 정보 삭제
      await clearWalletInfo();
    } catch (error) {
      throw error;
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

  // 실시간 잔액 모니터링을 위한 useEffect
  useEffect(() => {
    if (!publicKey) return;

    let solSubscriptionId;
    let tokenSubscriptionId;

    const setupSubscriptions = async () => {
      try {
        // SOL 잔액 변화 구독
        solSubscriptionId = DEVNET_CONNECTION.onAccountChange(
          new PublicKey(publicKey),
          (accountInfo) => {
            const newBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
            setSolBalance(newBalance);
          },
          'confirmed'
        );

        // 토큰 계정 찾기
        const tokenAccounts = await DEVNET_CONNECTION.getParsedTokenAccountsByOwner(
          new PublicKey(publicKey),
          { mint: YOUR_TOKEN_MINT }
        );

        if (tokenAccounts.value.length > 0) {
          const tokenAccountPubkey = tokenAccounts.value[0].pubkey;
          
          // 토큰 잔액 변화 구독
          tokenSubscriptionId = DEVNET_CONNECTION.onAccountChange(
            tokenAccountPubkey,
            (accountInfo) => {
              const data = accountInfo.data;
              if (data) {
                const balance = DEVNET_CONNECTION.getParsedAccountInfo(accountInfo)
                  .then((parsedInfo) => {
                    const newBalance = parsedInfo.value.data.parsed.info.tokenAmount.uiAmount;
                    setTokenBalance(newBalance);
                  });
              }
            },
            'confirmed'
          );
        }

        // 초기 잔액 조회
        fetchBalances(publicKey);

      } catch (error) {
        // 오류 처리 (조용히)
      }
    };

    setupSubscriptions();

    // Clean up: 구독 해제
    return () => {
      if (solSubscriptionId) {
        DEVNET_CONNECTION.removeAccountChangeListener(solSubscriptionId)
          .catch(() => {});
      }
      if (tokenSubscriptionId) {
        DEVNET_CONNECTION.removeAccountChangeListener(tokenSubscriptionId)
          .catch(() => {});
      }
    };
  }, [publicKey]);

  // fetchBalances 함수 수정 (로그 제거)
  const fetchBalances = async (walletAddress) => {
    try {
      // SOL 잔액 조회
      const solBalance = await DEVNET_CONNECTION.getBalance(new PublicKey(walletAddress));
      const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
      setSolBalance(solBalanceInSol);

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
      setSolBalance(null);
      setTokenBalance(null);
    }
  };

  // 지갑 정보 저장 함수
  const saveWalletInfo = async (walletInfo) => {
    try {
      // sharedSecret를 base58로 인코딩하여 저장
      const encodedSecret = bs58.encode(walletInfo.sharedSecret);
      const walletData = {
        publicKey: walletInfo.publicKey,
        sharedSecret: encodedSecret,
        session: walletInfo.session,
        dappPublicKey: bs58.encode(dappKeyPair.publicKey),
        dappSecretKey: bs58.encode(dappKeyPair.secretKey)
      };
      await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData));
    } catch (error) {
      // 조용히 실패 처리
    }
  };

  // 지갑 정보 로드 함수
  const loadWalletInfo = async () => {
    try {
      const savedInfo = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
      if (savedInfo) {
        const walletData = JSON.parse(savedInfo);

        // base58로 인코딩된 값들을 다시 Uint8Array로 변환
        const sharedSecret = bs58.decode(walletData.sharedSecret);
        const dappPublicKey = bs58.decode(walletData.dappPublicKey);
        const dappSecretKey = bs58.decode(walletData.dappSecretKey);

        setPublicKey(walletData.publicKey);
        setSharedSecret(sharedSecret);
        setSession(walletData.session);
        
        // dappKeyPair 재설정
        Object.assign(dappKeyPair, {
          publicKey: dappPublicKey,
          secretKey: dappSecretKey
        });

        if (walletData.publicKey) {
          fetchBalances(walletData.publicKey);
        }
      }
    } catch (error) {
      await clearWalletInfo();
    }
  };

  // 지갑 정보 삭제 함수
  const clearWalletInfo = async () => {
    try {
      await AsyncStorage.removeItem(WALLET_STORAGE_KEY);
    } catch (error) {
      // 조용히 실패 처리
    }
  };

  // 앱 시작 시 저장된 지갑 정보 로드
  useEffect(() => {
    loadWalletInfo();
  }, []);

  // deepLink 처리 useEffect 수정
  useEffect(() => {
    if (!deepLink) return;

    const processDeepLink = async () => {
      try {
        const [urlWithoutParams, queryString] = deepLink.split('?');
        const isConnectPath = urlWithoutParams.includes('onConnect');
        const isDisconnectPath = urlWithoutParams.includes('onDisconnect');
        const params = new URLSearchParams(queryString);

        if (params.get("errorCode")) {
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
          
          // 지갑 연결 정보 저장
          await saveWalletInfo({
            publicKey: connectData.public_key,
            sharedSecret: sharedSecretDapp,
            session: connectData.session
          });
          
          fetchBalances(connectData.public_key);
        }

        if (isDisconnectPath) {
          // 모든 상태 초기화
          setPublicKey(null);
          setSharedSecret(null);
          setSession(null);
          setSolBalance(null);
          setTokenBalance(null);
          // 저장된 지갑 정보 삭제
          await clearWalletInfo();
        }
      } catch (error) {
        // 조용히 실패 처리
      }
    };

    processDeepLink();
  }, [deepLink, decryptPayload, dappKeyPair.secretKey]);

  // 토큰 전송 함수 추가
  const sendSPLToken = async (recipientAddress, tokenAmount, memo) => {
    if (!publicKey || !recipientAddress || !tokenAmount) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    try {
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
        throw new Error('주소 오류: ' + error.message);
      }

      const parsedAmount = parseFloat(tokenAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('올바른 금액을 입력해주세요.');
      }

      // 토큰 계정 주소 가져오기
      const senderTokenAccount = await getAssociatedTokenAddress(
        YOUR_TOKEN_MINT,
        senderPubKey
      );

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

      // 전송할 실제 토큰 수량 계산 (데시멀 적용)
      const actualAmount = Math.floor(parsedAmount * Math.pow(10, decimals));

      // TransferChecked 인스트럭션 생성
      const transferInstruction = createTransferCheckedInstruction(
        senderTokenAccount,
        YOUR_TOKEN_MINT,
        recipientTokenAccount,
        senderPubKey,
        actualAmount,
        decimals,
        []
      );
      transaction.add(transferInstruction);

      // 메모가 있는 경우 메모 명령어 추가
      if (memo?.trim()) {
        console.log('메모 추가:', memo.trim());
        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(memo.trim()),
        });
        transaction.add(memoInstruction);
      }

      // 트랜잭션 설정
      transaction.feePayer = senderPubKey;
      const { blockhash } = await DEVNET_CONNECTION.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // 트랜잭션 직렬화
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false
      });

      const payload = {
        session,
        transaction: bs58.encode(serializedTransaction)
      };

      const [nonce, encryptedPayload] = encryptPayload(payload, sharedSecret);

      const params = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        nonce: bs58.encode(nonce),
        redirect_link: Linking.createURL("onSignAndSendTransaction"),
        payload: bs58.encode(encryptedPayload)
      });

      const baseUrl = Platform.OS === 'android'
        ? 'https://phantom.app/ul/v1/signAndSendTransaction'
        : 'phantom://ul/v1/signAndSendTransaction';
      
      const url = `${baseUrl}?${params.toString()}`;
      

      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('토큰 전송 오류:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider 
      value={{
        tokenBalance,
        setTokenBalance,
        publicKey,
        setPublicKey,
        sharedSecret,
        setSharedSecret,
        session,
        setSession,
        solBalance,
        setSolBalance,
        deepLink,
        setDeepLink,
        dappKeyPair,
        connecting,
        handleConnectWallet,
        handleDisconnectWallet,
        encryptPayload,
        decryptPayload,
        fetchBalances,
        sendSPLToken,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 