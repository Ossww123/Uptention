import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

const AddressSearchScreen = ({ navigation, route }) => {
  const [step, setStep] = useState('search'); // 'search' 또는 'detail'
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [detailAddress, setDetailAddress] = useState('');
  const webViewRef = useRef(null);

  // Daum 우편번호 서비스 HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
      <style>
        body { margin: 0; padding: 0; background: #FFFFFF; }
        #container { height: 100vh; }
      </style>
    </head>
    <body>
      <div id="container"></div>
      <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
      <script>
        new daum.Postcode({
          width: '100%',
          height: '100%',
          animation: true,
          theme: {
            searchBgColor: "#FFFFFF",
            queryTextColor: "#000000"
          },
          oncomplete: function(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          }
        }).embed(document.getElementById('container'));
      </script>
    </body>
    </html>
  `;

  // WebView에서 메시지 수신 처리
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setSelectedAddress({
        roadAddress: data.roadAddress,
        jibunAddress: data.jibunAddress || data.autoJibunAddress,
        zonecode: data.zonecode,
        buildingName: data.buildingName || ''
      });
      
      // 상세주소 입력 단계로 전환
      setStep('detail');
    } catch (error) {
      console.error('주소 데이터 파싱 오류:', error);
    }
  };

  // 주소 저장 및 결제 페이지로 돌아가기
  const handleSaveAddress = () => {
    if (!selectedAddress) return;
    
    // 이전 화면으로 주소 정보 전달
    navigation.navigate({
      name: 'Checkout',
      params: {
        address: {
          ...selectedAddress,
          detailAddress
        }
      },
      merge: true
    });
  };

  // 검색 화면으로 돌아가기
  const handleBackToSearch = () => {
    setStep('search');
  };

  // 상세주소 입력 화면 렌더링
  const renderDetailAddressStep = () => (
    <View style={styles.detailContainer}>
      <View style={styles.selectedAddressContainer}>
        <View style={styles.addressIconContainer}>
          <Ionicons name="location-outline" size={24} color="#666" />
        </View>
        <View style={styles.selectedAddressTextContainer}>
          <Text style={styles.roadAddressText}>{selectedAddress.roadAddress}</Text>
          <Text style={styles.zoneCodeText}>{selectedAddress.zonecode}</Text>
        </View>
      </View>
      
      <View style={styles.detailAddressInputContainer}>
        <TextInput
          style={styles.detailAddressInput}
          placeholder="상세 주소를 입력해 주세요 (건물명, 동/호수 등)"
          value={detailAddress}
          onChangeText={setDetailAddress}
          autoFocus={true}
        />
        <Text style={styles.detailAddressHelp}>상세주소를 입력해주세요</Text>
      </View>
      
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleBackToSearch}
        >
          <Text style={styles.secondaryButtonText}>주소 다시 검색</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleSaveAddress}
        >
          <Text style={styles.primaryButtonText}>주소 등록</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주소 검색</Text>
        <View style={styles.emptySpace} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {step === 'search' ? (
          <WebView
            ref={webViewRef}
            source={{ html }}
            onMessage={handleMessage}
            style={styles.webView}
          />
        ) : (
          renderDetailAddressStep()
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 30,
  },
  contentContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  detailContainer: {
    flex: 1,
    padding: 20,
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  addressIconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  selectedAddressTextContainer: {
    flex: 1,
  },
  roadAddressText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  zoneCodeText: {
    fontSize: 14,
    color: '#666',
  },
  detailAddressInputContainer: {
    marginBottom: 30,
  },
  detailAddressInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  detailAddressHelp: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginLeft: 5,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
  },
});

export default AddressSearchScreen;