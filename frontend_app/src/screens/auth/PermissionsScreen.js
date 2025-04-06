// src/screens/auth/PermissionsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ScreenTime from "../../utils/ScreenTime";

const PermissionsScreen = ({ onPermissionsGranted, permissions: initialPermissions }) => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState(initialPermissions);

  // 컴포넌트 마운트 시 권한 상태 확인
  useEffect(() => {
    checkAllPermissions();
  }, []);

  // 모든 권한 상태 확인 함수
  const checkAllPermissions = async () => {
    try {
      setLoading(true);
      
      // 세 가지 권한 모두 확인
      const [screenTimeGranted, overlayGranted, accessibilityGranted] = await Promise.all([
        ScreenTime.hasUsageStatsPermission(),
        ScreenTime.hasOverlayPermission(),
        ScreenTime.hasAccessibilityPermission()
      ]);
      
      // 상태 업데이트
      const updatedPermissions = {
        screenTime: screenTimeGranted,
        overlay: overlayGranted,
        accessibility: accessibilityGranted
      };
      
      setPermissions(updatedPermissions);
      
      // 모든 권한이 허용되었는지 확인
      const allGranted = screenTimeGranted && overlayGranted && accessibilityGranted;
      
      // 모든 권한이 이미 있는 경우, 자동으로 다음 단계로 진행
      if (allGranted) {
        setTimeout(() => {
          onPermissionsGranted(updatedPermissions);
        }, 1000);
      }
    } catch (error) {
      console.error("Permission check error:", error);
      Alert.alert("오류", "권한 상태를 확인하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 스크린타임 권한 요청 함수
  const requestScreenTimePermission = async () => {
    try {
      await ScreenTime.openUsageSettings();
      
      // 사용자가 설정에서 돌아오면 권한 상태 재확인
      Alert.alert(
        "사용량 접근 권한 설정",
        "설정에서 UPTENTION 앱에 사용량 접근 권한을 허용한 후 돌아와주세요.",
        [
          {
            text: "확인",
            onPress: async () => {
              const granted = await ScreenTime.hasUsageStatsPermission();
              setPermissions(prev => ({ ...prev, screenTime: granted }));
              
              // 모든 권한 확인
              checkIfAllGranted({ ...permissions, screenTime: granted });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Permission request error:", error);
      Alert.alert("오류", "권한 요청 중 오류가 발생했습니다.");
    }
  };

  // 오버레이 권한 요청 함수
  const requestOverlayPermission = async () => {
    try {
      await ScreenTime.openOverlaySettings();
      
      // 사용자가 설정에서 돌아오면 권한 상태 재확인
      Alert.alert(
        "오버레이 권한 설정",
        "설정에서 UPTENTION 앱에 다른 앱 위에 표시 권한을 허용한 후 돌아와주세요.",
        [
          {
            text: "확인",
            onPress: async () => {
              const granted = await ScreenTime.hasOverlayPermission();
              setPermissions(prev => ({ ...prev, overlay: granted }));
              
              // 모든 권한 확인
              checkIfAllGranted({ ...permissions, overlay: granted });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Permission request error:", error);
      Alert.alert("오류", "권한 요청 중 오류가 발생했습니다.");
    }
  };

  // 접근성 권한 요청 함수
  const requestAccessibilityPermission = async () => {
    try {
      await ScreenTime.openAccessibilitySettings();
      
      // 사용자가 설정에서 돌아오면 권한 상태 재확인
      Alert.alert(
        "접근성 권한 설정",
        "설정에서 UPTENTION 앱의 접근성 서비스를 활성화한 후 돌아와주세요.",
        [
          {
            text: "확인",
            onPress: async () => {
              const granted = await ScreenTime.hasAccessibilityPermission();
              setPermissions(prev => ({ ...prev, accessibility: granted }));
              
              // 모든 권한 확인
              checkIfAllGranted({ ...permissions, accessibility: granted });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Permission request error:", error);
      Alert.alert("오류", "권한 요청 중 오류가 발생했습니다.");
    }
  };

  // 모든 권한이 허용되었는지 확인하는 함수
  const checkIfAllGranted = (currentPermissions) => {
    if (
      currentPermissions.screenTime &&
      currentPermissions.overlay &&
      currentPermissions.accessibility
    ) {
      onPermissionsGranted(currentPermissions);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>권한 상태 확인 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Image
            source={require("../../../assets/permission-icon.png")}
            style={styles.permissionIcon}
            defaultSource={require("../../../assets/permission-icon.png")}
          />

          <Text style={styles.title}>앱 사용을 위한 권한이 필요합니다</Text>

          <Text style={styles.description}>
            UPTENTION은 사용자의 집중력을 향상시키기 위해 다음 권한이 필요합니다.
            각 권한이 필요한 이유를 확인하고 설정해주세요.
          </Text>

          {/* 스크린타임 권한 섹션 */}
          <View style={styles.permissionSection}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>사용량 접근 권한</Text>
              {permissions.screenTime ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="close-circle" size={24} color="#F44336" />
              )}
            </View>
            
            <Text style={styles.permissionDescription}>
              앱 사용 시간을 측정하고 집중 모드를 관리하기 위해 필요합니다.
            </Text>
            
            {!permissions.screenTime && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestScreenTimePermission}
              >
                <Text style={styles.permissionButtonText}>권한 설정하기</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 오버레이 권한 섹션 */}
          <View style={styles.permissionSection}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>다른 앱 위에 표시 권한</Text>
              {permissions.overlay ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="close-circle" size={24} color="#F44336" />
              )}
            </View>
            
            <Text style={styles.permissionDescription}>
              집중 모드 실행 중 다른 앱 사용을 제한하기 위해 필요합니다.
            </Text>
            
            {!permissions.overlay && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestOverlayPermission}
              >
                <Text style={styles.permissionButtonText}>권한 설정하기</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 접근성 권한 섹션 */}
          <View style={styles.permissionSection}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>접근성 권한</Text>
              {permissions.accessibility ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="close-circle" size={24} color="#F44336" />
              )}
            </View>
            
            <Text style={styles.permissionDescription}>
              앱 전환 감지 및 집중 모드 관리를 위해 필요합니다.
            </Text>
            
            {!permissions.accessibility && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestAccessibilityPermission}
              >
                <Text style={styles.permissionButtonText}>권한 설정하기</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.privacyNote}>
            사용자의 개인정보는 안전하게 보호되며, 집중력 향상 목적으로만
            사용됩니다.
          </Text>

          {/* 모든 권한 한번에 설정 버튼 */}
          {!(permissions.screenTime && permissions.overlay && permissions.accessibility) && (
            <TouchableOpacity
              style={styles.allPermissionsButton}
              onPress={() => {
                // 부족한 권한 중 첫 번째 권한 요청
                if (!permissions.screenTime) {
                  requestScreenTimePermission();
                } else if (!permissions.overlay) {
                  requestOverlayPermission();
                } else if (!permissions.accessibility) {
                  requestAccessibilityPermission();
                }
              }}
            >
              <Text style={styles.allPermissionsButtonText}>모든 권한 설정하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#555",
    lineHeight: 24,
  },
  permissionSection: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  privacyNote: {
    fontSize: 14,
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    marginBottom: 20,
    fontStyle: "italic",
  },
  allPermissionsButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    marginTop: 10,
    width: '100%',
  },
  allPermissionsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

export default PermissionsScreen;