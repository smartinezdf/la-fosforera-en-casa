export type PaymentStatus = "pending_reference" | "reference_submitted" | "verified" | "rejected" | "refunded";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "in_delivery"
  | "delivered"
  | "cancelled";

export type Dish = {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  is_available: boolean;
  is_today: boolean;
  sort_order: number;
};

export type Settings = {
  usd_to_bs_rate: number;
  delivery_usd: number;
  payment_mobile_phone: string;
  payment_mobile_bank: string;
  payment_mobile_id: string;
  restaurant_whatsapp: string;
};

export type CartItem = {
  dish: Dish;
  quantity: number;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  location_reference: string | null;
  notes: string | null;
  subtotal_usd: number;
  delivery_usd: number;
  total_usd: number;
  usd_to_bs_rate: number;
  total_bs: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  cancellation_reason: string | null;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  dish_id: string | null;
  dish_name: string;
  quantity: number;
  unit_price_usd: number;
  line_total_usd: number;
};
