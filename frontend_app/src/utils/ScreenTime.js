import { NativeModules, Platform } from 'react-native';

console.log('Available Native Modules:', Object.keys(NativeModules));

// 직접 NativeModules에서 접근
const ScreenTime = Platform.OS === 'android' 
  ? NativeModules.ScreenTimeModule 
  : {
      hasUsageStatsPermission: () => Promise.resolve(false),
      openUsageSettings: () => {},
      getDailyScreenTime: () => Promise.resolve({ hasPermission: false }),
      getWeeklyScreenTime: () => Promise.resolve({ hasPermission: false }),
    };

console.log('ScreenTime module:', ScreenTime);

export default ScreenTime;