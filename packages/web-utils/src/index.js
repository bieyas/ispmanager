export const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  const amount = typeof value === "object" && value !== null && "toString" in value ? Number(value.toString()) : Number(value || 0);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return String(value).slice(0, 10);
}

export function getDefaultApiBaseUrl() {
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

export function createScopedStorageKeys(scope) {
  return {
    token: `ispmanager.${scope}.token`,
    apiBaseUrl: `ispmanager.${scope}.apiBaseUrl`,
    user: `ispmanager.${scope}.user`,
    session: `ispmanager.${scope}.session`,
  };
}
