import { useState, useEffect } from 'react';

export const useWallet = () => {
    const [walletState, setWalletState] = useState({
        points: { current: 8, max: 8 },
        energy: { current: 8, max: 8 },
        coins: 0
    });

    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                updateWalletState();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const updateWalletState = () => {
        setWalletState(prev => {
            // 포인트와 에너지 감소 (최소 0)
            const newPoints = Math.max(0, prev.points.current - 0.01);
            const newEnergy = Math.max(0, prev.energy.current - 0.01);
            
            // 코인 증가
            const newCoins = prev.coins + 1;

            return {
                points: { ...prev.points, current: newPoints },
                energy: { ...prev.energy, current: newEnergy },
                coins: newCoins
            };
        });
    };

    const startWallet = () => {
        setIsActive(true);
    };

    const stopWallet = () => {
        setIsActive(false);
    };

    const resetWallet = () => {
        setWalletState({
            points: { current: 8, max: 8 },
            energy: { current: 8, max: 8 },
            coins: 0
        });
        setIsActive(false);
    };

    // 코인 추가
    const addCoins = (amount) => {
        setWalletState(prev => ({
            ...prev,
            coins: prev.coins + amount
        }));
    };

    // 포인트 추가/감소
    const updatePoints = (amount) => {
        setWalletState(prev => ({
            ...prev,
            points: {
                ...prev.points,
                current: Math.max(0, Math.min(prev.points.max, prev.points.current + amount))
            }
        }));
    };

    // 에너지 추가/감소
    const updateEnergy = (amount) => {
        setWalletState(prev => ({
            ...prev,
            energy: {
                ...prev.energy,
                current: Math.max(0, Math.min(prev.energy.max, prev.energy.current + amount))
            }
        }));
    };

    return {
        walletState,
        isActive,
        startWallet,
        stopWallet,
        resetWallet,
        addCoins,
        updatePoints,
        updateEnergy
    };
}; 