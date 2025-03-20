package com.anonymous.uptention

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
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

    @ReactMethod
    fun getDailyScreenTime(promise: Promise) {
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
            calendar.add(Calendar.DAY_OF_YEAR, -1) // 하루 전
            val startTime = calendar.timeInMillis

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
    fun getWeeklyScreenTime(promise: Promise) {
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
            calendar.add(Calendar.DAY_OF_YEAR, -7) // 일주일 전
            val startTime = calendar.timeInMillis

            // 일별 데이터를 저장할 맵
            val dailyScreenTime = Arguments.createMap()
            
            // 일주일치 데이터 계산
            for (day in 0 until 7) {
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