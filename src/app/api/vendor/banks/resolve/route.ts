import { NextRequest, NextResponse } from "next/server";
import { resolveAccountNumber } from "@/lib/paystack/subaccount";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const accountNumber = url.searchParams.get("account_number") ?? "";
  const bankCode = url.searchParams.get("bank_code") ?? "";

  if (!accountNumber || !bankCode) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const result = await resolveAccountNumber(accountNumber, bankCode);
  if (!result) {
    return NextResponse.json({ error: "Could not resolve account" }, { status: 422 });
  }

  return NextResponse.json(result);
}
