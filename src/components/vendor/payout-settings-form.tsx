"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VendorPayoutInfo } from "@/types/database.types";

interface Bank {
  name: string;
  code: string;
}

interface PayoutSettingsFormProps {
  vendorId: string;
}

export function PayoutSettingsForm({ vendorId }: PayoutSettingsFormProps) {
  const supabase = getSupabaseBrowserClient();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [payout, setPayout] = useState<VendorPayoutInfo | null>(null);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [settlementBank, setSettlementBank] = useState("");
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/vendor/banks").then((r) => r.json()).then((d) => setBanks(d.banks ?? []));
    fetchPayout();
  }, []);

  async function fetchPayout() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/vendor/payout", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (data.payout) {
      setPayout(data.payout as VendorPayoutInfo);
      setBankCode(data.payout.bank_code ?? "");
      setAccountNumber(data.payout.account_number ?? "");
      setAccountName(data.payout.account_name ?? "");
      setSettlementBank(data.payout.settlement_bank ?? "");
    }
  }

  async function resolveAccount() {
    if (!bankCode || accountNumber.length < 10) return;
    setResolving(true);
    setError(null);
    const res = await fetch(`/api/vendor/banks/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
    const data = await res.json();
    if (data.account_name) {
      setAccountName(data.account_name);
    } else {
      setError("Could not resolve account. Check account number and bank.");
    }
    setResolving(false);
  }

  async function handleSave() {
    if (!bankCode || !accountNumber || !accountName) {
      setError("Please fill in all fields and resolve account name.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const selectedBank = banks.find((b) => b.code === bankCode);
    const res = await fetch("/api/vendor/payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        settlement_bank: selectedBank?.name ?? "",
        percentage_charge: 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save payout info");
    } else {
      setPayout(data.payout as VendorPayoutInfo);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {payout?.paystack_subaccount_code && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-xs font-medium text-green-700">Subaccount active</p>
          <p className="text-xs text-green-600 font-mono">{payout.paystack_subaccount_code}</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Bank</label>
        <select
          value={bankCode}
          onChange={(e) => { setBankCode(e.target.value); setAccountName(""); }}
          className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Select bank…</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            label="Account number"
            value={accountNumber}
            onChange={(e) => { setAccountNumber(e.target.value); setAccountName(""); }}
            maxLength={10}
            placeholder="0123456789"
          />
        </div>
        <div className="mt-6">
          <Button
            size="sm"
            loading={resolving}
            onClick={resolveAccount}
            disabled={!bankCode || accountNumber.length < 10}
            className="border border-gray-200 bg-gray-50 text-gray-700 shadow-none hover:bg-gray-100"
          >
            Verify
          </Button>
        </div>
      </div>

      {accountName && (
        <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3">
          <p className="text-xs text-brand-600 font-medium">Account name</p>
          <p className="text-sm font-semibold text-brand-800">{accountName}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button loading={saving} onClick={handleSave} disabled={!accountName} className="w-fit">
        {success ? "Saved!" : "Save payout info"}
      </Button>
    </div>
  );
}
