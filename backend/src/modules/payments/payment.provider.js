/**
 * payment.provider.js
 *
 * Paystack Ghana Mobile Money provider.
 *
 * Supported networks (all major Ghana operators):
 *   mtn  – MTN Mobile Money
 *   vod  – Telecel (formerly Vodafone)
 *   atl  – AirtelTigo
 *
 * Flow:
 *   1. POST /charge  → sends a USSD/OTP prompt to the customer's phone
 *   2. GET  /charge/:reference → poll for status (or wait for webhook)
 *
 * Docs: https://paystack.com/docs/payments/payment-channels/#mobile-money
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// ---------------------------------------------------------------------------
// Ghana phone-number → Paystack provider code mapping
// ---------------------------------------------------------------------------
//
// Prefixes sourced from the NCA (National Communications Authority – Ghana)
// and Paystack's own Ghana MoMo guide.
//
// MTN GH:        024, 054, 055, 059, 025, 053, 026, 056
// Telecel GH:    020, 050
// AirtelTigo GH: 027, 057, 026 (shared), 056 (shared), 023, 028
//
// We make a best-effort detection. If a prefix is ambiguous or unknown we
// fall back to "mtn" (most common) and let Paystack reject if wrong.
// ---------------------------------------------------------------------------

const PREFIX_MAP = {
  // MTN Mobile Money
  "024": "mtn",
  "054": "mtn",
  "055": "mtn",
  "059": "mtn",
  "025": "mtn",
  "053": "mtn",

  // Telecel (Vodafone)
  "020": "vod",
  "050": "vod",

  // AirtelTigo
  "027": "atl",
  "057": "atl",
  "023": "atl",
  "028": "atl",

  // Shared / historically reassigned – best-effort
  "026": "mtn",
  "056": "mtn",
};

/**
 * Normalise a Ghana phone number to local 10-digit format (0XXXXXXXXX).
 * Also strips any country code prefix (+233 / 00233 / 233).
 */
function normalizeGhanaPhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");

  // Strip international prefix
  if (digits.startsWith("00233")) digits = "0" + digits.slice(5);
  else if (digits.startsWith("233")) digits = "0" + digits.slice(3);

  // Ensure it starts with 0
  if (!digits.startsWith("0") && digits.length === 9) {
    digits = "0" + digits;
  }

  if (digits.length !== 10) {
    throw new Error(`Cannot normalise phone number: "${raw}"`);
  }

  return digits;
}

/**
 * Detect Paystack provider code from a Ghana phone number.
 */
function detectProvider(phone) {
  const local = normalizeGhanaPhone(phone);
  const prefix = local.slice(0, 3);
  return PREFIX_MAP[prefix] ?? "mtn";
}

// ---------------------------------------------------------------------------
// Config guard
// ---------------------------------------------------------------------------

function requirePaystackConfig() {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error(
      "Missing required environment variable: PAYSTACK_SECRET_KEY",
    );
  }
}

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

async function paystackFetch(path, options = {}) {
  requirePaystackConfig();

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Paystack ${options.method || "GET"} ${path} failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return data;
}

// ---------------------------------------------------------------------------
// Charge (initialize mobile-money payment)
// ---------------------------------------------------------------------------

/**
 * @param {object} opts
 * @param {string} opts.paymentId   – our internal payment UUID (used as reference)
 * @param {number} opts.amount      – amount in GHS (NOT kobo; we convert here)
 * @param {string} opts.phone       – patient phone number
 * @param {string} opts.email       – patient email (required by Paystack; we
 *                                    fabricate one from the phone if absent)
 * @returns {{ providerReference, status, message }}
 */
async function initializePayment({ paymentId, amount, phone, email }) {
  const localPhone = normalizeGhanaPhone(phone);
  const provider = detectProvider(localPhone);

  // Paystack amounts are in the smallest currency unit (pesewas for GHS)
  const amountPesewas = Math.round(amount * 100);

  // Paystack requires an email address for every charge.
  // If the patient has no email we fabricate a stable placeholder.
  const safeEmail =
    email && email.includes("@")
      ? email
      : `${localPhone}@brightside.dental`;

  const body = {
    amount: amountPesewas,
    email: safeEmail,
    currency: "GHS",
    mobile_money: {
      phone: localPhone,
      provider,
    },
    // We use our payment UUID as the reference so we can look it up later
    reference: paymentId,
    metadata: {
      payment_id: paymentId,
      source: "brightside-dental",
    },
  };

  const data = await paystackFetch("/charge", {
    method: "POST",
    body: JSON.stringify(body),
  });

  /*
   * Paystack returns one of these statuses on a fresh charge:
   *   "send_otp"   – customer needs to enter OTP (Telecel)
   *   "pending"    – awaiting USSD approval (MTN / AirtelTigo)
   *   "pay_offline"– customer must dial a USSD string
   *   "success"    – already paid (rare on first call)
   *   "failed"     – immediate failure
   *
   * For our flow we treat everything that is not "failed" as "pending"
   * because the patient will approve on their phone.
   */
  const chargeStatus = String(data?.data?.status || "").toLowerCase();

  if (chargeStatus === "failed") {
    throw new Error(
      `Paystack charge rejected immediately: ${data?.data?.gateway_response || "unknown reason"}`,
    );
  }

  return {
    // For Paystack the reference IS the providerReference (our payment UUID)
    providerReference: paymentId,
    status: "pending",
    message:
      chargeStatus === "send_otp"
        ? "OTP sent to customer's phone"
        : "Mobile money prompt sent to customer's phone",
    chargeStatus,
    provider,
    localPhone,
  };
}

// ---------------------------------------------------------------------------
// Status check (poll)
// ---------------------------------------------------------------------------

/**
 * @param {string} providerReference – the Paystack transaction reference
 * @returns {object} Paystack transaction data
 */
async function getPaymentStatus(providerReference) {
  if (!providerReference) {
    throw new Error("Provider reference is required");
  }

  const data = await paystackFetch(
    `/transaction/verify/${encodeURIComponent(providerReference)}`,
  );

  /*
   * Normalise to the shape our service layer expects:
   *   { status, amount, financialTransactionId }
   *
   * Paystack statuses: "success" | "failed" | "abandoned" | "ongoing" | "pending"
   */
  const tx = data?.data || {};

  return {
    status: tx.status || "pending",
    amount: tx.amount ? tx.amount / 100 : undefined, // convert pesewas → GHS
    financialTransactionId: tx.reference || providerReference,
    raw: tx,
  };
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

export function getPaymentProvider(provider) {
  switch (provider) {
    case "paystack":
      return {
        name: "paystack",
        initializePayment,
        getPaymentStatus,
      };

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
