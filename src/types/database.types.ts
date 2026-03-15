export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "admin" | "vendor" | "user";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "awaiting_payment"
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface University {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  university_id: string | null;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  university_id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  category: string;
  location_text: string | null;
  phone: string | null;
  avg_prep_time: number;
  min_order: number;
  is_approved: boolean;
  is_active: boolean;
  opens_at: string | null;
  closes_at: string | null;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  vendor_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuItemCategory {
  id: string;
  vendor_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  prep_time: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  university_id: string;
  vendor_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  paystack_reference: string | null;
  paystack_access_code: string | null;
  payment_status: PaymentStatus;
  amount_kobo: number;
  status: OrderStatus;
  pickup_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
  modifiers: SelectedModifier[] | null;
  created_at: string;
}

export interface SelectedModifier {
  groupId: string;
  optionId: string;
  name: string;
  priceAdjustment: number;
}

export interface ModifierGroup {
  id: string;
  menu_item_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  sort_order: number;
  modifier_options?: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  group_id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
  is_available: boolean;
  sort_order: number;
}

export interface VendorHours {
  id: string;
  vendor_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

export interface VendorSpecialClosure {
  id: string;
  vendor_id: string;
  closure_date: string;
  reason: string | null;
}

export interface VendorPayoutInfo {
  id: string;
  vendor_id: string;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  paystack_subaccount_code: string | null;
  paystack_subaccount_id: string | null;
  settlement_bank: string | null;
  percentage_charge: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  vendor_id: string;
  order_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
}

// Joined types used in UI
export interface VendorWithMenu extends Vendor {
  menus: (Menu & {
    menu_items: (MenuItem & { category: MenuItemCategory | null })[];
  })[];
  menu_item_categories: MenuItemCategory[];
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  vendor: Pick<Vendor, "id" | "name" | "slug" | "logo_url" | "location_text">;
}
