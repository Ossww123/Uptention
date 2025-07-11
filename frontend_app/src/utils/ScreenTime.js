// ScreenTime.js
import { NativeModules } from "react-native";
const { ScreenTimeModule } = NativeModules;

/**
 * 앱 이름 캐싱을 위한 객체
 */
const appNameCache = {};

/**
 * 앱 아이콘 캐싱을 위한 객체
 */
const appIconCache = {};

// 미리 알려진 앱들의 아이콘 로드
const knownAppIcons = {
  'youtube_icon': require('../../assets/app-icons/youtube.png'),
  'phantom_icon': require('../../assets/app-icons/phantom.png'),
  'discord_icon': require('../../assets/app-icons/discord.png'),
  'videos_icon': require('../../assets/app-icons/videos.png'),
  'notes_icon': require('../../assets/app-icons/notes.png'),
  'photos_icon': require('../../assets/app-icons/photos.png'),
  'maps_icon': require('../../assets/app-icons/maps.png'),
  'music_icon': require('../../assets/app-icons/music.png'),
};

/**
 * ScreenTime 관련 기능을 제공하는 유틸리티 클래스
 */
class ScreenTime {
  /**
   * 사용량 통계 권한이 있는지 확인
   * @returns {Promise<boolean>} 권한 여부
   */
  static hasUsageStatsPermission() {
    return ScreenTimeModule.hasUsageStatsPermission();
  }

  /**
   * 사용량 통계 설정 화면 열기
   */
  static openUsageSettings() {
    ScreenTimeModule.openUsageSettings();
  }

  /**
   * 오버레이 권한이 있는지 확인
   * @returns {Promise<boolean>} 권한 여부
   */
  static hasOverlayPermission() {
    return ScreenTimeModule.hasOverlayPermission();
  }

  /**
   * 오버레이 권한 설정 화면 열기
   */
  static openOverlaySettings() {
    ScreenTimeModule.openOverlaySettings();
  }

  /**
   * 접근성 권한이 있는지 확인
   * @returns {Promise<boolean>} 권한 여부
   */
  static hasAccessibilityPermission() {
    return ScreenTimeModule.hasAccessibilityPermission();
  }

  /**
   * 접근성 권한 설정 화면 열기
   */
  static openAccessibilitySettings() {
    ScreenTimeModule.openAccessibilitySettings();
  }

  /**
   * 패키지명으로 앱 이름 가져오기
   * @param {string} packageName 패키지명
   * @returns {Promise<string>} 앱 이름
   */
  static async getAppName(packageName) {
    // 캐시에 있으면 캐시된 값 반환
    if (appNameCache[packageName]) {
      return appNameCache[packageName];
    }

    // 네이티브 모듈에서 앱 이름 가져오기
    const appName = await ScreenTimeModule.getAppName(packageName);
    // 캐시에 저장
    appNameCache[packageName] = appName;
    return appName;
  }

  /**
   * 여러 패키지명의 앱 이름을 한 번에 가져오기
   * @param {string[]} packageNames 패키지명 배열
   * @returns {Promise<Object>} 패키지명과 앱 이름 매핑 객체
   */
  static async getAllAppNames(packageNames) {
    // 캐시되지 않은 패키지명만 필터링
    const uncachedPackages = packageNames.filter((pkg) => !appNameCache[pkg]);

    if (uncachedPackages.length > 0) {
      // 캐시되지 않은 패키지명들의 앱 이름 가져오기
      const newAppNames = await ScreenTimeModule.getAllAppNames(
        uncachedPackages
      );

      // 캐시에 저장
      Object.keys(newAppNames).forEach((pkg) => {
        appNameCache[pkg] = newAppNames[pkg];
      });
    }

    // 요청된 모든 패키지명에 대한 앱 이름 반환
    const result = {};
    packageNames.forEach((pkg) => {
      result[pkg] = appNameCache[pkg];
    });

    return result;
  }

  /**
   * 패키지명으로 앱 아이콘 가져오기
   * @param {string} packageName 패키지명
   * @returns {Promise<string>} Base64로 인코딩된 앱 아이콘
   */
  static async getAppIcon(packageName) {
    // 캐시에 있으면 캐시된 아이콘 반환
    if (appIconCache[packageName]) {
      return appIconCache[packageName];
    }

    // 미리 알려진 앱 확인
    if (packageName === "com.google.android.youtube") {
      appIconCache[packageName] = { type: 'resource', source: knownAppIcons['youtube_icon'] };
      return appIconCache[packageName];
    }
    
    if (packageName === "app.phantom") {
      appIconCache[packageName] = { type: 'resource', source: knownAppIcons['phantom_icon'] };
      return appIconCache[packageName];
    }

    // 네이티브 모듈에서 앱 아이콘 가져오기
    try {
      const base64Icon = await ScreenTimeModule.getAppIcon(packageName);
      
      if (base64Icon) {
        // 캐시에 저장
        appIconCache[packageName] = { type: 'base64', data: base64Icon };
      } else {
        appIconCache[packageName] = null;
      }
      
      return appIconCache[packageName];
    } catch (error) {
      console.error(`앱 아이콘 가져오기 오류 (${packageName}):`, error);
      return null;
    }
  }

