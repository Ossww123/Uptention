// src/screens/auth/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { parseJwt, saveToken, saveUserId } from '../../services/AuthService';
import FCMUtils from '../../utils/FCMUtils';
import { CommonActions } from '@react-navigation/native';

const LoginScreen = ({ navigation, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('LoginScreen 렌더링됨');

  // 컴포넌트 마운트 시 FCM 토큰 초기화
  useEffect(() => {
    console.log('LoginScreen useEffect 실행됨');
    FCMUtils.initializeFCM();
  }, []);

  // 로그인 처리 함수
  const handleLogin = async () => {
    if (loading || isProcessing) {
      return;
    }
    // 입력값 검증
    if (!username.trim() || !password.trim()) {
      Alert.alert('오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }
  
    try {
      console.log('로그인 시도:', { username, password: '********' });
      setLoading(true);
      setIsProcessing(true);

      // FCM 토큰 가져오기 (이미 api.js에서 자동으로 헤더에 추가됨)
      await FCMUtils.getFCMToken();
  
      // API 호출
      const { data, ok, headers } = await post('/login', { 
        username, 
        password, 
        loginType: 'member'
      });
      
      console.log('로그인 응답:', { ok, data: data || '응답 데이터 없음' });
      console.log('응답 헤더:', headers || '헤더 없음');
      
      // 응답 처리
      if (ok) {
        // 헤더에서 토큰 추출
        const authToken = headers['authorization'] || headers['Authorization'];
        console.log('인증 토큰:', authToken ? '토큰 있음' : '토큰 없음');
        
        if (authToken) {
          // "Bearer " 접두사 제거
          const token = authToken.replace('Bearer ', '');
          
          // 토큰에서 userId 추출
          const payload = parseJwt(token);
          console.log('토큰 페이로드:', payload || '페이로드 추출 실패');
          
          if (payload && payload.userId) {
            console.log('추출된 userId:', payload.userId);
            
            // 직접 AsyncStorage에 저장
            try {
              await saveToken(token);
              await saveUserId(payload.userId.toString());
              console.log('토큰과 userId 저장 성공');
            } catch (storageError) {
              console.error('토큰/userId 저장 오류:', storageError);
            }
            
            // AuthContext를 통해 로그인 처리
            console.log('AuthContext login 함수 호출');
            const loginSuccess = await login(token, payload.userId.toString());
            console.log('로그인 결과:', loginSuccess ? '성공' : '실패');
            
            if (loginSuccess) {
              console.log('onLoginSuccess 호출');
              
              // 네비게이션 명령 직접 실행
              setTimeout(() => {
                try {
                  console.log('네비게이션 명령 실행 (타이머)');
                  
                  if (onLoginSuccess) {
                    onLoginSuccess();
                  }
                  
                  // 직접 네비게이션 명령도 추가로 실행
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'Permissions' }],
                    })
                  );
                } catch (navError) {
                  console.error('네비게이션 오류:', navError);
                  Alert.alert('오류', '화면 전환 중 문제가 발생했습니다.');
                }
              }, 1000);
            } else {
              Alert.alert('로그인 실패', '로그인 정보 저장에 실패했습니다.');
            }
          } else {
            Alert.alert('로그인 실패', '토큰에서 사용자 정보를 추출할 수 없습니다.');
          }
        } else {
          Alert.alert('로그인 실패', '인증 토큰을 받지 못했습니다.');
        }
      } else {
        // 에러 메시지 표시
        Alert.alert('로그인 실패', data.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('로그인 실패', '서버 연결에 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/character_animation.gif')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>UPTENTION</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.headerText}>로그인</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="아이디"
                placeholderTextColor="#AAA"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#AAA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              >
                <Ionicons
                  name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
      style={[
        styles.submitButton,
        (loading || isProcessing) && styles.disabledButton // 비활성화 스타일 추가
      ]}
      onPress={handleLogin}
      disabled={loading || isProcessing} // 두 상태 모두 체크
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.submitButtonText}>로그인</Text>
      )}
    </TouchableOpacity>

            <Text style={styles.noteText}>
              * 계정이 없으신 경우 관리자에게 문의하세요.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 200,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#FF8C00',
    marginBottom: -20,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  submitButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC', // 비활성화 상태의 버튼 색상
  },
});

export default LoginScreen;