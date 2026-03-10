"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

function SuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      router.replace(`/orders/${orderId}`);
    } else {
      router.replace("/");
    }
  }, [orderId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto h-10 w-10" />
        <p className="mt-4 text-gray-600">Processing your payment...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner className="h-10 w-10" /></div>}>
      <SuccessRedirect />
    </Suspense>
  );
}
