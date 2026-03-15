const PAYSTACK_BASE = "https://api.paystack.co";

async function paystackRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message ?? "Paystack API error");
  }
  return json.data as T;
}

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackInitParams {
  email: string;
  amount: number; // kobo
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  subaccount?: string;
  bearer?: "account" | "subaccount";
  transaction_charge?: number; // platform fee in kobo
}

export async function initializeTransaction(
  params: PaystackInitParams
): Promise<PaystackInitData> {
  return paystackRequest<PaystackInitData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export interface PaystackVerifyData {
  reference: string;
  status: "success" | "failed" | "abandoned";
  amount: number; // kobo
  metadata: Record<string, unknown>;
}

export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyData> {
  return paystackRequest<PaystackVerifyData>(
    `/transaction/verify/${reference}`
  );
}
