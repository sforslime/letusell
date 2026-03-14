import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFoundPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-6xl font-extrabold text-gray-200">404</h1>
        <h2 className="mt-3 text-xl font-bold text-gray-900">Page not found</h2>
        <p className="mt-2 text-sm text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="mt-6">
          <Button>Go home</Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
