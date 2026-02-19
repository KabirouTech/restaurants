export const CURRENCIES = [
    { code: "XOF", label: "Franc CFA (XOF)", locale: "fr-XOF" },
    { code: "EUR", label: "Euro (€)", locale: "fr-FR" },
    { code: "USD", label: "Dollar ($)", locale: "en-US" },
    { code: "GHS", label: "Cedi (GHS)", locale: "en-GH" }, // Ghana
    { code: "NGN", label: "Naira (NGN)", locale: "en-NG" }, // Nigeria
    { code: "CAD", label: "Dollar Canadien (CAD)", locale: "fr-CA" },
    { code: "GBP", label: "Livre Sterling (£)", locale: "en-GB" },
] as const;

export const DEFAULT_CURRENCY = "XOF";

export function formatPrice(cents: number, currencyCode: string = DEFAULT_CURRENCY) {
    const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES.find(c => c.code === "EUR")!;

    // Fallback for currencies not fully supported by all browsers or specific locale needs
    // XOF is often better formatted with fr-FR but with XOF currency
    let locale = currency.locale;
    if (currencyCode === "XOF") locale = "fr-FR";

    return (cents / 100).toLocaleString(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: currencyCode === "XOF" || currencyCode === "NGN" ? 0 : 2,
        maximumFractionDigits: currencyCode === "XOF" || currencyCode === "NGN" ? 0 : 2,
    });
}
