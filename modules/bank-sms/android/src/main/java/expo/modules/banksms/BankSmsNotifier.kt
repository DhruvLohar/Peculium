package expo.modules.banksms

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.icu.text.NumberFormat
import android.icu.util.ULocale
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.text.SimpleDateFormat
import java.util.Locale

object BankSmsNotifier {
  private const val CHANNEL_ID = "bank_sms_capture"
  private const val CHANNEL_NAME = "Bank SMS capture"
  private const val DEEP_LINK = "peculium://transaction/pending"
  private const val ACCENT_COLOR = 0xFFFFDB33.toInt()

  @SuppressLint("MissingPermission") // guarded by areNotificationsEnabled()
  fun notify(context: Context, txn: ParsedBankTransaction) {
    val manager = NotificationManagerCompat.from(context)
    // Silently skip; the draft is still queued
    if (!manager.areNotificationsEnabled()) return

    ensureChannel(context)

    val isDebit = txn.type == "EXPENSE"
    val title = "₹${formatAmount(txn.amount)} ${if (isDebit) "debited" else "credited"} · HDFC ••${txn.accountLast4}"
    val text = "${if (isDebit) "To" else "From"} ${txn.party} · ${formatDate(txn.date)}"

    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(DEEP_LINK)).setPackage(context.packageName)
    val contentIntent = PendingIntent.getActivity(
      context,
      txn.ref.hashCode(),
      intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.bank_sms_notification_icon)
      .setColor(ACCENT_COLOR)
      .setContentTitle(title)
      .setContentText(text)
      .setSubText("Needs category")
      .setStyle(NotificationCompat.BigTextStyle().bigText("$text\nTap to review and add a category"))
      .setCategory(NotificationCompat.CATEGORY_STATUS)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(contentIntent)
      .build()

    // Keyed by ref, so a duplicate SMS never creates a second notification
    manager.notify(txn.ref.hashCode(), notification)
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(NotificationManager::class.java) ?: return
    if (nm.getNotificationChannel(CHANNEL_ID) != null) return
    // IMPORTANCE_HIGH so it shows as heads-up
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH)
    )
  }

  private fun formatAmount(amount: Double): String =
    NumberFormat.getNumberInstance(ULocale("en_IN")).apply {
      minimumFractionDigits = 2
      maximumFractionDigits = 2
    }.format(amount)

  private fun formatDate(isoDate: String): String = runCatching {
    val parsed = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(isoDate)!!
    SimpleDateFormat("d MMM yyyy", Locale.US).format(parsed)
  }.getOrDefault(isoDate)
}
