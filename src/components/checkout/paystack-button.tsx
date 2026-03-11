"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";

interface PaystackButtonProps {
  accessCode: string;
  email: string;
  amount: number; // kobo
  onSuccess: () => void;
  onClose: () => void;
  disabled?: boolean;
  loading?: boolean;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email?: string;
        amount?: number;
        access_code?: string;
        onSuccess?: () => void;
        onClose?: () => void;
        [key: string]: unknown;
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
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.head.appendChild(script);
    scriptLoaded.current = true;
  }, []);

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

    try {
      const handler = window.PaystackPop.setup({
        key,
        email,
        amount,
        access_code: accessCode,
        onSuccess,
        onClose,
      });
      handler.openIframe();
    } catch (err) {
      console.error("Paystack setup error:", err);
      alert("Could not open payment. Please try again.");
    }
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
