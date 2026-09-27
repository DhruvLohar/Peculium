package expo.modules.banksms

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class BankSmsParserTest {
  private val now = 1_790_000_000_000L

  @Test
  fun parsesUpiDebit() {
    val sms = "Sent Rs.60.00\nFrom HDFC Bank A/C *6071\nTo Vendiman Pvt Ltd\nOn 27/09/26\nRef 526954910123\n" +
      "Not You?\nCall 18002586161/SMS BLOCK UPI to 7308080808"
    val txn = BankSmsParser.parse(sms, now)
    assertNotNull(txn)
    txn!!
    assertEquals("526954910123", txn.ref)
    assertEquals(60.0, txn.amount, 0.0001)
    assertEquals("EXPENSE", txn.type)
    assertEquals("2026-09-27", txn.date)
    assertEquals("Vendiman Pvt Ltd", txn.party)
    assertEquals("6071", txn.accountLast4)
    assertEquals(now, txn.receivedAt)
  }

  @Test
  fun parsesDebitWithThousandsSeparatorAndMultilineParty() {
    val sms = "Sent Rs.1,250.50\nFrom HDFC Bank A/C *6071\nTo SWIGGY\nLIMITED\nOn 05/09/26\nRef 525812345678\n" +
      "Not You?\nCall 18002586161/SMS BLOCK UPI to 7308080808"
    val txn = BankSmsParser.parse(sms, now)!!
    assertEquals(1250.50, txn.amount, 0.0001)
    assertEquals("SWIGGY LIMITED", txn.party)
    assertEquals("2026-09-05", txn.date)
    assertEquals("525812345678", txn.ref)
  }

  @Test
  fun parsesUpiCredit() {
    val sms = "Credit Alert!\nRs.150.00 credited to HDFC Bank A/c XX6071 on 27-09-26 from VPA 8navdeep-3@okaxis " +
      "(UPI 526998765432)"
    val txn = BankSmsParser.parse(sms, now)!!
    assertEquals("526998765432", txn.ref)
    assertEquals(150.0, txn.amount, 0.0001)
    assertEquals("INCOME", txn.type)
    assertEquals("2026-09-27", txn.date)
    assertEquals("8navdeep-3@okaxis", txn.party)
    assertEquals("6071", txn.accountLast4)
  }

  @Test
  fun parsesCreditWithoutAlertPrefix() {
    val sms = "Rs. 12,000 credited to HDFC Bank A/c XX6071 on 01-10-26 from VPA employer.payroll@hdfcbank " +
      "(UPI 527400001111)"
    val txn = BankSmsParser.parse(sms, now)!!
    assertEquals(12000.0, txn.amount, 0.0001)
    assertEquals("2026-10-01", txn.date)
    assertEquals("employer.payroll@hdfcbank", txn.party)
  }

  @Test
  fun rejectsOtp() {
    val sms = "123456 is the OTP for txn of INR 500.00 at AMAZON on HDFC Bank card ending 6071. " +
      "Valid till 10:15. Do not share OTP for security reasons"
    assertNull(BankSmsParser.parse(sms, now))
  }

  @Test
  fun rejectsPromo() {
    val sms = "Get instant Personal Loan up to Rs.40,00,000 from HDFC Bank! Apply now: hdfcbk.io/abc T&C"
    assertNull(BankSmsParser.parse(sms, now))
  }

  @Test
  fun rejectsNonHdfc() {
    val sms = "Sent Rs.60.00\nFrom ICICI Bank A/C *1234\nTo Someone\nOn 27/09/26\nRef 526954910123"
    assertNull(BankSmsParser.parse(sms, now))
  }
}
