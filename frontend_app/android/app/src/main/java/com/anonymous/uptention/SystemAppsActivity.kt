package com.anonymous.uptention

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class SystemAppsActivity : AppCompatActivity() {
    private lateinit var appBlockerManager: AppBlockerManager
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: SystemAppsAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_system_apps)

        appBlockerManager = AppBlockerManager(this)
        recyclerView = findViewById(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)
        
        title = "시스템 앱 관리"

        loadApps()
    }

    private fun loadApps() {
        val apps = appBlockerManager.getSystemApps()
        Log.d("SystemAppsActivity", "로드된 앱 수: ${apps.size}")
        
        adapter = SystemAppsAdapter(apps) { app, isBlocked ->
            appBlockerManager.setAppBlocked(app.packageName, isBlocked)
            val message = if (isBlocked) {
                "${app.appName} 앱이 차단되었습니다"
            } else {
                "${app.appName} 앱이 허용되었습니다"
            }
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            
            // 상태 변경 후 목록 새로고침
            loadApps()
        }
        recyclerView.adapter = adapter
    }

    // 앱 패키지명에 따른 한글 이름 반환
    private fun getKoreanAppName(packageName: String): String {
        return when {
            packageName.contains("dialer") -> "전화"
            packageName.contains("calculator") -> "계산기"
            packageName.contains("camera") -> "카메라"
            packageName.contains("mms") || packageName.contains("messaging") -> "메시지"
            packageName.contains("gallery") || packageName.contains("photos") -> "갤러리"
            else -> packageName
        }
    }
}

class SystemAppsAdapter(
    private val apps: List<AppInfo>,
    private val onToggleChanged: (AppInfo, Boolean) -> Unit
) : RecyclerView.Adapter<SystemAppsAdapter.ViewHolder>() {

    init {
        Log.d("SystemAppsAdapter", "어댑터 초기화 - 앱 목록 크기: ${apps.size}")
        apps.forEach { app ->
            Log.d("SystemAppsAdapter", "앱 정보: ${app.appName} (${app.packageName}) - 허용됨: ${app.isAllowed}")
        }
    }

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val appNameTextView: TextView = view.findViewById(R.id.appNameTextView)
        val packageNameTextView: TextView = view.findViewById(R.id.packageNameTextView)
        val checkBox: CheckBox = view.findViewById(R.id.checkBox)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_system_app, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val app = apps[position]
        
        // 앱 이름 설정 (이미 한글로 설정되어 있음)
        holder.appNameTextView.text = app.appName
        holder.packageNameTextView.text = app.packageName
        holder.checkBox.isChecked = !app.isAllowed
        
        Log.d("SystemAppsAdapter", "바인딩: ${app.appName} - 차단됨: ${!app.isAllowed}")
        
        // 토글 변경 리스너 설정
        holder.checkBox.setOnCheckedChangeListener { _, isChecked ->
            Log.d("SystemAppsAdapter", "토글 변경: ${app.appName} - 차단 설정: $isChecked")
            onToggleChanged(app, isChecked)
        }
    }

    override fun getItemCount() = apps.size
}