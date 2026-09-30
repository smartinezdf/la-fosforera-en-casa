import { AdminApp } from "@/components/AdminApp";
import { demoDishes, demoOrders, demoSettings } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Dish, Order, Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();
  let dishes: Dish[] = demoDishes;
  let orders: Order[] = demoOrders;
  let settings: Settings = demoSettings;
  let demoMode = true;

  if (supabase) {
    const [dishResult, orderResult, settingsResult] = await Promise.all([
      supabase.from("dishes").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("restaurant_settings").select("*").eq("id", 1).single(),
    ]);

    if (!dishResult.error && dishResult.data) dishes = dishResult.data;
    if (!orderResult.error && orderResult.data) orders = orderResult.data;
    if (!settingsResult.error && settingsResult.data) settings = settingsResult.data;
    demoMode = false;
  }

  return <AdminApp initialDishes={dishes} initialOrders={orders} initialSettings={settings} demoMode={demoMode} />;
}
