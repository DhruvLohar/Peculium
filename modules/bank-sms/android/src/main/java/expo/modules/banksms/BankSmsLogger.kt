package expo.modules.banksms

import android.util.Log

private const val TAG = "BankSms"

/**
 * Central trace point for the SMS-capture pipeline (receive -> parse -> enqueue -> notify).
 *
 * Every line goes to `adb logcat -s BankSms` as usual, and is also mirrored to JS via
 * [listener] (wired up by [BankSmsModule] to the "onDebugLog" event) so the same trace shows up
 * in the Metro/dev-server terminal without needing a device log.
 */
object BankSmsLogger {
  /** Set by [BankSmsModule] while the JS runtime is alive. */
  @Volatile
  var listener: ((level: String, message: String) -> Unit)? = null

  fun d(message: String) = emit("d", message) { Log.d(TAG, message) }

  fun w(message: String) = emit("w", message) { Log.w(TAG, message) }

  fun e(message: String, throwable: Throwable? = null) = emit("e", message) {
    if (throwable != null) Log.e(TAG, message, throwable) else Log.e(TAG, message)
  }

  private inline fun emit(level: String, message: String, logToLogcat: () -> Unit) {
    logToLogcat()
    runCatching { listener?.invoke(level, message) }
  }
}
