// src/screens/auth/ScreenTimePermissionScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ScreenTime from "../../utils/ScreenTime";

const ScreenTimePermissionScreen = ({ onPermissionGranted }) => {
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // 컴포넌트 마운트 시 권한 상태 확인
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // 권한 상태 확인 함수
  const checkPermissionStatus = async () => {
    try {
      setLoading(true);
      const granted = await ScreenTime.hasUsageStatsPermission();
      setHasPermission(granted);

      // 권한이 이미 있는 경우, 자동으로 다음 단계로 진행
      if (granted) {
        setTimeout(() => {
          onPermissionGranted();
        }, 1000);
      }
    } catch (error) {
      console.error("Permission check error:", error);
      Alert.alert("오류", "권한 상태를 확인하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 권한 요청 함수
  const requestPermission = async () => {
    try {
      // 권한 설정 화면으로 이동
      await ScreenTime.openUsageSettings();

      // 사용자가 설정에서 돌아오면 권한 상태 재확인
      Alert.alert(
        "권한 설정",
        "설정에서 UPTENTION 앱에 사용량 접근 권한을 허용한 후 돌아와주세요.",
        [
          {
            text: "확인",
            onPress: async () => {
              // 권한 상태 확인
              const granted = await ScreenTime.hasUsageStatsPermission();
              setHasPermission(granted);

              if (granted) {
                onPermissionGranted();
              } else {
                Alert.alert(
                  "권한 필요",
                  "앱을 사용하려면 사용량 접근 권한이 필요합니다.",
                  [
                    { text: "나중에", style: "cancel" },
                    { text: "다시 시도", onPress: requestPermission },
                  ]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Permission request error:", error);
      Alert.alert("오류", "권한 요청 중 오류가 발생했습니다.");
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
      <View style={styles.content}>
        <Image
          source={require("../../../assets/permission-icon.png")}
          style={styles.permissionIcon}
          defaultSource={require("../../../assets/permission-icon.png")}
        />

        <Text style={styles.title}>사용량 접근 권한이 필요합니다</Text>

        <Text style={styles.description}>
          UPTENTION은 사용자의 집중력을 향상시키기 위해 앱 사용 시간을
          측정합니다. 이를 위해 사용량 접근 권한이 필요합니다.
        </Text>

        <View style={styles.bulletPoints}>
          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C00" />
            <Text style={styles.bulletText}>스크린 타임 측정 및 분석</Text>
          </View>

          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C00" />
            <Text style={styles.bulletText}>집중 모드 사용 시간 기록</Text>
          </View>

          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={24} color="#FF8C00" />
            <Text style={styles.bulletText}>앱 사용 패턴 분석</Text>
          </View>
        </View>

        <Text style={styles.privacyNote}>
          사용자의 개인정보는 안전하게 보호되며, 집중력 향상 목적으로만
          사용됩니다.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>권한 설정하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#555",
    lineHeight: 24,
  },
  bulletPoints: {
    alignSelf: "stretch",
    marginBottom: 30,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  privacyNote: {
    fontSize: 14,
    textAlign: "center",
    color: "#888",
    marginBottom: 40,
    fontStyle: "italic",
  },
  permissionButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: "center",
    marginTop: 20,
  },
  permissionButtonText: {
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

export default ScreenTimePermissionScreen;
