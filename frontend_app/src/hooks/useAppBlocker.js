import { useEffect, useState } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AppBlockerModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(AppBlockerModule);

export const useAppBlocker = () => {
    const [status, setStatus] = useState({
        isEnabled: false,
        hasAccessibilityPermission: false,
        hasOverlayPermission: false,
    });
    const [systemApps, setSystemApps] = useState([]);

    useEffect(() => {
        if (Platform.OS !== 'android') {
            console.warn('AppBlocker is only supported on Android');
            return;
        }

        // 초기 상태 로드
        initialize();

        // 이벤트 리스너 등록
        const subscription = eventEmitter.addListener(
            'blockingStatusChanged',
            (event) => {
                setStatus(prev => ({ ...prev, isEnabled: event.isEnabled }));
            }
        );

        return () => {
            subscription.remove();
        };
    }, []);

    const initialize = async () => {
        try {
            const result = await AppBlockerModule.initialize();
            setStatus(result);
        } catch (error) {
            console.error('Failed to initialize AppBlocker:', error);
        }
    };

    const loadSystemApps = async () => {
        try {
            const apps = await AppBlockerModule.getSystemApps();
            setSystemApps(apps);
            return apps;
        } catch (error) {
            console.error('Failed to load system apps:', error);
            return [];
        }
    };

    const setBlockingEnabled = async (enabled) => {
        try {
            await AppBlockerModule.setBlockingEnabled(enabled);
            return true;
        } catch (error) {
            console.error('Failed to set blocking status:', error);
            return false;
        }
    };

    const requestPermissions = async () => {
        try {
            const currentStatus = await AppBlockerModule.checkPermissions();
            
            if (!currentStatus.hasAccessibilityPermission) {
                await AppBlockerModule.requestAccessibilityPermission();
            }
            
            if (!currentStatus.hasOverlayPermission) {
                await AppBlockerModule.requestOverlayPermission();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to request permissions:', error);
            return false;
        }
    };

    const setAppBlocked = async (packageName, blocked) => {
        try {
            await AppBlockerModule.setAppBlocked(packageName, blocked);
            await loadSystemApps(); // 목록 새로고침
            return true;
        } catch (error) {
            console.error('Failed to set app blocked status:', error);
            return false;
        }
    };

    const checkPermissions = async () => {
        try {
            return await AppBlockerModule.checkPermissions();
        } catch (error) {
            console.error('Failed to check permissions:', error);
            return {
                hasAccessibilityPermission: false,
                hasOverlayPermission: false,
            };
        }
    };

    return {
        status,
        systemApps,
        loadSystemApps,
        setBlockingEnabled,
        requestPermissions,
        setAppBlocked,
        checkPermissions,
    };
}; 