import type { Vendor } from "./database.types";

export interface SelectedCartModifier {
  groupId: string;
  optionId: string;
  name: string;
  priceAdjustment: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  notes?: string;
  selectedModifiers?: SelectedCartModifier[];
}

export interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  vendorSlug: string | null;
}

export interface CartActions {
  addItem: (item: CartItem, vendor: Pick<Vendor, "id" | "name" | "slug">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export interface CartDrawerState {
  drawerOpen: boolean;
}
