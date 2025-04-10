package com.anonymous.uptention

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.View
import android.view.Window
import com.facebook.react.bridge.*

class AppBlockerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val appBlockerManager = AppBlockerManager(reactContext)

    override fun getName(): String = "AppBlockerModule"

    private fun setImmersiveMode(enable: Boolean) {
        val activity = currentActivity
        activity?.runOnUiThread {
            val window = activity.window
            val decorView = window.decorView
            
            if (enable) {
                // 전체 화면 모드 설정
                val flags = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
                
                decorView.systemUiVisibility = flags
            } else {
                // 일반 모드로 복원
                decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
            }
        }
    }

    @ReactMethod
    fun isAppBlockingEnabled(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences(
            AppBlockerService.PREFS_NAME, 
            Context.MODE_PRIVATE
        )
        val isEnabled = prefs.getBoolean(AppBlockerService.KEY_BLOCKING_ENABLED, false)
        promise.resolve(isEnabled)
    }

    @ReactMethod
    fun setAppBlockingEnabled(enabled: Boolean, promise: Promise) {
        try {
            if (enabled) {
                // 앱 차단 상태 초기화
                appBlockerManager.initializeAppBlockingStates()
                // 시스템 앱들의 초기 상태 설정
                appBlockerManager.getSystemApps()
                // 전체 화면 모드 활성화
                setImmersiveMode(true)
            } else {
                // 전체 화면 모드 비활성화
                setImmersiveMode(false)
            }
            
            val prefs = reactApplicationContext.getSharedPreferences(
                AppBlockerService.PREFS_NAME, 
                Context.MODE_PRIVATE
            )
            prefs.edit().putBoolean(AppBlockerService.KEY_BLOCKING_ENABLED, enabled).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("APP_BLOCKING_ERROR", "앱 차단 상태 변경 중 오류 발생", e)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun openOverlaySettings() {
        val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        val accessibilityEnabled = Settings.Secure.getInt(
            reactApplicationContext.contentResolver,
            Settings.Secure.ACCESSIBILITY_ENABLED,
            0
        )

        if (accessibilityEnabled == 1) {
            val serviceString = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            serviceString?.let {
                val isEnabled = it.contains(
                    "${reactApplicationContext.packageName}/${AppBlockerService::class.java.name}"
                )
                promise.resolve(isEnabled)
                return
            }
        }
        promise.resolve(false)
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        val hasPermission = Settings.canDrawOverlays(reactApplicationContext)
        promise.resolve(hasPermission)
    }

    @ReactMethod
    fun openSystemAppsActivity() {
        val intent = Intent(reactApplicationContext, SystemAppsActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getSystemApps(promise: Promise) {
        try {
            val apps = appBlockerManager.getSystemApps()
            val result = Arguments.createArray()
            
            for (app in apps) {
                val appMap = Arguments.createMap()
                appMap.putString("packageName", app.packageName)
                appMap.putString("appName", app.appName)
                appMap.putBoolean("isSystemApp", app.isSystemApp)
                appMap.putBoolean("isAllowed", app.isAllowed)
                result.pushMap(appMap)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setAppBlocked(packageName: String, blocked: Boolean, promise: Promise) {
        try {
            appBlockerManager.setAppBlocked(packageName, blocked)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}