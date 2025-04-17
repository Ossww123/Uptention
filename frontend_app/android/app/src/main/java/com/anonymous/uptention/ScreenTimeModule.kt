package com.anonymous.uptention

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build
import android.os.Bundle
import android.os.Process
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.util.*
import kotlin.collections.HashMap
import android.net.Uri
import android.graphics.drawable.Drawable


class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ScreenTimeModule"
    }

    // 오버레이 권한 확인
    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        val context = reactApplicationContext
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true // Android 6.0 이전 버전에서는 별도 권한이 필요 없음
        }
        promise.resolve(hasPermission)
    }

    // 오버레이 권한 설정 화면 열기
    @ReactMethod
    fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, 
                Uri.parse("package:" + reactApplicationContext.packageName))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }

    // 접근성 권한 확인
    @ReactMethod
    fun hasAccessibilityPermission(promise: Promise) {
        val context = reactApplicationContext
        val accessibilityEnabled = try {
            Settings.Secure.getInt(context.contentResolver, Settings.Secure.ACCESSIBILITY_ENABLED)
        } catch (e: Settings.SettingNotFoundException) {
            0
        }
        
        if (accessibilityEnabled == 1) {
            val servicesString = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            val packageName = context.packageName
            val serviceName = packageName + "/com.anonymous.uptention.AppBlockerService"
            
            val hasService = servicesString?.contains(serviceName) ?: false
            promise.resolve(hasService)
        } else {
            promise.resolve(false)
        }
    }

    // 접근성 설정 화면 열기
    @ReactMethod
    fun openAccessibilitySettings() {
        try {
            // 직접 앱의 접근성 설정으로 이동 시도
            val componentName = ComponentName(reactApplicationContext.packageName, 
                "com.anonymous.uptention.AppBlockerService")
            
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            val bundle = Bundle()
            bundle.putString(":settings:fragment_args_key", componentName.flattenToString())
            intent.putExtra(":settings:fragment_args_key", componentName.flattenToString())
            intent.putExtra(":settings:show_fragment_args", bundle)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // 실패 시 일반 접근성 설정으로 이동
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
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
        try {
            // 특정 앱 사용량 접근 설정으로 이동 시도
            val packageUri = Uri.parse("package:" + reactApplicationContext.packageName)
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, packageUri)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // 실패 시 일반 사용량 접근 설정으로 이동
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
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
        val pm = reactApplicationContext.packageManager

        // 미리 알려진 앱들의 패키지 이름과 대응하는 리소스 ID 매핑
    val knownApps = mapOf(
    "com.google.android.youtube" to "youtube_icon",
    "app.phantom" to "phantom_icon",
    "com.discord" to "discord_icon",               // Discord
    "com.samsung.android.video" to "videos_icon",  // Samsung Videos
    "com.samsung.android.app.notes" to "notes_icon", // Samsung Notes
    "com.google.android.apps.photos" to "photos_icon",  // Google Photos
    "com.google.android.apps.maps" to "maps_icon", // Google Maps
    "com.sec.android.app.music" to "music_icon"    // Samsung Music
    // 더 많은 주요 앱 추가 가능
)

        try {
            // 0차 시도: 알려진 앱 확인
        if (knownApps.containsKey(packageName)) {
            // React Native에서는 JS 측에서 앱 번들에 포함된 아이콘을 사용하도록 신호 전달
            promise.resolve("KNOWN_APP:" + knownApps[packageName])
            return
        }

            // 1차 시도: 기본 방식
            try {
                val drawable = pm.getApplicationIcon(packageName)
                val base64 = drawableToBase64(drawable)
                promise.resolve(base64)
                return
            } catch (e: Exception) {
                // 1차 실패, 아래로 넘어감
            }

            // 2차 시도: 리소스 직접 접근
            try {
                val resources = pm.getResourcesForApplication(packageName)
                val appInfo = pm.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
                val iconId = appInfo.icon
                
                if (iconId != 0) {
                    val drawable = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        resources.getDrawable(iconId, null)
                    } else {
                        @Suppress("DEPRECATION")
                        resources.getDrawable(iconId)
                    }
                    val base64 = drawableToBase64(drawable)
                    promise.resolve(base64)
                    return
                }
            } catch (e: Exception) {
                // 2차 실패, 아래로 넘어감
            }

            // 3차 시도: ResolveInfo 방식
            try {
                val intent = Intent(Intent.ACTION_MAIN, null)
                intent.addCategory(Intent.CATEGORY_LAUNCHER)
                val resolveInfoList = pm.queryIntentActivities(intent, 0)

                for (resolveInfo in resolveInfoList) {
                    val resolvedPackageName = resolveInfo.activityInfo.packageName
                    if (resolvedPackageName == packageName) {
                        val drawable = resolveInfo.loadIcon(pm)
                        val base64 = drawableToBase64(drawable)
                        promise.resolve(base64)
                        return
                    }
                }
            } catch (e: Exception) {
                // 3차 실패, 아래로 넘어감
            }

            // 4차 시도: 앱 이름 기반 대체 이미지 생성 (첫 글자를 원 안에 표시)
            try {
                val appName = getAppNameInternal(packageName)
                val firstChar = appName.first().toString()
                val base64 = generateLetterIcon(firstChar, packageName)
                promise.resolve(base64)
                return
            } catch (e: Exception) {
                // 실패 시 기본값 반환
            }

            // 모든 시도 실패 시
            promise.resolve(null)

        } catch (e: Exception) {
            promise.resolve(null) // reject 대신 null 반환으로 앱 충돌 방지
        }
    }

    // 내부용 앱 이름 가져오기 함수
    private fun getAppNameInternal(packageName: String): String {
        return try {
            val pm = reactApplicationContext.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            val parts = packageName.split(".")
            parts.lastOrNull()?.capitalize() ?: packageName
        }
    }

    // 문자 기반 아이콘 생성 함수
    private fun generateLetterIcon(letter: String, packageName: String): String {
        // 패키지 이름에서 결정적(deterministic) 색상 생성
        val hash = packageName.hashCode()
        val hue = ((hash % 360) + 360) % 360  // 0-359 범위의 색조값
        val color = android.graphics.Color.HSVToColor(floatArrayOf(hue.toFloat(), 0.8f, 0.8f))
        
        // 비트맵 생성
        val size = 192  // 아이콘 크기
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        
        // 배경 원 그리기
        val paint = android.graphics.Paint()
        paint.color = color
        paint.isAntiAlias = true
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint)
        
        // 문자 그리기
        paint.color = android.graphics.Color.WHITE
        paint.textSize = size / 2f
        paint.textAlign = android.graphics.Paint.Align.CENTER
        val textHeight = (paint.descent() + paint.ascent()) / 2
        canvas.drawText(letter, size / 2f, size / 2f - textHeight, paint)
        
        // 비트맵을 Base64로 변환
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        val byteArray = stream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.DEFAULT)
    }

        // Helper: Drawable -> Base64
        private fun drawableToBase64(drawable: Drawable): String {
            val bitmap = Bitmap.createBitmap(
                drawable.intrinsicWidth,
                drawable.intrinsicHeight,
                Bitmap.Config.ARGB_8888
            )
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)

            val stream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            val byteArray = stream.toByteArray()
            return Base64.encodeToString(byteArray, Base64.DEFAULT)
        }


    // 여러 앱 아이콘을 한 번에 가져오는 메서드
    @ReactMethod
    fun getMultipleAppIcons(packageNames: ReadableArray, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val result = Arguments.createMap()
            
            for (i in 0 until packageNames.size()) {
                try {
                    val packageName = packageNames.getString(i)
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
                    val packageName = packageNames.getString(i)
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
            
            // 앱별 사용 시간을 저장할 맵
            val appUsageMap = HashMap<String, Long>()
            
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

                // 일별 앱 사용 시간을 저장할 임시 맵
                val dayAppUsageMap = HashMap<String, Long>()

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
                                // 앱별 사용 시간 추적
                                dayAppUsageMap[packageName] = 
                                    (dayAppUsageMap[packageName] ?: 0) + timeUsed
                            }
                            eventMap.remove(packageName)
                        }
                    }
                }

                // 해당 날짜에 대한 총 스크린타임 (분 단위)
                val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val dateString = dateFormat.format(Date(dayStart))
                dailyScreenTime.putDouble(dateString, (dayTotalTime / 60000).toDouble())

                // 앱별 사용 시간 누적
                dayAppUsageMap.forEach { (packageName, time) ->
                    appUsageMap[packageName] = (appUsageMap[packageName] ?: 0) + time
                }
            }

            // 앱 사용 시간을 분 단위로 변환하여 맵 생성
            val appUsage = Arguments.createMap()
            appUsageMap.forEach { (packageName, time) ->
                appUsage.putDouble(packageName, (time / 60000).toDouble())
            }

            val result = Arguments.createMap()
            result.putBoolean("hasPermission", true)
            result.putMap("dailyScreenTime", dailyScreenTime)
            result.putMap("appUsage", appUsage)
            result.putInt("daysToFetch", daysToFetch)
            
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