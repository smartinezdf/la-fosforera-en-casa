export function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function bs(value: number) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(value);
}

export function whatsappHref(phone: string, message: string) {
  const clean = phone.replace(/[^\d+]/g, "");
  const normalized = clean.startsWith("+") ? clean.replace("+", "") : clean;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
