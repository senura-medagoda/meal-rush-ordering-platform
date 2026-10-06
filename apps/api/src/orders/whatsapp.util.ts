import type { OrderWithItems } from './orders.types';

const money = (value: unknown) => `Rs. ${Number(value).toLocaleString('en-US')}`;

export function buildWhatsAppMessage(order: OrderWithItems): string {
  const lines: string[] = [
    '🍽️ *New Order – MealRush*',
    `Order No: *${order.orderNumber}*`,
    '',
    `*Customer:* ${order.customerName}`,
    `*Phone:* ${order.customerPhone}`,
    `*Address:* ${order.deliveryAddress}, ${order.deliveryCity}`,
    '',
    '*Items:*',
    ...order.items.map(
      (item, index) =>
        `${index + 1}. ${item.productName} × ${item.quantity} — ${money(item.unitPrice.mul(item.quantity))}`,
    ),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `Delivery: ${order.deliveryFee.isZero() ? 'Free' : money(order.deliveryFee)}`,
    `*Total: ${money(order.total)}*`,
    '',
    'Payment: Pay on delivery (WhatsApp order)',
  ];

  if (order.notes) lines.push(`Notes: ${order.notes}`);

  return lines.join('\n');
}