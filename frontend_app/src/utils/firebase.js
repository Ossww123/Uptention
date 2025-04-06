// src/utils/firebase.js
import firebase from '@react-native-firebase/app';

// Firebase 초기화
export const initializeFirebase = () => {
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp();
      console.log('Firebase 초기화 성공!');
      return true;
    } catch (error) {
      console.error('Firebase 초기화 실패:', error);
      return false;
    }
  } else {
    console.log('Firebase 이미 초기화됨');
    return true;
  }
};

// Firebase 앱 인스턴스 가져오기
export const getFirebaseApp = () => {
  try {
    if (!firebase.apps.length) {
      return null;
    }
    return firebase.app();
  } catch (error) {
    console.error('Firebase 앱 인스턴스 가져오기 실패:', error);
    return null;
  }
};

// Firebase 초기화 즉시 실행
initializeFirebase();

export default firebase;