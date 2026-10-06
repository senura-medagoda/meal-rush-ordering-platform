import 'dotenv/config';
import { createHash } from 'crypto';

const [orderNumber, amount, statusCode = '2'] = process.argv.slice(2);

if (!orderNumber || !amount) {
  console.error('Usage: npx tsx scripts/simulate-payhere.ts <orderNumber> <amount e.g. 2500.00> [statusCode]');
  process.exit(1);
}

const md5 = (value: string) => createHash('md5').update(value).digest('hex').toUpperCase();

const merchantId = process.env.PAYHERE_MERCHANT_ID ?? '';
const secret = process.env.PAYHERE_MERCHANT_SECRET ?? '';
const currency = 'LKR';

const md5sig = md5(merchantId + orderNumber + amount + currency + statusCode + md5(secret));

const body = new URLSearchParams({
  merchant_id: merchantId,
  order_id: orderNumber,
  payment_id: `SIM${Date.now()}`,
  payhere_amount: amount,
  payhere_currency: currency,
  status_code: statusCode,
  md5sig,
  status_message: 'Simulated',
  method: 'VISA',
});

const base = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';

fetch(`${base}/api/v1/payments/payhere/notify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
}).then(async (res) => {
  console.log(res.status, await res.text());
});