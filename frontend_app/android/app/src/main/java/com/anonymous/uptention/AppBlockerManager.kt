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
            "com.android.launcher3",                     // 기본 홈 런처
            "com.anonymous.uptention",                   // 현재 앱
            "com.android.settings",                      // 설정
            "com.android.systemui",                      // 시스템 UI
            "com.google.android.apps.nexuslauncher",    // Pixel 런처
            "com.google.android.packageinstaller",       // 패키지 설치 관리자
            "com.android.permissioncontroller",          // 권한 컨트롤러
            "com.sec.android.app.launcher",             // 삼성 런처
            "com.google.android.launcher",               // 구글 런처
            "com.google.android.launcher.layouts.nexus", // Nexus 런처 레이아웃
            "android",                                   // 안드로이드 시스템
            "com.android.launcher2",                     // 레거시 런처
            "com.google.android.googlequicksearchbox",   // 구글 검색
            "com.google.android.inputmethod.latin",      // Gboard
            "com.samsung.android.honeyboard"            // 삼성 키보드
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