  /**
   * 여러 패키지명의 앱 아이콘을 한 번에 가져오기
   * @param {string[]} packageNames 패키지명 배열
   * @returns {Promise<Object>} 패키지명과 Base64 인코딩된 앱 아이콘 매핑 객체
   */
  static async getMultipleAppIcons(packageNames) {
    // 캐시되지 않은 패키지명만 필터링
    const uncachedPackages = packageNames.filter((pkg) => !appIconCache[pkg]);
    
    // 먼저 알려진 앱들에 대해 처리
    uncachedPackages.forEach(pkg => {
      if (pkg === "com.google.android.youtube") {
        appIconCache[pkg] = { type: 'resource', source: knownAppIcons['youtube_icon'] };
      } else if (pkg === "app.phantom") {
        appIconCache[pkg] = { type: 'resource', source: knownAppIcons['phantom_icon'] };
      }
    });
    
    // 아직 캐시되지 않은 앱들만 필터링
    const stillUncachedPackages = uncachedPackages.filter(pkg => !appIconCache[pkg]);

    if (stillUncachedPackages.length > 0) {
      try {
        // 캐시되지 않은 패키지명들의 앱 아이콘 가져오기
        const newAppIcons = await ScreenTimeModule.getMultipleAppIcons(
          stillUncachedPackages
        );

        // 캐시에 저장
        Object.keys(newAppIcons).forEach((pkg) => {
          if (newAppIcons[pkg]) {
            appIconCache[pkg] = { type: 'base64', data: newAppIcons[pkg] };
          } else {
            appIconCache[pkg] = null;
          }
        });
      } catch (error) {
        console.error("앱 아이콘 가져오기 오류:", error);
      }
    }

    // 요청된 모든 패키지명에 대한 앱 아이콘 반환
    const result = {};
    packageNames.forEach((pkg) => {
      result[pkg] = appIconCache[pkg] || null;
    });

    return result;
  }

  /**
   * 일일 스크린 타임 데이터 가져오기
   * @param {number} dateOffset - 오늘부터 며칠 전 데이터인지 (0: 오늘, 1: 어제, ...)
   * @returns {Promise<Object>} 스크린 타임 데이터
   */
  static async getDailyScreenTime(dateOffset = 0) {
    const data = await ScreenTimeModule.getDailyScreenTime(dateOffset);

    if (data.hasPermission && data.appUsage) {
      // 앱 이름 정보 가져오기
      const packageNames = Object.keys(data.appUsage);
      const appNames = await this.getAllAppNames(packageNames);

      // 앱 아이콘 정보 가져오기
      const appIcons = await this.getMultipleAppIcons(packageNames);

      // 앱 사용 데이터에 앱 이름과 아이콘 정보 추가
      const appUsageWithNames = {};
      Object.entries(data.appUsage).forEach(([packageName, usageTime]) => {
        const appName = appNames[packageName] || packageName;
        appUsageWithNames[packageName] = {
          usageTime: usageTime,
          appName: appName,
          iconBase64: appIcons[packageName],
        };
      });

      data.appUsageWithNames = appUsageWithNames;
    }

    return data;
  }

  /**
   * 특정 날짜의 스크린 타임 데이터 가져오기
   * @param {Date} date - 조회할 날짜
   * @returns {Promise<Object>} 스크린 타임 데이터
   */
  static async getScreenTimeByDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    // 오늘과의 날짜 차이 계산 (일 수)
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // 유효한 범위 내에서만 데이터 요청
    if (diffDays < 0) {
      return {
        hasPermission: true,
        error: "미래 날짜의 데이터는 조회할 수 없습니다.",
      };
    }

    return this.getDailyScreenTime(diffDays);
  }

  /**
   * 주간 스크린 타임 데이터 가져오기
   * @param {number} daysToFetch - 가져올 일수 (기본값: 14)
   * @returns {Promise<Object>} 주간 스크린 타임 데이터
   */
  static async getWeeklyScreenTime(daysToFetch = 14) {
    const data = await ScreenTimeModule.getWeeklyScreenTime(daysToFetch);
    // ScreenTime.js - Raw Weekly Data: data

    if (data.hasPermission && data.appUsage) {
      // ScreenTime.js - App Usage Data Exists: Object.keys(data.appUsage)
      // 앱 이름 정보 가져오기
      const packageNames = Object.keys(data.appUsage);
      const appNames = await this.getAllAppNames(packageNames);

      // 앱 아이콘 정보 가져오기
      const appIcons = await this.getMultipleAppIcons(packageNames);

      // 최종 데이터 확인
      // ScreenTime.js - Processed Weekly Data: { packageCount: packageNames.length, hasAppNames: !!appNames, hasAppIcons: !!appIcons }

      // 앱 사용 데이터에 앱 이름과 아이콘 정보 추가
      const appUsageWithNames = {};
      Object.entries(data.appUsage).forEach(([packageName, usageTime]) => {
        const appName = appNames[packageName] || packageName;
        appUsageWithNames[packageName] = {
          usageTime: usageTime,
          appName: appName,
          iconBase64: appIcons[packageName],
        };
      });

      data.appUsageWithNames = appUsageWithNames;
    } else {
      console.log("ScreenTime.js - No App Usage Data:", data);
    }

    return data;
  }
}

export default ScreenTime;