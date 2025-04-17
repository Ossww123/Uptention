// src/utils/NavigationService.js 생성
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    // 네비게이션이 준비되지 않았을 때를 위한 큐 구현
    // (필요한 경우)
  }
}