import type { CartItem } from "./cart.types";

export interface CheckoutInitializeRequest {
  cart: CartItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  vendorId: string;
  notes?: string;
}

export interface CheckoutInitializeResponse {
  orderId: string;
  accessCode: string;
  reference: string;
  amount: number; // kobo
}

export interface ApiError {
  error: string;
  code?: string;
}
