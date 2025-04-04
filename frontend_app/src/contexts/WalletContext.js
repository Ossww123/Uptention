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
      console.error('Decryption error:', error);
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
      
      console.log('=== 연결 시도 로그 ===');
      console.log('Redirect URL:', redirectUrl);
      console.log('Connection URL:', url);
      
      await Linking.openURL(url);
    } catch (error) {
      console.error('Connection error:', error);
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
    } catch (error) {
      console.error('Disconnect error:', error);
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
            console.log('=== SOL 잔액 변화 감지 ===');
            const newBalance = accountInfo.lamports / LAMPORTS_PER_SOL;
            console.log('새로운 SOL 잔액:', newBalance);
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
              console.log('=== 토큰 잔액 변화 감지 ===');
              const data = accountInfo.data;
              if (data) {
                const balance = DEVNET_CONNECTION.getParsedAccountInfo(accountInfo)
                  .then((parsedInfo) => {
                    const newBalance = parsedInfo.value.data.parsed.info.tokenAmount.uiAmount;
                    console.log('새로운 토큰 잔액:', newBalance);
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
        console.error('구독 설정 오류:', error);
      }
    };

    setupSubscriptions();

    // Clean up: 구독 해제
    return () => {
      if (solSubscriptionId) {
        DEVNET_CONNECTION.removeAccountChangeListener(solSubscriptionId)
          .catch(error => console.error('SOL 구독 해제 오류:', error));
      }
      if (tokenSubscriptionId) {
        DEVNET_CONNECTION.removeAccountChangeListener(tokenSubscriptionId)
          .catch(error => console.error('토큰 구독 해제 오류:', error));
      }
    };
  }, [publicKey]);

  // fetchBalances 함수 수정 (로그 추가)
  const fetchBalances = async (walletAddress) => {
    try {
      console.log('=== 잔액 조회 시작 ===');
      
      // SOL 잔액 조회
      const solBalance = await DEVNET_CONNECTION.getBalance(new PublicKey(walletAddress));
      const solBalanceInSol = solBalance / LAMPORTS_PER_SOL;
      console.log('SOL 잔액:', solBalanceInSol);
      setSolBalance(solBalanceInSol);

      // SPL 토큰 잔액 조회
      const tokenAccounts = await DEVNET_CONNECTION.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: YOUR_TOKEN_MINT }
      );

      if (tokenAccounts.value.length > 0) {
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
        console.log('토큰 잔액:', balance);
        setTokenBalance(balance);
      } else {
        console.log('토큰 계정이 없음');
        setTokenBalance(0);
      }
      
      console.log('=== 잔액 조회 완료 ===');
    } catch (error) {
      console.error('잔액 조회 오류:', error);
      setSolBalance(null);
      setTokenBalance(null);
    }
  };

  useEffect(() => {
    if (!deepLink) return;

    try {
      const [urlWithoutParams, queryString] = deepLink.split('?');
      const isConnectPath = urlWithoutParams.includes('onConnect');
      const isDisconnectPath = urlWithoutParams.includes('onDisconnect');
      const params = new URLSearchParams(queryString);

      console.log('=== 연결 처리 로그 ===');
      console.log('연결 URL:', urlWithoutParams);
      console.log('쿼리 파라미터:', queryString);

      if (params.get("errorCode")) {
        console.error('Connection error:', params.get("errorMessage"));
        return;
      }

      if (isConnectPath) {
        const phantom_encryption_public_key = params.get("phantom_encryption_public_key");
        const data = params.get("data");
        const nonce = params.get("nonce");

        console.log('phantom_encryption_public_key:', phantom_encryption_public_key);
        console.log('data 존재:', !!data);
        console.log('nonce 존재:', !!nonce);

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
        
        // 연결 직후 잔액 조회
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
    console.log('=== 지갑 상태 로그 ===');
    console.log('deepLink:', deepLink);
    console.log('dappKeyPair:', {
      publicKey: dappKeyPair ? bs58.encode(dappKeyPair.publicKey) : null,
      secretKey: '비공개'
    });
    console.log('sharedSecret:', sharedSecret ? '존재함' : '없음');
    console.log('session:', session);
    console.log('publicKey:', publicKey);
    console.log('tokenBalance:', tokenBalance);
    console.log('==================');
  }, [deepLink, dappKeyPair, sharedSecret, session, publicKey, tokenBalance]);

  // 토큰 전송 함수 추가
  const sendSPLToken = async (recipientAddress, tokenAmount, memo) => {
    if (!publicKey || !recipientAddress || !tokenAmount) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    try {
      console.log('트랜잭션 시작');
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
      console.log('보내는 사람 토큰 계정:', senderTokenAccount.toString());

      const recipientTokenAccount = await getAssociatedTokenAddress(
        YOUR_TOKEN_MINT,
        recipientPubKey
      );
      console.log('받는 사람 토큰 계정:', recipientTokenAccount.toString());

      // 받는 사람의 토큰 계정이 있는지 확인
      const recipientTokenAccountInfo = await DEVNET_CONNECTION.getAccountInfo(recipientTokenAccount);
      console.log('받는 사람 토큰 계정 정보:', recipientTokenAccountInfo ? '존재함' : '존재하지 않음');

      // 받는 사람의 토큰 계정이 없다면 생성
      if (!recipientTokenAccountInfo) {
        console.log('받는 사람의 토큰 계정 생성 중...');
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
      console.log('토큰 데시멀:', decimals);

      // 전송할 실제 토큰 수량 계산 (데시멀 적용)
      const actualAmount = Math.floor(parsedAmount * Math.pow(10, decimals));
      console.log('전송할 토큰 수량:', actualAmount, '(원래 수량:', parsedAmount, ')');

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
      
      console.log('생성된 URL:', {
        baseUrl,
        redirectLink: Linking.createURL("onSignAndSendTransaction"),
        params: Object.fromEntries(params.entries()),
        fullUrl: url
      });

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