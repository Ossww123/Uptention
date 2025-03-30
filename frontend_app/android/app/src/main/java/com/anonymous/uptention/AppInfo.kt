package com.anonymous.uptention

data class AppInfo(
    val packageName: String,
    val appName: String,
    val isSystemApp: Boolean = true,
    var isAllowed: Boolean = false
) 