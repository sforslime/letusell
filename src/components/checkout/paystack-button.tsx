"use client";

import { Button } from "@/components/ui/button";
import { formatNGN, koboToNaira } from "@/lib/utils/currency";

interface PaystackButtonProps {
  accessCode: string;
  email: string;
  amount: number; // kobo
  onSuccess: (reference: string) => void;
  onClose: () => void;
  disabled?: boolean;
  loading?: boolean;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        access_code: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export function PaystackButton({
  accessCode,
  email,
  amount,
  onSuccess,
  onClose,
  disabled,
  loading,
}: PaystackButtonProps) {
  function handlePay() {
    if (!window.PaystackPop) {
      alert("Paystack failed to load. Please refresh and try again.");
      return;
    }

    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!key) {
      alert("Paystack public key is not configured. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your .env.local file.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key,
      email,
      amount,
      access_code: accessCode,
      callback(response) {
        onSuccess(response.reference);
      },
      onClose() {
        onClose();
      },
    });
    handler.openIframe();
  }

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={handlePay}
      disabled={disabled}
      loading={loading}
    >
      Pay {formatNGN(koboToNaira(amount))} with Paystack
    </Button>
  );
}
