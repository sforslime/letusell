import { formatNGN, koboToNaira } from "@/lib/utils/currency";
import { formatPickupTime } from "@/lib/utils/date";

interface OrderItem {
  item_name: string;
  item_price: number;
  quantity: number;
}

interface NotificationParams {
  vendorPhone: string;
  orderId: string;
  customerName: string;
  items: OrderItem[];
  totalKobo: number;
  pickupTime: string | null;
}

function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return "234" + digits.slice(1);
  }
  if (digits.length === 13 && digits.startsWith("234")) {
    return digits;
  }
  return null;
}

export async function sendWhatsAppOrderNotification(
  params: NotificationParams
): Promise<void> {
  try {
    if (!process.env.TERMII_API_KEY) {
      console.warn("WhatsApp: TERMII_API_KEY not set, skipping notification");
      return;
    }

    const phone = normalisePhone(params.vendorPhone);
    if (!phone) {
      console.warn(
        `WhatsApp: Could not normalise phone number "${params.vendorPhone}", skipping`
      );
      return;
    }

    const shortId = params.orderId.slice(-8).toUpperCase();
    const itemLines = params.items
      .map(
        (item) =>
          `- ${item.quantity}x ${item.item_name} - ${formatNGN(koboToNaira(item.item_price))}`
      )
      .join("\n");
    const pickup = params.pickupTime
      ? formatPickupTime(params.pickupTime)
      : "ASAP";

    const message = [
      "New order on LetuSell!",
      "",
      `Order: #${shortId}`,
      `Customer: ${params.customerName}`,
      "",
      "Items:",
      itemLines,
      "",
      `Total: ${formatNGN(koboToNaira(params.totalKobo))}`,
      `Pickup: ${pickup}`,
      "",
      "Check your dashboard to confirm.",
    ].join("\n");

    const res = await fetch("https://api.ng.termii.com/api/send/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: process.env.TERMII_SENDER_ID ?? "LetuSell",
        sms: message,
        type: "plain",
        channel: "whatsapp",
        api_key: process.env.TERMII_API_KEY,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`WhatsApp: Termii responded ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error("WhatsApp: notification failed", err);
  }
}
