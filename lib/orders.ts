import { z } from "zod";
import { createServerSupabaseClient } from "./supabase/server";

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
  deliveryAddress: z.string().min(8),
  fulfillmentMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  locationReference: z.string().optional(),
  notes: z.string().optional(),
  paymentReference: z.string().optional(),
  items: z
    .array(
      z.object({
        dishId: z.string(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
});

export async function createOrder(input: z.infer<typeof checkoutSchema>) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { demo: true, orderId: `demo-${Date.now()}` };
  }

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (settingsError) throw settingsError;

  const dishIds = input.items.map((item) => item.dishId);
  const { data: dishes, error: dishesError } = await supabase
    .from("dishes")
    .select("*")
    .in("id", dishIds)
    .eq("is_available", true)
    .eq("is_today", true);
  if (dishesError) throw dishesError;

  const dishMap = new Map(dishes.map((dish) => [dish.id, dish]));
  const orderItems = input.items.map((item) => {
    const dish = dishMap.get(item.dishId);
    if (!dish) throw new Error("Uno de los platos ya no está disponible.");
    const quantity = item.quantity;
    const unit = Number(dish.price_usd);
    return {
      dish_id: dish.id,
      dish_name: dish.name,
      quantity,
      unit_price_usd: unit,
      line_total_usd: unit * quantity,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.line_total_usd, 0);
  const deliveryUsd = input.fulfillmentMethod === "pickup" ? 0 : Number(settings.delivery_usd);
  const totalUsd = subtotal + deliveryUsd;
  const rate = Number(settings.usd_to_bs_rate);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      delivery_address: input.deliveryAddress,
      location_reference: input.locationReference || null,
      notes: [input.fulfillmentMethod === "pickup" ? "Retiro en pickup" : "Delivery en La Guaira", input.notes]
        .filter(Boolean)
        .join(" · "),
      subtotal_usd: subtotal,
      delivery_usd: deliveryUsd,
      total_usd: totalUsd,
      usd_to_bs_rate: rate,
      total_bs: totalUsd * rate,
      order_status: "pending",
      payment_status: input.paymentReference ? "reference_submitted" : "pending_reference",
      payment_reference: input.paymentReference || null,
    })
    .select("id")
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    })),
  );
  if (itemsError) throw itemsError;

  return { demo: false, orderId: order.id };
}
