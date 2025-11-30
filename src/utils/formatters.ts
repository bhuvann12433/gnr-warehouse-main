export const formatCurrencyINR = (value: any) => {
  const num = Number(String(value).replace(/[^\d.-]/g, "")) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (value: number | undefined | null) => {
  return new Intl.NumberFormat("en-IN").format(value || 0);
};
