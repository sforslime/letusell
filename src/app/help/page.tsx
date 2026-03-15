import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Store, Clock, CreditCard, Star, Mail, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Help & Contact",
  description: "Learn how LetuSell works and get in touch with us.",
};

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse vendors, add items to your cart, then go to checkout. Enter your contact details, pay securely via Paystack, and your vendor will prepare your order. You'll get a confirmation page with your pickup details.",
  },
  {
    q: "Do I need an account?",
    a: "No — you can order as a guest using just your name and email. Creating a free account lets you track order history and earn loyalty points.",
  },
  {
    q: "How do I pick up my order?",
    a: "After payment, your confirmation page shows the vendor's location and your estimated pickup time. Head there when it's ready — no delivery, campus pickup only.",
  },
  {
    q: "What payment methods are accepted?",
    a: "All major debit/credit cards and bank transfers via Paystack. Your payment details are handled securely by Paystack — we never store card information.",
  },
  {
    q: "Can I order from multiple vendors at once?",
    a: "Currently each order is from a single vendor. Start a new order after you've picked up your first one.",
  },
  {
    q: "What if my order status doesn't update?",
    a: "The order page polls automatically. If it's stuck, try refreshing. If payment went through but status still shows pending after a few minutes, contact us with your order ID.",
  },
  {
    q: "How do loyalty points work?",
    a: "Logged-in users earn 1 point per ₦100 spent. Points accumulate across orders and unlock tier status (Bronze → Silver → Gold). Redemption features are coming soon.",
  },
  {
    q: "I'm a vendor — how do I get listed?",
    a: "Apply at letusell.ng/vendors/apply. Fill in your brand details and we'll review your application within 24 hours.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Help & Contact</h1>
          <p className="mt-2 text-gray-500">Everything you need to know about shopping on campus.</p>
        </div>

        {/* How it works */}
        <section className="mb-10">
          <h2 className="mb-5 text-lg font-bold text-gray-900">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Store, title: "Browse vendors", body: "Explore all approved campus brands — fashion, food, beauty, electronics, and more." },
              { icon: ShoppingBag, title: "Add to cart", body: "Pick your items from a single vendor. Your cart is saved automatically so you can browse freely." },
              { icon: CreditCard, title: "Pay securely", body: "Checkout with your name and email. Pay via card or bank transfer using Paystack's secure checkout." },
              { icon: Clock, title: "Pick up your order", body: "Head to the vendor's stall at your estimated pickup time. Show your order confirmation if needed." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <div className="flex items-start gap-3">
              <Star className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
              <div>
                <p className="font-semibold text-brand-800">Loyalty points</p>
                <p className="mt-0.5 text-sm text-brand-700">
                  Create a free account and earn 1 point per ₦100 spent. Points unlock Silver and Gold tier status.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="mb-5 text-lg font-bold text-gray-900">Frequently asked questions</h2>
          <div className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
            {faqs.map(({ q, a }) => (
              <div key={q} className="px-5 py-4">
                <p className="font-medium text-gray-900">{q}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="mb-5 text-lg font-bold text-gray-900">Get in touch</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:support@letusell.com"
              className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Mail className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Email support</p>
                <p className="mt-0.5 text-sm text-brand-600">support@letusell.com</p>
                <p className="mt-1 text-xs text-gray-400">We typically reply within 24 hours</p>
              </div>
            </a>

            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">WhatsApp</p>
                <p className="mt-0.5 text-sm text-green-600">+234 800 000 0000</p>
                <p className="mt-1 text-xs text-gray-400">Mon – Fri, 8 am – 6 pm</p>
              </div>
            </a>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Want to list your stall?{" "}
            <a href="mailto:vendors@letusell.com" className="text-brand-600 hover:underline">
              Email vendors@letusell.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
