import { useState, useEffect, useRef, useCallback } from 'react';
import BackgroundTimer from 'react-native-background-timer';
import { AppState } from 'react-native';

export const useTimer = () => {
    const [time, setTime] = useState('00:00:00');
    const [isActive, setIsActive] = useState(false);
    const startTimeRef = useRef(null);  // 스톱워치 시작 시간
    const elapsedTimeRef = useRef(0);   // 누적된 시간
    const appStateRef = useRef(AppState.currentState);
    const intervalRef = useRef(null);
    const backgroundStartTimeRef = useRef(null);  // 백그라운드 진입 시간

    const formatTime = useCallback((totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, []);

    const updateTimer = useCallback(() => {
        if (!startTimeRef.current) return;
        
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        const totalSeconds = elapsedTimeRef.current + elapsed;
        
        setTime(formatTime(totalSeconds));
    }, [formatTime]);

    // 앱 상태 변경 핸들러
    const handleAppStateChange = useCallback((nextAppState) => {
        if (isActive) {
            if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
                // 백그라운드로 진입할 때
                // 현재까지의 시간을 저장
                const now = Date.now();
                const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);
                elapsedTimeRef.current += currentElapsed;
                backgroundStartTimeRef.current = now;
            } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // 포그라운드로 돌아올 때
                if (backgroundStartTimeRef.current) {
                    const now = Date.now();
                    const backgroundTime = Math.floor((now - backgroundStartTimeRef.current) / 1000);
                    elapsedTimeRef.current += backgroundTime;
                    startTimeRef.current = now;
                    backgroundStartTimeRef.current = null;
                    setTime(formatTime(elapsedTimeRef.current));
                }
            }
        }
        appStateRef.current = nextAppState;
    }, [isActive, formatTime]);

    useEffect(() => {
        if (isActive) {
            startTimeRef.current = Date.now();
            intervalRef.current = BackgroundTimer.setInterval(updateTimer, 1000);
        } else {
            if (startTimeRef.current) {
                const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                elapsedTimeRef.current += finalElapsed;
                startTimeRef.current = null;
            }
            if (intervalRef.current) {
                BackgroundTimer.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                BackgroundTimer.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, updateTimer]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [handleAppStateChange]);

    const startTimer = useCallback(() => {
        setIsActive(true);
        startTimeRef.current = Date.now();
    }, []);

    const stopTimer = useCallback(() => {
        if (startTimeRef.current) {
            const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            elapsedTimeRef.current += finalElapsed;
        }
        setIsActive(false);
    }, []);

    const resetTimer = useCallback(() => {
        setTime('00:00:00');
        setIsActive(false);
        startTimeRef.current = null;
        elapsedTimeRef.current = 0;
        if (intervalRef.current) {
            BackgroundTimer.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const getTimeInSeconds = useCallback(() => {
        if (isActive && startTimeRef.current) {
            const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            return elapsedTimeRef.current + currentElapsed;
        }
        return elapsedTimeRef.current;
    }, [isActive]);

    return {
        time,
        isActive,
        startTimer,
        stopTimer,
        resetTimer,
        getTimeInSeconds
    };
};