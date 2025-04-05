package com.anonymous.uptention

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.util.Log

class AppBlockerManager(private val context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    companion object {
        const val PREFS_NAME = "AppBlockerPrefs"
        const val KEY_BLOCKED_SYSTEM_APPS = "blocked_system_apps"
        private const val TAG = "AppBlockerManager"
        
        // 항상 허용되어야 하는 필수 앱 목록
        private val ESSENTIAL_APPS = setOf(
            // 기본 시스템 및 UI 기능
            "com.android.launcher3",                     // 기본 홈 런처
            "com.anonymous.uptention",                   // 현재 앱
            "com.android.settings",                      // 설정
            "com.samsung.android.settings",              // 삼성 설정
            "com.android.systemui",                      // 시스템 UI
            "com.google.android.apps.nexuslauncher",    // Pixel 런처
            "com.google.android.packageinstaller",       // 패키지 설치 관리자
            "com.android.permissioncontroller",          // 권한 컨트롤러
            "com.sec.android.app.launcher",             // 삼성 런처
            "com.google.android.launcher",               // 구글 런처
            "com.google.android.launcher.layouts.nexus", // Nexus 런처 레이아웃
            "android",                                   // 안드로이드 시스템
            "com.android.launcher2",                     // 레거시 런처
            "com.lge.launcher3",                         // LG 홈 (LG 런처)
            
            // 개발 및 지갑 앱
            "com.expo.development",                     // Expo Go
            "com.phantom.mobile.wallet",                // Phantom 지갑
            
            // 핵심 통신 기능
            "com.android.dialer",                        // 안드로이드 전화
            "com.samsung.android.dialer",                // 삼성 전화
            "com.google.android.dialer",                 // Google 전화
            "com.android.phone",                         // 전화 서비스
            "com.android.mms",                           // 안드로이드 메시지
            "com.samsung.android.messaging",             // 삼성 메시지
            "com.android.messaging",                     // 안드로이드 메시지
            "com.google.android.apps.messaging",         // 구글 메시지
            
            // 업무에 필수적인 앱
            "com.google.android.gm",                     // Gmail
            "com.google.android.calendar",               // Google 캘린더
            "com.samsung.android.calendar",              // 삼성 캘린더
            "com.google.android.apps.docs",              // Google 문서
            "com.samsung.android.app.notes",             // 삼성 노트
            "com.google.android.apps.tachyon",           // Google Meet
            
            // 입력 관련(필수)
            "com.google.android.inputmethod.latin",      // Gboard
            "com.google.android.inputmethod.korean",     // Google 한국어 입력기
            "com.samsung.android.honeyboard",           // 삼성 키보드
            "com.lge.ime",                               // LG 키보드
            
            // 핵심 시스템 서비스
            "com.google.android.gms",                    // Google Play 서비스
            "com.google.android.gsf",                    // Google 서비스 프레임워크
            "com.android.providers.media",               // 미디어 저장소
            "com.android.providers.downloads",           // 다운로드 매니저
            "com.android.providers.settings",            // 시스템 설정 제공자
            "com.google.android.googlequicksearchbox",   // 구글 검색
            "com.samsung.android.app.contacts",          // 삼성 연락처
            "com.google.android.contacts",               // Google 주소록
            
            // 업무용 도구
            "com.android.calculator2",                   // 안드로이드 계산기
            "com.sec.android.calculator",                // 삼성 계산기
            "com.google.android.calculator",             // Google 계산기
            "com.android.documentsui",                   // 파일 관리자
            "com.sec.android.app.myfiles",               // 내 파일
            "com.google.android.apps.nbu.files",         // Files by Google
            "com.google.android.apps.translate",         // Google 번역
            "com.android.camera",                        // 안드로이드 카메라
            "com.android.camera2",                       // 안드로이드 카메라2
            "com.sec.android.app.camera",                // 삼성 카메라
            "com.lge.camera",                            // LG 카메라
            "com.lge.qmemoplus",                         // Q메모+(메모 앱)
            
            // 디바이스 안정성과 관련된 앱
            "com.samsung.android.lool",                  // 디바이스 케어
            "com.lge.smartdoctor",                       // 스마트 닥터
            "com.google.android.apps.wellbeing",         // 디지털 웰빙
            "com.google.android.apps.restore",            // 기기 복원
            
            // 시스템 설정
            "com.samsung.android.settings",              // 삼성 설정
            "com.samsung.accessibility",                 // 삼성 접근성 설정
            "com.samsung.android.accessibility.settings", // 삼성 접근성 설정 (대체 패키지)
        )
    }

    // 앱 차단 상태 초기화 (앱 제한 기능 켤 때 호출)
    fun initializeAppBlockingStates() {
        // 기존의 차단된 앱 목록을 모두 초기화
        prefs.edit().putStringSet(KEY_BLOCKED_SYSTEM_APPS, emptySet()).apply()
        Log.d(TAG, "앱 차단 상태가 초기화되었습니다.")
    }

    // 시스템 앱 목록 가져오기
    fun getSystemApps(): List<AppInfo> {
        val packageManager = context.packageManager
        val installedApps = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
        val blockedApps = getBlockedApps()
        
        // 관리 대상 앱 패키지명 패턴 (삼성 기기용 패키지명 추가)
        val appPatterns = mapOf(
            "전화" to listOf(
                "com.android.dialer",
                "com.samsung.android.dialer",
                "com.samsung.android.app.contacts"
            ),
            "계산기" to listOf(
                "com.android.calculator2",
                "com.sec.android.calculator"
            ),
            "카메라" to listOf(
                "com.android.camera",
                "com.android.camera2",
                "com.sec.android.app.camera"
            ),
            "메시지" to listOf(
                "com.android.mms",
                "com.samsung.android.messaging",
                "com.android.messaging",
                "com.google.android.apps.messaging"
            ),
            "갤러리" to listOf(
                "com.sec.android.gallery3d",
                "com.android.gallery3d",
                "com.samsung.android.gallery3d",
                "com.google.android.apps.photos"
            )
        )

        Log.d(TAG, "설치된 앱 목록 검색 시작")
        val result = mutableListOf<AppInfo>()
        
        // 각 앱 유형별로 검색
        appPatterns.forEach { (appType, patterns) ->
            // 해당 유형의 앱을 찾았는지 표시
            var found = false
            
            // 각 패턴에 대해 매칭되는 앱 찾기
            for (pattern in patterns) {
                val matchingApps = installedApps.filter { app ->
                    app.packageName.contains(pattern, ignoreCase = true)
                }
                
                if (matchingApps.isNotEmpty()) {
                    // 첫 번째 매칭되는 앱 사용
                    val app = matchingApps.first()
                    val isBlocked = blockedApps.contains(app.packageName)
                    Log.d(TAG, "찾은 앱: $appType - ${app.packageName} (차단됨: $isBlocked)")
                    
                    result.add(AppInfo(
                        packageName = app.packageName,
                        appName = appType, // 한글 이름 직접 사용
                        isSystemApp = true,
                        isAllowed = !isBlocked
                    ))
                    
                    found = true
                    break // 해당 유형의 첫 번째 매칭 앱을 찾았으므로 다음 유형으로
                }
            }
            
            if (!found) {
                Log.d(TAG, "$appType 유형의 앱을 찾을 수 없습니다.")
            }
        }

        Log.d(TAG, "최종 관리 대상 앱 수: ${result.size}")
        return result.sortedBy { it.appName }
    }

    // 앱이 시스템 앱인지 확인
    private fun isSystemApp(appInfo: ApplicationInfo): Boolean {
        return (appInfo.flags and (ApplicationInfo.FLAG_SYSTEM or ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)) != 0
    }

    // 앱이 필수 앱인지 확인
    fun isEssentialApp(packageName: String): Boolean {
        val result = ESSENTIAL_APPS.contains(packageName)
        Log.d(TAG, "Checking if $packageName is essential: $result")
        return result
    }

    // 앱 차단 상태 변경
    fun setAppBlocked(packageName: String, blocked: Boolean) {
        Log.d(TAG, "앱 차단 상태 변경 시도: $packageName, 차단=$blocked")
        
        // 필수 앱은 차단할 수 없음
        if (isEssentialApp(packageName)) {
            Log.d(TAG, "필수 앱은 차단할 수 없습니다: $packageName")
            return
        }
        
        val blockedApps = getBlockedApps().toMutableSet()
        if (blocked) {
            blockedApps.add(packageName)
            Log.d(TAG, "차단 목록에 추가됨: $packageName")
        } else {
            blockedApps.remove(packageName)
            Log.d(TAG, "차단 목록에서 제거됨: $packageName")
        }
        
        prefs.edit().putStringSet(KEY_BLOCKED_SYSTEM_APPS, blockedApps).apply()
        Log.d(TAG, "현재 차단된 앱 수: ${blockedApps.size}")
    }

    // 앱이 차단되었는지 확인
    fun isAppBlocked(packageName: String): Boolean {
        // 필수 앱은 항상 허용
        if (isEssentialApp(packageName)) {
            Log.d(TAG, "$packageName is essential, not blocked")
            return false
        }
        return getBlockedApps().contains(packageName).also {
            Log.d(TAG, "Checking if $packageName is blocked: $it")
        }
    }

    // 차단된 앱 목록 가져오기
    private fun getBlockedApps(): Set<String> {
        return prefs.getStringSet(KEY_BLOCKED_SYSTEM_APPS, emptySet()) ?: emptySet()
    }
}