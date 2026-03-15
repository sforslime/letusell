const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";

interface CreateSubaccountParams {
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  percentageCharge: number;
}

interface PaystackSubaccountResponse {
  subaccount_code: string;
  id: number;
}

export async function createSubaccount(params: CreateSubaccountParams): Promise<PaystackSubaccountResponse> {
  const res = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.settlementBank,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message ?? "Failed to create Paystack subaccount");
  }

  return {
    subaccount_code: data.data.subaccount_code,
    id: data.data.id,
  };
}

export async function getBankList(): Promise<{ name: string; code: string }[]> {
  const res = await fetch("https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=100", {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    next: { revalidate: 3600 },
  });
  const data = await res.json();
  if (!res.ok || !data.status) return [];
  return (data.data as { name: string; code: string }[]);
}

export async function resolveAccountNumber(accountNumber: string, bankCode: string): Promise<{ account_name: string } | null> {
  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
  );
  const data = await res.json();
  if (!res.ok || !data.status) return null;
  return { account_name: data.data.account_name };
}
