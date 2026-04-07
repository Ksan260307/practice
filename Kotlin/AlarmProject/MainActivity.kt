package com.posture.reminder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * 姿勢リマインダーアプリのメインアクティビティ
 * * 1. 通知チャンネルの作成
 * 2. Jetpack ComposeによるUI表示
 * 3. WorkManagerによる定期的な通知の予約
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createNotificationChannel()

        setContent {
            PostureReminderTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ReminderScreen(context = this)
                }
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "姿勢リマインダー"
            val descriptionText = "定期的に姿勢を正すよう促します"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel("POSTURE_REMINDER", name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}

@Composable
fun ReminderScreen(context: Context) {
    var isEnabled by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "姿勢リセット習慣",
            style = MaterialTheme.typography.headlineMedium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "30分ごとに通知を送ります。\n鳴ったら10秒間、肩を回して胸を開きましょう。",
            style = MaterialTheme.typography.bodyLarge
        )
        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                isEnabled = !isEnabled
                if (isEnabled) {
                    startReminder(context)
                } else {
                    stopReminder(context)
                }
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isEnabled) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
            )
        ) {
            Text(if (isEnabled) "リマインダーを停止" else "リマインダーを開始")
        }
    }
}

/**
 * WorkManagerを使用して30分おきのリマインダーをセット
 */
fun startReminder(context: Context) {
    val workRequest = PeriodicWorkRequestBuilder<ReminderWorker>(30, TimeUnit.MINUTES)
        .setConstraints(Constraints.NONE)
        .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "PostureReminderWork",
        ExistingPeriodicWorkPolicy.UPDATE,
        workRequest
    )
}

fun stopReminder(context: Context) {
    WorkManager.getInstance(context).cancelUniqueWork("PostureReminderWork")
}

/**
 * 実際に通知を発行するバックグラウンド処理クラス
 */
class ReminderWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        sendNotification()
        return Result.success()
    }

    private fun sendNotification() {
        val notificationManager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val notification = androidx.core.app.NotificationCompat.Builder(applicationContext, "POSTURE_REMINDER")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("姿勢リセットの時間です！")
            .setContentText("肩を10回回して、胸を大きく開きましょう。")
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(1, notification)
    }
}

@Composable
fun PostureReminderTheme(content: @Composable () -> Unit) {
    MaterialTheme(content = content)
}