import { useState, useEffect } from 'react';

export const useTimer = () => {
    const [time, setTime] = useState('00:00:00');
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                setTime(prevTime => {
                    const [hours, minutes, seconds] = prevTime.split(':').map(Number);
                    let totalSeconds = hours * 3600 + minutes * 60 + seconds + 1;
                    const newHours = Math.floor(totalSeconds / 3600);
                    totalSeconds %= 3600;
                    const newMinutes = Math.floor(totalSeconds / 60);
                    const newSeconds = totalSeconds % 60;
                    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const startTimer = () => {
        setIsActive(true);
    };

    const stopTimer = () => {
        setIsActive(false);
    };

    const resetTimer = () => {
        setTime('00:00:00');
        setIsActive(false);
    };

    // 현재 시간을 초 단위로 변환
    const getTimeInSeconds = () => {
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    };

    return {
        time,
        isActive,
        startTimer,
        stopTimer,
        resetTimer,
        getTimeInSeconds
    };
}; 