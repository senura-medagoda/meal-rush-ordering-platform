export function formatPrice(value: number | string): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return `Rs. ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}