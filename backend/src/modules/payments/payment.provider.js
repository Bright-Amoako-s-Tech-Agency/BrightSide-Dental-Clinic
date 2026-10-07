import { randomUUID } from "node:crypto";

const MTN_BASE_URL =
  process.env.MTN_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

const MTN_TARGET_ENVIRONMENT = process.env.MTN_TARGET_ENVIRONMENT || "sandbox";

const MTN_SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const MTN_API_USER = process.env.MTN_API_USER;
const MTN_API_KEY = process.env.MTN_API_KEY;
const MTN_CALLBACK_URL = process.env.MTN_CALLBACK_URL;

const MTN_CURRENCY =
  process.env.MTN_CURRENCY ||
  (MTN_TARGET_ENVIRONMENT === "sandbox" ? "EUR" : "GHS");

let accessToken = null;
let accessTokenExpiresAt = 0;

function requireMtnConfig() {
  const missing = [];

  if (!MTN_SUBSCRIPTION_KEY) missing.push("MTN_SUBSCRIPTION_KEY");
  if (!MTN_API_USER) missing.push("MTN_API_USER");
  if (!MTN_API_KEY) missing.push("MTN_API_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing MTN configuration: ${missing.join(", ")}`);
  }
}

function normalizeMsisdn(phone) {
  let value = String(phone || "").replace(/\D/g, "");

  if (value.startsWith("00")) {
    value = value.slice(2);
  }

  if (value.startsWith("0")) {
    value = `233${value.slice(1)}`;
  }

  return value;
}

async function getAccessToken() {
  requireMtnConfig();

  const now = Date.now();

  // Reuse the token while it is still valid.
  if (accessToken && now < accessTokenExpiresAt) {
    return accessToken;
  }

  const credentials = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString(
    "base64",
  );

  const response = await fetch(`${MTN_BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
      "X-Target-Environment": MTN_TARGET_ENVIRONMENT,
      "Content-Type": "application/x-www-form-urlencoded",
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
      `MTN access token request failed (${response.status}): ${JSON.stringify(
        data,
      )}`,
    );
  }

  if (!data.access_token) {
    throw new Error("MTN access token response did not contain access_token");
  }

  accessToken = data.access_token;

  const expiresIn = Number(data.expires_in || 3600);

  // Refresh slightly before actual expiry.
  accessTokenExpiresAt = Date.now() + Math.max(expiresIn - 60, 60) * 1000;

  return accessToken;
}

async function requestToPay({ paymentId, amount, currency, phone }) {
  const token = await getAccessToken();

  /*
   * MTN requires a fresh UUID v4 for every Request To Pay.
   *
   * This is the reference we will store in payments.provider_reference.
   */
  const providerReference = randomUUID();

  const msisdn = normalizeMsisdn(phone);

  if (!msisdn) {
    throw new Error("A valid phone number is required for MoMo payment");
  }

  const body = {
    amount: String(amount),
    currency: MTN_CURRENCY,
    externalId: paymentId,
    payer: {
      partyIdType: "MSISDN",
      partyId: msisdn,
    },
    payerMessage: "BrightSide appointment deposit",
    payeeNote: "BrightSide appointment deposit",
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
    "X-Target-Environment": MTN_TARGET_ENVIRONMENT,
    "X-Reference-Id": providerReference,
    "Content-Type": "application/json",
  };

  /*
   * MTN's callback URL is normally supplied as a header on
   * Request To Pay. Keep it here rather than putting it in
   * the JSON body.
   */
  if (MTN_CALLBACK_URL) {
    headers["X-Callback-Url"] = MTN_CALLBACK_URL;
  }

  const response = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await response.text();

  if (response.status !== 202) {
    let errorData;

    try {
      errorData = text ? JSON.parse(text) : {};
    } catch {
      errorData = { raw: text };
    }

    throw new Error(
      `MTN Request To Pay failed (${response.status}): ${JSON.stringify(
        errorData,
      )}`,
    );
  }

  return {
    providerReference,
    status: "pending",
    message: "MoMo payment request sent",
  };
}

async function getPaymentStatus(providerReference) {
  const token = await getAccessToken();

  if (!providerReference) {
    throw new Error("Provider reference is required");
  }

  const response = await fetch(
    `${MTN_BASE_URL}/collection/v1_0/requesttopay/${providerReference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
        "X-Target-Environment": MTN_TARGET_ENVIRONMENT,
      },
    },
  );

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `MTN payment status request failed (${response.status}): ${JSON.stringify(
        data,
      )}`,
    );
  }

  return data;
}

export function getPaymentProvider(provider) {
  switch (provider) {
    case "momo":
      return {
        name: "momo",

        initializePayment: requestToPay,
        getPaymentStatus,
      };

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
