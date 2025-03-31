import { registerRootComponent } from 'expo';
import { LogBox, YellowBox } from 'react-native';
import App from './src/App';

// 특정 로그 및 경고 무시
if (__DEV__) {
  // 콘솔 오류 필터링
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // "Cannot remove child" 오류 무시
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('Cannot remove child at index') ||
       args[0].includes('only 1 children in parent') ||
       args[0].includes('Warning: childCount'))
    ) {
      return;
    }
    return originalConsoleError(...args);
  };
  
  // LogBox로 경고 무시 (최신 React Native)
  LogBox.ignoreLogs([
    'Cannot remove child at index',
    'only 1 children in parent',
    'Warning: childCount'
  ]);
  
  // YellowBox 비활성화 (이전 버전 호환용)
  if (YellowBox) {
    YellowBox.ignoreWarnings([
      'Cannot remove child at index',
      'only 1 children in parent',
      'Warning: childCount'
    ]);
  }
  
  // 전체 경고창 비활성화 (신중하게 사용)
  // LogBox.ignoreAllLogs();
  // console.disableYellowBox = true;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
