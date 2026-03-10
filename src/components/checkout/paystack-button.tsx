"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils/currency";
import { koboToNaira } from "@/lib/utils/currency";

interface PaystackButtonProps {
  accessCode: string;
  amount: number; // kobo
  onSuccess: () => void;
  onClose: () => void;
  disabled?: boolean;
  loading?: boolean;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: object) => { openIframe: () => void };
    };
  }
}

export function PaystackButton({
  accessCode,
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
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    document.head.appendChild(script);
    scriptLoaded.current = true;
  }, []);

  function handlePay() {
    if (!window.PaystackPop) {
      alert("Paystack failed to load. Please refresh and try again.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      access_code: accessCode,
      onSuccess,
      onClose,
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
