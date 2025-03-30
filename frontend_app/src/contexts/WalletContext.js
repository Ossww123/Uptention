import React, { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [tokenBalance, setTokenBalance] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const connectWallet = async (address) => {
    try {
      // API 호출하여 지갑 정보 가져오기
      const response = await fetch(`https://j12d211.p.ssafy.io/api/wallet/${address}`);
      const data = await response.json();
      
      if (response.ok) {
        setTokenBalance(data.balance);
        setIsWalletConnected(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('지갑 연결 실패:', error);
      return false;
    }
  };

  const disconnectWallet = () => {
    setTokenBalance(null);
    setIsWalletConnected(false);
  };

  const updateBalance = async (address) => {
    try {
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
        isWalletConnected,
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