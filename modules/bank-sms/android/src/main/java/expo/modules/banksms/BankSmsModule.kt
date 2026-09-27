package expo.modules.banksms

import android.Manifest
import android.content.Context
import android.os.Build
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val NO_PERMISSIONS_CODE = "E_NO_PERMISSIONS"
private const val NO_PERMISSIONS_MESSAGE = "Permissions module is null. Are you sure all the installed Expo modules are properly linked?"

class BankSmsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val permissions: Array<String>
    get() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.POST_NOTIFICATIONS)
    } else {
      arrayOf(Manifest.permission.RECEIVE_SMS)
    }

  override fun definition() = ModuleDefinition {
    Name("BankSms")

    Events("onTransactionDetected", "onDebugLog")

    OnCreate {
      BankSmsReceiver.listener = { txn -> sendEvent("onTransactionDetected", txn.toMap()) }
      BankSmsLogger.listener = { level, message ->
        sendEvent("onDebugLog", mapOf("level" to level, "message" to message))
      }
    }

    OnDestroy {
      BankSmsReceiver.listener = null
      BankSmsLogger.listener = null
    }

    AsyncFunction("getPendingTransactions") {
      val pending = BankSmsStore.getPending(context)
      BankSmsLogger.d("getPendingTransactions: returning ${pending.size} pending txn(s)")
      pending.map { it.toMap() }
    }

    AsyncFunction("acknowledgeTransactions") { refs: List<String> ->
      BankSmsLogger.d("acknowledgeTransactions: acking ${refs.size} ref(s) -> $refs")
      BankSmsStore.acknowledge(context, refs)
    }

    AsyncFunction("setEnabled") { enabled: Boolean ->
      BankSmsLogger.d("setEnabled: $enabled")
      BankSmsStore.setEnabled(context, enabled)
    }

    AsyncFunction("isEnabled") {
      BankSmsStore.isEnabled(context)
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      val manager = appContext.permissions ?: return@AsyncFunction promise.reject(NO_PERMISSIONS_CODE, NO_PERMISSIONS_MESSAGE, null)
      manager.askForPermissions(
        PermissionsResponseListener {
          val result = toPermissionResult(it)
          BankSmsLogger.d("requestPermissionsAsync -> granted=${result["granted"]}")
          promise.resolve(result)
        },
        *permissions
      )
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      val manager = appContext.permissions ?: return@AsyncFunction promise.reject(NO_PERMISSIONS_CODE, NO_PERMISSIONS_MESSAGE, null)
      manager.getPermissions(
        PermissionsResponseListener { promise.resolve(toPermissionResult(it)) },
        *permissions
      )
    }

    // Debug helper: parse an arbitrary SMS body without queueing it
    Function("parseSms") { body: String ->
      BankSmsLogger.d("parseSms (manual): body=\"${body.take(120)}\"")
      val result = BankSmsParser.parse(body, System.currentTimeMillis())
      if (result == null) {
        BankSmsLogger.d("parseSms (manual): none of the patterns matched")
      } else {
        BankSmsLogger.d(
          "parseSms (manual): matched type=${result.type} amount=${result.amount} " +
            "party=\"${result.party}\" ref=${result.ref} date=${result.date}"
        )
      }
      result?.toMap()
    }
  }

  /**
   * The top-level status/granted reflect RECEIVE_SMS only, since capture works without notifications.
   * Notification permission is reported separately.
   */
  private fun toPermissionResult(result: Map<String, PermissionsResponse>): Map<String, Any?> {
    val sms = result[Manifest.permission.RECEIVE_SMS]
    val notificationsGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      result[Manifest.permission.POST_NOTIFICATIONS]?.status == PermissionsStatus.GRANTED
    } else {
      true
    }
    return mapOf(
      "status" to (sms?.status ?: PermissionsStatus.UNDETERMINED).status,
      "granted" to (sms?.status == PermissionsStatus.GRANTED),
      "canAskAgain" to (sms?.canAskAgain ?: true),
      "expires" to PermissionsResponse.PERMISSION_EXPIRES_NEVER,
      "notificationsGranted" to notificationsGranted
    )
  }
}
