package expo.modules.banksms

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Native queue of parsed transactions waiting to be synced to Supabase.
 *
 * - `enabled`: whether capture is on (off by default).
 * - `pending`: JSON object keyed by ref, drained by JS and removed via [acknowledge].
 * - `seenRefs`: ordered list of refs already queued (capped), so a re-delivered SMS is not queued twice
 *   even after it has been acknowledged.
 */
object BankSmsStore {
  private const val PREFS = "expo.modules.banksms"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_PENDING = "pending"
  private const val KEY_SEEN = "seenRefs"
  private const val MAX_SEEN = 500

  private val lock = Any()

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

  fun setEnabled(context: Context, enabled: Boolean) {
    prefs(context).edit().putBoolean(KEY_ENABLED, enabled).commit()
  }

  /** Returns false if the ref was already seen. Uses commit() so data is on disk before we notify. */
  fun enqueue(context: Context, txn: ParsedBankTransaction): Boolean = synchronized(lock) {
    val p = prefs(context)
    val seen = readSeen(p)
    if (seen.contains(txn.ref)) return false

    seen.add(txn.ref)
    while (seen.size > MAX_SEEN) seen.removeAt(0)

    val pending = readPending(p)
    pending.put(txn.ref, toJson(txn))

    p.edit()
      .putString(KEY_PENDING, pending.toString())
      .putString(KEY_SEEN, JSONArray(seen).toString())
      .commit()
  }

  fun getPending(context: Context): List<ParsedBankTransaction> = synchronized(lock) {
    val pending = readPending(prefs(context))
    pending.keys().asSequence().mapNotNull { key -> fromJson(pending.optJSONObject(key)) }.toList()
  }

  /** Removes refs from pending but keeps them in seenRefs. */
  fun acknowledge(context: Context, refs: List<String>): Unit = synchronized(lock) {
    val p = prefs(context)
    val pending = readPending(p)
    refs.forEach { pending.remove(it) }
    p.edit().putString(KEY_PENDING, pending.toString()).commit()
    Unit
  }

  private fun readPending(p: SharedPreferences): JSONObject =
    runCatching { JSONObject(p.getString(KEY_PENDING, null) ?: "{}") }.getOrDefault(JSONObject())

  private fun readSeen(p: SharedPreferences): MutableList<String> {
    val arr = runCatching { JSONArray(p.getString(KEY_SEEN, null) ?: "[]") }.getOrDefault(JSONArray())
    return MutableList(arr.length()) { arr.getString(it) }
  }

  private fun toJson(txn: ParsedBankTransaction) = JSONObject()
    .put("ref", txn.ref)
    .put("amount", txn.amount)
    .put("type", txn.type)
    .put("date", txn.date)
    .put("party", txn.party)
    .put("accountLast4", txn.accountLast4)
    .put("receivedAt", txn.receivedAt)

  private fun fromJson(json: JSONObject?): ParsedBankTransaction? {
    if (json == null) return null
    return runCatching {
      ParsedBankTransaction(
        ref = json.getString("ref"),
        amount = json.getDouble("amount"),
        type = json.getString("type"),
        date = json.getString("date"),
        party = json.getString("party"),
        accountLast4 = json.getString("accountLast4"),
        receivedAt = json.getLong("receivedAt")
      )
    }.getOrNull()
  }
}
