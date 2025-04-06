package com.anonymous.uptention

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

import android.os.Bundle
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // 알림 채널 생성 (Android O 이상)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channelId = "uptention_channel"
      val channelName = "Uptention Notifications"
      val channelDescription = "Notifications for Uptention app"
      val importance = NotificationManager.IMPORTANCE_DEFAULT
      
      val channel = NotificationChannel(channelId, channelName, importance).apply {
        description = channelDescription
        enableLights(true)
        enableVibration(true)
      }
      
      val notificationManager = 
        getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.createNotificationChannel(channel)
    }
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      DefaultReactActivityDelegate(this, mainComponentName)
    )
  }
}