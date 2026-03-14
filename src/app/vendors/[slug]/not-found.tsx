import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = { title: "Vendor not found" };

export default function VendorNotFoundPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Vendor not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          This vendor doesn't exist or may have been removed.
        </p>
        <Link href="/vendors" className="mt-6">
          <Button>Browse vendors</Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
