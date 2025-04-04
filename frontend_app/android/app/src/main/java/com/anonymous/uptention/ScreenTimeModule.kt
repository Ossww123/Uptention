package com.anonymous.uptention

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.util.*
import kotlin.collections.HashMap

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ScreenTimeModule"
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        val context = reactApplicationContext
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(), context.packageName
            )
        } else {
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(), context.packageName
            )
        }
        val granted = mode == AppOpsManager.MODE_ALLOWED
        promise.resolve(granted)
    }

    @ReactMethod
    fun openUsageSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    // 패키지명에서 앱 이름을 가져오는 메서드
    @ReactMethod
    fun getAppName(packageName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            val appName = pm.getApplicationLabel(appInfo).toString()
            promise.resolve(appName)
        } catch (e: Exception) {
            // 패키지가 설치되어 있지 않거나, 접근할 수 없는 경우
            // 패키지명의 마지막 부분을 반환
            val parts = packageName.split(".")
            val lastPart = parts.lastOrNull() ?: packageName
            promise.resolve(lastPart.capitalize())
        }
    }

    // 모든 앱 이름을 한 번에 가져오는 메서드
    @ReactMethod
    fun getAllAppNames(packageNames: ReadableArray, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val result = Arguments.createMap()
            
            for (i in 0 until packageNames.size()) {
                val packageName = packageNames.getString(i)
                try {
                    val appInfo = pm.getApplicationInfo(packageName, 0)
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    result.putString(packageName, appName)
                } catch (e: Exception) {
                    // 패키지가 설치되어 있지 않거나, 접근할 수 없는 경우
                    val parts = packageName.split(".")
                    val lastPart = parts.lastOrNull() ?: packageName
                    result.putString(packageName, lastPart.capitalize())
                }
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // 앱 아이콘을 가져오는 메서드
    @ReactMethod
    fun getAppIcon(packageName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val drawable = pm.getApplicationIcon(packageName)
            
            // Drawable을 Bitmap으로 변환
            val bitmap = Bitmap.createBitmap(drawable.intrinsicWidth, drawable.intrinsicHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            
            // Bitmap을 Base64 인코딩
            val byteArrayOutputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
            val byteArray = byteArrayOutputStream.toByteArray()
            val base64 = Base64.encodeToString(byteArray, Base64.DEFAULT)
            
            promise.resolve(base64)
        } catch (e: Exception) {
            // 앱 아이콘을 가져올 수 없는 경우
            promise.reject("ERROR", e.message)
        }
    }

    // 여러 앱 아이콘을 한 번에 가져오는 메서드
@ReactMethod
fun getMultipleAppIcons(packageNames: ReadableArray, promise: Promise) {
    try {
        val pm = reactApplicationContext.packageManager
        val result = Arguments.createMap()
        
        for (i in 0 until packageNames.size()) {
            try {
                val packageName = packageNames.getString(i)  // 이 변수가 선언되었는지 확인
                val drawable = pm.getApplicationIcon(packageName)
                
                // Drawable을 Bitmap으로 변환
                val bitmap = Bitmap.createBitmap(drawable.intrinsicWidth, drawable.intrinsicHeight, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                
                // Bitmap을 Base64 인코딩
                val byteArrayOutputStream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
                val byteArray = byteArrayOutputStream.toByteArray()
                val base64 = Base64.encodeToString(byteArray, Base64.DEFAULT)
                
                result.putString(packageName, base64)
            } catch (e: Exception) {
                // 특정 앱 아이콘을 가져오지 못하면 건너뛰기
                val packageName = packageNames.getString(i)  // 예외 처리 부분에서도 필요할 수 있음
                result.putNull(packageName)
            }
        }
        
        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("ERROR", e.message)
    }
}

    @ReactMethod
fun getDailyScreenTime(dateOffset: Int = 0, promise: Promise) {
    val context = reactApplicationContext
    try {
        if (!hasUsageStatsPermissionInternal()) {
            val map = Arguments.createMap()
            map.putBoolean("hasPermission", false)
            promise.resolve(map)
            return
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val calendar = Calendar.getInstance()
        
        // 기준 날짜 설정 (오늘부터 dateOffset일 전)
        if (dateOffset > 0) {
            calendar.add(Calendar.DAY_OF_YEAR, -dateOffset)
        }
        
        // 해당 날짜의 끝 시간 설정 (23:59:59)
        val endTime = calendar.apply {
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
        
        // 해당 날짜의 시작 시간 설정 (00:00:00)
        val startTime = calendar.apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis

        val appUsageMap = HashMap<String, Long>()
        var totalScreenTime = 0L

        val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        val eventMap = HashMap<String, Long>()

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            val packageName = event.packageName
            
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                eventMap[packageName] = event.timeStamp
            } else if (event.eventType == UsageEvents.Event.ACTIVITY_PAUSED) {
                if (eventMap.containsKey(packageName)) {
                    val startTimeStamp = eventMap[packageName] ?: 0
                    val timeUsed = event.timeStamp - startTimeStamp
                    
                    if (timeUsed > 0) {
                        appUsageMap[packageName] = (appUsageMap[packageName] ?: 0) + timeUsed
                        totalScreenTime += timeUsed
                    }
                    eventMap.remove(packageName)
                }
            }
        }

        // 분 단위로 변환 (밀리초를 60000으로 나눔)
        val totalScreenTimeMinutes = totalScreenTime / 60000

        val result = Arguments.createMap()
        result.putBoolean("hasPermission", true)
        result.putDouble("totalScreenTimeMinutes", totalScreenTimeMinutes.toDouble())
        result.putInt("dateOffset", dateOffset) // 요청한 날짜 오프셋 정보 추가
        
        // 앱별 사용 시간 추가
        val appUsage = Arguments.createMap()
        for ((packageName, timeUsed) in appUsageMap) {
            appUsage.putDouble(packageName, (timeUsed / 60000).toDouble())
        }
        result.putMap("appUsage", appUsage)

        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("ERROR", e.message)
    }
}

@ReactMethod
fun getWeeklyScreenTime(daysToFetch: Int = 14, promise: Promise) {
    val context = reactApplicationContext
    try {
        if (!hasUsageStatsPermissionInternal()) {
            val map = Arguments.createMap()
            map.putBoolean("hasPermission", false)
            promise.resolve(map)
            return
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, -daysToFetch) // daysToFetch일 전 (기본값 14일)
        val startTime = calendar.timeInMillis

        // 일별 데이터를 저장할 맵
        val dailyScreenTime = Arguments.createMap()
        
        // 설정된 일수만큼 데이터 계산
        for (day in 0 until daysToFetch) {
            calendar.timeInMillis = endTime
            calendar.add(Calendar.DAY_OF_YEAR, -day)
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val dayStart = calendar.timeInMillis
            
            calendar.set(Calendar.HOUR_OF_DAY, 23)
            calendar.set(Calendar.MINUTE, 59)
            calendar.set(Calendar.SECOND, 59)
            calendar.set(Calendar.MILLISECOND, 999)
            val dayEnd = calendar.timeInMillis
            
            val usageEvents = usageStatsManager.queryEvents(dayStart, dayEnd)
            val event = UsageEvents.Event()
            val eventMap = HashMap<String, Long>()
            var dayTotalTime = 0L

            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                val packageName = event.packageName
                
                if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                    eventMap[packageName] = event.timeStamp
                } else if (event.eventType == UsageEvents.Event.ACTIVITY_PAUSED) {
                    if (eventMap.containsKey(packageName)) {
                        val startTimeStamp = eventMap[packageName] ?: 0
                        val timeUsed = event.timeStamp - startTimeStamp
                        
                        if (timeUsed > 0) {
                            dayTotalTime += timeUsed
                        }
                        eventMap.remove(packageName)
                    }
                }
            }

            // 해당 날짜에 대한 총 스크린타임 (분 단위)
            val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val dateString = dateFormat.format(Date(dayStart))
            dailyScreenTime.putDouble(dateString, (dayTotalTime / 60000).toDouble())
        }

        val result = Arguments.createMap()
        result.putBoolean("hasPermission", true)
        result.putMap("dailyScreenTime", dailyScreenTime)
        result.putInt("daysToFetch", daysToFetch) // 요청한 일수 정보 추가
        
        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("ERROR", e.message)
    }
}

    private fun hasUsageStatsPermissionInternal(): Boolean {
        val context = reactApplicationContext
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(), context.packageName
            )
        } else {
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(), context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }
}