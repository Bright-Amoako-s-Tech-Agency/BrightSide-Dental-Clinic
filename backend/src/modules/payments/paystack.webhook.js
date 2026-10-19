/**
 * paystack.webhook.js
 *
 * Normalises an incoming Paystack webhook payload into the
 * canonical shape expected by payment.service.handlePaymentWebhook().
 *
 * Paystack sends a POST with a JSON body like:
 * {
 *   "event": "charge.success",
 *   "data": {
 *     "reference": "<our payment UUID>",
 *     "amount": 50000,          // in pesewas (GHS kobo)
 *     "status": "success",
 *     "gateway_response": "Successful",
 *     ...
 *   }
 * }
 *
 * Events we handle:
 *   charge.success  → successful
 *   charge.dispute.* → ignored (we just return null)
 *
 * Docs: https://paystack.com/docs/payments/webhooks/
 */

import { createHmac } from "node:crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify that a webhook request genuinely came from Paystack.
 * Paystack signs every webhook with HMAC-SHA512 of the raw body,
 * using your secret key, and puts the hex digest in the
 * `x-paystack-signature` header.
 *
 * Call this BEFORE parsing the body as JSON.
 *
 * @param {string} rawBody   – the raw request body string
 * @param {string} signature – value of `x-paystack-signature` header
 * @returns {boolean}
 */
export function verifyPaystackSignature(rawBody, signature) {
  if (!PAYSTACK_SECRET_KEY || !signature) return false;

  const expected = createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return expected === signature;
}

/**
 * Map Paystack event/status to our internal payment status.
 *
 * @param {object} body – parsed webhook JSON
 * @returns {{ referenceId, status, amount, transactionId } | null}
 *          Returns null for events we intentionally ignore.
 */
export function normalizePaystackCallback(body) {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid Paystack webhook payload");
  }

  const event = String(body.event || "");
  const data = body.data || {};

  // Only handle charge events
  if (!event.startsWith("charge.")) {
    // Silently ignore non-charge events (e.g. transfer, refund, subscription)
    return null;
  }

  // Map Paystack status/event to our internal status
  const paystackStatus = String(data.status || "").toLowerCase();

  const statusMap = {
    success: "successful",
    failed: "failed",
    abandoned: "cancelled",
    reversed: "failed",
    ongoing: "pending",
    pending: "pending",
    processing: "pending",
  };

  let normalizedStatus = statusMap[paystackStatus];

  // Also allow event-level override for unambiguous events
  if (event === "charge.success") normalizedStatus = "successful";
  if (event === "charge.failed") normalizedStatus = "failed";

  if (!normalizedStatus) {
    throw new Error(
      `Unsupported Paystack status: "${paystackStatus}" (event: "${event}")`,
    );
  }

  if (!data.reference) {
    throw new Error("Paystack webhook is missing data.reference");
  }

  return {
    referenceId: data.reference,              // our payment UUID
    status: normalizedStatus,
    amount: data.amount ? data.amount / 100 : undefined, // pesewas → GHS
    transactionId: data.reference,            // Paystack reference = our payment id
  };
}
