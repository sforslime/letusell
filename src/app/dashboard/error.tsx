"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard error</h1>
      <p className="mt-2 text-sm text-gray-500">
        Something went wrong loading this page.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
