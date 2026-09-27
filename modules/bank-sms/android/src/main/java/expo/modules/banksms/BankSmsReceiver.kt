package expo.modules.banksms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

/**
 * Manifest-declared SMS_RECEIVED receiver. Runs even when the app is killed.
 * All work is synchronous and takes milliseconds, well inside the receiver budget, so goAsync() is not needed.
 */
class BankSmsReceiver : BroadcastReceiver() {
  companion object {
    /** Set by [BankSmsModule] while the JS runtime is alive. */
    @Volatile
    var listener: ((ParsedBankTransaction) -> Unit)? = null
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    if (!BankSmsStore.isEnabled(context)) {
      BankSmsLogger.d("onReceive: SMS_RECEIVED but capture is disabled, ignoring")
      return
    }

    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
    val grouped = messages.filterNotNull().groupBy { it.originatingAddress.orEmpty() }
    BankSmsLogger.d("onReceive: ${messages.size} SMS part(s) from ${grouped.size} sender(s)")

    // Rebuild multipart messages, grouped by sender
    grouped.values.forEach { parts ->
      val sender = parts.first().originatingAddress.orEmpty()
      val body = parts.joinToString("") { it.messageBody.orEmpty() }
      val receivedAt = parts.first().timestampMillis.takeIf { it > 0 } ?: System.currentTimeMillis()

      BankSmsLogger.d("Reading SMS from \"$sender\": \"${body.take(120).replace("\n", " ")}\"")

      val txn = BankSmsParser.parse(body, receivedAt)
      if (txn == null) {
        BankSmsLogger.d("Parsed \"$sender\": none of the patterns matched, skipping")
        return@forEach
      }

      BankSmsLogger.d(
        "Parsed \"$sender\": found one matching -> type=${txn.type} amount=${txn.amount} " +
          "party=\"${txn.party}\" account=${txn.accountLast4} ref=${txn.ref} date=${txn.date}"
      )

      if (BankSmsStore.enqueue(context, txn)) {
        BankSmsLogger.d("Enqueued txn ref=${txn.ref}, notifying + emitting onTransactionDetected")
        BankSmsNotifier.notify(context, txn)
        runCatching { listener?.invoke(txn) }
      } else {
        BankSmsLogger.d("Skipped txn ref=${txn.ref}: already seen (duplicate delivery)")
      }
    }
  }
}
