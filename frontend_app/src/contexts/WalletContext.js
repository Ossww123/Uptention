import React, { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [tokenBalance, setTokenBalance] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [sharedSecret, setSharedSecret] = useState(null);
  const [session, setSession] = useState(null);
  const [solBalance, setSolBalance] = useState(null);

  const connectWallet = async (address) => {
    try {
      setPublicKey(address);
      return true;
    } catch (error) {
      console.error('지갑 연결 실패:', error);
      return false;
    }
  };

  const disconnectWallet = () => {
    setTokenBalance(null);
    setPublicKey(null);
    setSharedSecret(null);
    setSession(null);
    setSolBalance(null);
  };

  const updateBalance = async (address) => {
    try {
      // API 호출하여 지갑 정보 가져오기
      const response = await fetch(`https://j12d211.p.ssafy.io/api/wallet/${address}`);
      const data = await response.json();
      
      if (response.ok) {
        setTokenBalance(data.balance);
      }
    } catch (error) {
      console.error('잔액 업데이트 실패:', error);
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
        connectWallet,
        disconnectWallet,
        updateBalance
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