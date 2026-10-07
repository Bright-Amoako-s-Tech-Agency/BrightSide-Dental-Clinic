export function normalizeMtnCallback(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid MTN callback payload");
  }

  const status = String(data.status || "").toLowerCase();

  let normalizedStatus;

  switch (status) {
    case "successful":
      normalizedStatus = "successful";
      break;

    case "failed":
      normalizedStatus = "failed";
      break;

    case "cancelled":
    case "canceled":
      normalizedStatus = "cancelled";
      break;

    case "pending":
      normalizedStatus = "pending";
      break;

    default:
      throw new Error(`Unsupported MTN payment status: ${data.status}`);
  }

  if (!data.externalId) {
    throw new Error("MTN callback is missing externalId");
  }

  return {
    referenceId: data.externalId,
    status: normalizedStatus,
    amount: data.amount,
    transactionId: data.financialTransactionId || null,
  };
}
