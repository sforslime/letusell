import { NextResponse } from "next/server";
import { getBankList } from "@/lib/paystack/subaccount";

export async function GET() {
  const banks = await getBankList();
  return NextResponse.json({ banks });
}
