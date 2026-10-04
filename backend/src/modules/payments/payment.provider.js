export function getPaymentProvider(provider) {
  switch (provider) {
    case "momo":
      return {
        name: "momo",

        async initializePayment({ paymentId, amount, currency, phone }) {
          /*
           * MoMo integration will be connected here.
           *
           * For now, this is intentionally not pretending
           * to communicate with a real payment provider.
           */
          return {
            providerReference: paymentId,
            status: "pending",
            message: "MoMo payment provider not yet configured",
          };
        },
      };

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
