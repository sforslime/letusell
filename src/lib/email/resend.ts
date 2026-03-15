import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "orders@letusell.ng";

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export interface OrderEmailData {
  to: string;
  customerName: string;
  orderId: string;
  vendorName: string;
  items: Array<{ item_name: string; item_price: number; quantity: number }>;
  totalKobo: number;
  pickupTime: string | null;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { to, customerName, orderId, vendorName, items, totalKobo, pickupTime } = data;
  const totalNaira = (totalKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 });
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/orders/${orderId}`;

  const itemRows = items
    .map(
      (i) =>
        `<tr><td>${i.quantity}x ${i.item_name}</td><td style="text-align:right">₦${(i.item_price * i.quantity).toLocaleString()}</td></tr>`
    )
    .join("");

  const pickupLine = pickupTime
    ? `<p><strong>Pickup time:</strong> ${new Date(pickupTime).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>`
    : "";

  await client.emails.send({
    from,
    to,
    subject: `Order received — ${vendorName}`,
    html: `
      <p>Hi ${customerName},</p>
      <p>Your order from <strong>${vendorName}</strong> has been received and is awaiting confirmation.</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">${itemRows}</table>
      <p><strong>Total: ₦${totalNaira}</strong></p>
      ${pickupLine}
      <p><a href="${orderUrl}">Track your order</a></p>
      <p style="color:#888;font-size:12px">LetuSell — campus marketplace</p>
    `,
  });
}
