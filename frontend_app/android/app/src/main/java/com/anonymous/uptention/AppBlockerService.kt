package com.anonymous.uptention

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast

class AppBlockerService : AccessibilityService() {

    private val mainHandler = Handler(Looper.getMainLooper())
    private lateinit var appBlockerManager: AppBlockerManager
    private var lastBlockedPackage: String = ""
    private var lastBlockTime: Long = 0
    private var isDialogShowing = false
    
    // 태그 추가
    companion object {
        const val PREFS_NAME = "AppBlockerPrefs"
        const val KEY_BLOCKING_ENABLED = "blocking_enabled"
        private const val TAG = "AppBlockerService"
    }

    override fun onCreate() {
        super.onCreate()
        appBlockerManager = AppBlockerManager(this)
        Log.d(TAG, "AppBlockerService created")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        // 차단 기능이 비활성화되어 있으면 아무것도 하지 않음
        if (!isBlockingEnabled()) {
            Log.d(TAG, "App blocking is disabled")
            return
        }

        val packageName = event.packageName?.toString() ?: return
        Log.d(TAG, "Event received for package: $packageName, event type: ${event.eventType}")
        
        // 중복 차단 방지 (같은 패키지에 대해 1초 이내 반복 차단 방지)
        val currentTime = System.currentTimeMillis()
        if (packageName == lastBlockedPackage && currentTime - lastBlockTime < 3000) {
            Log.d(TAG, "Ignored duplicate event for $packageName (within 3 seconds)")
            return
        }

        // 필수 앱 목록에 있는 앱만 허용, 나머지는 모두 차단
        if (appBlockerManager.isEssentialApp(packageName)) {
            Log.d(TAG, "Allowed essential app: $packageName")
            return // 허용
        }
        
        // 로그 추가: 시스템 앱 여부 확인 
        try {
            val packageManager = applicationContext.packageManager
            val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
            val isSystemApp = (applicationInfo.flags and (ApplicationInfo.FLAG_SYSTEM or ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)) != 0
            Log.d(TAG, "App $packageName - isSystemApp: $isSystemApp")
        } catch (e: Exception) {
            Log.e(TAG, "Error checking system app status: $e")
        }
        
        // 필수 앱이 아닌 경우 차단 정보 업데이트
        lastBlockedPackage = packageName
        lastBlockTime = currentTime
        Log.d(TAG, "Blocking app: $packageName, dialog showing: $isDialogShowing")
        
        // 차단 다이얼로그 표시
        mainHandler.post {
            showBlockDialog(getAppName(packageName))
        }
    }

    private fun isBlockingEnabled(): Boolean {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_BLOCKING_ENABLED, false)
    }

    private fun getAppName(packageName: String): String {
        try {
            val packageManager = applicationContext.packageManager
            val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
            return packageManager.getApplicationLabel(applicationInfo).toString()
        } catch (e: Exception) {
            return packageName
        }
    }

    private fun showBlockDialog(appName: String) {
        // 이미 다이얼로그가 표시 중이면 무시
        if (isDialogShowing) {
            Log.d(TAG, "Dialog already showing. Ignoring for app: $appName")
            return
        }
        
        isDialogShowing = true
        Log.d(TAG, "Showing block dialog for app: $appName")
        
        val dialog = AlertDialog.Builder(this)
            .setTitle("앱 사용 제한")
            .setMessage("집중모드에선 허용되지 않은 앱입니다.")
            .setPositiveButton("확인") { _, _ ->
                // 확인 버튼 클릭 시 홈 화면으로 이동
                val homeIntent = Intent(Intent.ACTION_MAIN)
                homeIntent.addCategory(Intent.CATEGORY_HOME)
                homeIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                startActivity(homeIntent)
                
                // 다이얼로그 닫힘 상태로 변경
                isDialogShowing = false
                Log.d(TAG, "Dialog closed and redirected to home")
            }
            .setCancelable(false)
            .create()

        dialog.window?.setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY)
        
        // 다이얼로그가 닫힐 때 상태 업데이트
        dialog.setOnDismissListener {
            isDialogShowing = false
            Log.d(TAG, "Dialog dismissed")
        }
        
        dialog.show()
    }

    override fun onInterrupt() {
        Log.d(TAG, "Service interrupted")
    }

    override fun onServiceConnected() {
        Log.d(TAG, "Service connected")
        val info = AccessibilityServiceInfo()
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
        serviceInfo = info
        
        // 오버레이 권한 체크
        if (!Settings.canDrawOverlays(this)) {
            // 권한이 없는 경우 알림
            Toast.makeText(this, "화면 오버레이 권한이 필요합니다", Toast.LENGTH_LONG).show()
            Log.d(TAG, "Overlay permission not granted")
        } else {
            Log.d(TAG, "Overlay permission granted")
        }
    }
}