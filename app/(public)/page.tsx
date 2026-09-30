import { PublicOrderingApp } from "@/components/PublicOrderingApp";
import { demoDishes, demoSettings } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Dish, Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  let dishes: Dish[] = demoDishes;
  let settings: Settings = demoSettings;
  let demoMode = true;

  if (supabase) {
    const [dishResult, settingsResult] = await Promise.all([
      supabase.from("dishes").select("*").order("sort_order", { ascending: true }),
      supabase.from("restaurant_settings").select("*").eq("id", 1).single(),
    ]);

    if (!dishResult.error && dishResult.data?.length) dishes = dishResult.data;
    if (!settingsResult.error && settingsResult.data) settings = settingsResult.data;
    demoMode = false;
  }

  return <PublicOrderingApp dishes={dishes} settings={settings} demoMode={demoMode} />;
}
