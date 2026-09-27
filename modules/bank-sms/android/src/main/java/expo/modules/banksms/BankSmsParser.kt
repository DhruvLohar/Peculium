package expo.modules.banksms

/**
 * A bank transaction extracted from an SMS body.
 *
 * @property type "EXPENSE" for debits, "INCOME" for credits (matches the Supabase transaction_type enum).
 * @property date Calendar date from the SMS in "yyyy-MM-dd".
 * @property receivedAt Epoch millis the SMS was received, used for the time-of-day.
 */
data class ParsedBankTransaction(
  val ref: String,
  val amount: Double,
  val type: String,
  val date: String,
  val party: String,
  val accountLast4: String,
  val receivedAt: Long
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "ref" to ref,
    "amount" to amount,
    "type" to type,
    "date" to date,
    "party" to party,
    "accountLast4" to accountLast4,
    "receivedAt" to receivedAt.toDouble()
  )
}

/**
 * Pure parser for HDFC Bank UPI debit/credit SMS. No Android dependencies, so it is unit-testable on the JVM.
 */
object BankSmsParser {
  private val OPTIONS = setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)

  // Sent Rs.60.00 / From HDFC Bank A/C *6071 / To Vendiman Pvt Ltd / On 27/09/26 / Ref 526954910123
  private val DEBIT = Regex(
    """Sent\s+Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s*From\s+HDFC\s+Bank\s+A/C\s+[*X]*(\d+)\s*To\s+(.+?)\s+On\s+(\d{2}/\d{2}/\d{2})\s*Ref\s*:?\s*(\d+)""",
    OPTIONS
  )

  // Rs.150.00 credited to HDFC Bank A/c XX6071 on 27-09-26 from VPA 8navdeep-3@okaxis (UPI 526912345678)
  private val CREDIT = Regex(
    """Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+credited\s+to\s+HDFC\s+Bank\s+A/c\s+[*X]*(\d+)\s+on\s+(\d{2}-\d{2}-\d{2})\s+from\s+(?:VPA\s+)?(.+?)\s*\(\s*UPI\s*(?:Ref\s*(?:No\.?)?\s*)?:?\s*(\d+)\s*\)""",
    OPTIONS
  )

  fun parse(body: String, receivedAt: Long): ParsedBankTransaction? {
    if (!body.contains("HDFC", ignoreCase = true) || !body.contains("Bank", ignoreCase = true)) return null

    DEBIT.find(body)?.let { m ->
      val (amount, account, party, date, ref) = m.destructured
      return build(ref, amount, "EXPENSE", date, party, account, receivedAt)
    }
    CREDIT.find(body)?.let { m ->
      val (amount, account, date, party, ref) = m.destructured
      return build(ref, amount, "INCOME", date, party, account, receivedAt)
    }
    return null
  }

  private fun build(
    ref: String,
    rawAmount: String,
    type: String,
    rawDate: String,
    rawParty: String,
    account: String,
    receivedAt: Long
  ): ParsedBankTransaction? {
    val amount = rawAmount.replace(",", "").toDoubleOrNull() ?: return null
    if (amount <= 0.0) return null
    val date = normalizeDate(rawDate) ?: return null
    val party = rawParty.replace(Regex("""\s+"""), " ").trim()
    return ParsedBankTransaction(
      ref = ref,
      amount = amount,
      type = type,
      date = date,
      party = party,
      accountLast4 = account.takeLast(4),
      receivedAt = receivedAt
    )
  }

  /** dd/MM/yy or dd-MM-yy → yyyy-MM-dd, reading the year as 20yy. */
  private fun normalizeDate(raw: String): String? {
    val parts = raw.split('/', '-')
    if (parts.size != 3) return null
    val (dd, mm, yy) = parts
    val day = dd.toIntOrNull() ?: return null
    val month = mm.toIntOrNull() ?: return null
    if (day !in 1..31 || month !in 1..12) return null
    return "20$yy-$mm-$dd"
  }
}
