"use client";

import { Check, MessageCircle, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { demoDishes, demoOrders, demoSettings } from "@/lib/demo-data";
import { bs, usd, whatsappHref } from "@/lib/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Dish, Order, OrderStatus, PaymentStatus, Settings } from "@/lib/types";

type Props = {
  initialDishes: Dish[];
  initialOrders: Order[];
  initialSettings: Settings;
  demoMode: boolean;
};

const orderStatuses: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "in_delivery", "delivered", "cancelled"];
const paymentStatuses: PaymentStatus[] = ["pending_reference", "reference_submitted", "verified", "rejected", "refunded"];

const orderLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  preparing: "Preparando",
  ready: "Listo",
  in_delivery: "En delivery",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending_reference: "Sin referencia",
  reference_submitted: "Referencia enviada",
  verified: "Pago verificado",
  rejected: "Pago rechazado",
  refunded: "Devuelto",
};

export function AdminApp({ initialDishes, initialOrders, initialSettings, demoMode }: Props) {
  const [dishes, setDishes] = useState(initialDishes.length ? initialDishes : demoDishes);
  const [orders, setOrders] = useState(initialOrders.length ? initialOrders : demoOrders);
  const [settings, setSettings] = useState(initialSettings ?? demoSettings);
  const [newDish, setNewDish] = useState({ name: "", description: "", price_usd: "5" });
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async () => {
        const { data } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false })
          .limit(40);
        if (data) setOrders(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function saveSettings() {
    if (!supabase) return;
    await supabase.from("restaurant_settings").upsert({ id: 1, ...settings });
  }

  async function updateDish(id: string, patch: Partial<Dish>) {
    setDishes((current) => current.map((dish) => (dish.id === id ? { ...dish, ...patch } : dish)));
    if (supabase) await supabase.from("dishes").update(patch).eq("id", id);
  }

  async function deleteDish(id: string) {
    if (!window.confirm("¿Eliminar este plato del menú?")) return;
    setDishes((current) => current.filter((dish) => dish.id !== id));
    if (supabase) await supabase.from("dishes").delete().eq("id", id);
  }

  async function addDish() {
    const dish = {
      name: newDish.name,
      description: newDish.description,
      price_usd: Number(newDish.price_usd),
      is_available: true,
      is_today: true,
      sort_order: dishes.length + 1,
    };

    if (supabase) {
      const { data } = await supabase.from("dishes").insert(dish).select("*").single();
      if (data) setDishes((current) => [...current, data]);
    } else {
      setDishes((current) => [...current, { ...dish, id: `demo-${Date.now()}` }]);
    }
    setNewDish({ name: "", description: "", price_usd: "5" });
  }

  async function updateOrder(id: string, patch: Partial<Order>) {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, ...patch } : order)));
    if (supabase) await supabase.from("orders").update(patch).eq("id", id);
  }

  async function cancelOrder(id: string) {
    const reason = window.prompt("Razón de cancelación");
    if (!reason) return;
    await updateOrder(id, { order_status: "cancelled", cancellation_reason: reason });
  }

  return (
    <main className="page-shell admin-shell">
      <header className="admin-header">
        <div>
          <span className="pill">Admin</span>
          <h1>La Fosforera en Casa</h1>
        </div>
        {demoMode ? <span className="status-chip wait">Modo demo</span> : <span className="status-chip ok">Supabase activo</span>}
      </header>

      <section className="admin-grid">
        <div className="admin-section card">
          <h2>Configuración</h2>
          <div className="compact-grid">
            <label className="field">
              <span>Tasa USD/Bs</span>
              <input type="number" step="0.01" value={settings.usd_to_bs_rate} onChange={(event) => setSettings({ ...settings, usd_to_bs_rate: Number(event.target.value) })} />
            </label>
            <label className="field">
              <span>Delivery USD</span>
              <input type="number" step="0.01" value={settings.delivery_usd} onChange={(event) => setSettings({ ...settings, delivery_usd: Number(event.target.value) })} />
            </label>
            <label className="field">
              <span>Teléfono Pago Móvil</span>
              <input value={settings.payment_mobile_phone} onChange={(event) => setSettings({ ...settings, payment_mobile_phone: event.target.value })} />
            </label>
            <label className="field">
              <span>Banco Pago Móvil</span>
              <input value={settings.payment_mobile_bank} onChange={(event) => setSettings({ ...settings, payment_mobile_bank: event.target.value })} />
            </label>
            <label className="field">
              <span>Cédula/RIF Pago Móvil</span>
              <input value={settings.payment_mobile_id} onChange={(event) => setSettings({ ...settings, payment_mobile_id: event.target.value })} />
            </label>
            <button className="btn" type="button" onClick={saveSettings}>
              <Save size={17} /> Guardar configuración
            </button>
          </div>
        </div>

        <div className="admin-section card">
          <h2>Pedidos nuevos</h2>
          <div className="compact-grid">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="dish-heading">
                  <div>
                    <strong>{order.customer_name}</strong>
                    <div className="order-meta">
                      <span>{order.delivery_address}</span>
                      <span>Total: {usd(order.total_usd)} · {bs(order.total_bs)}</span>
                      <span>Pago: {order.payment_status} · Pedido: {order.order_status}</span>
                      {order.payment_reference ? <span>Ref. pago: {order.payment_reference}</span> : null}
                    </div>
                  </div>
                  <a className="btn secondary" href={whatsappHref(order.customer_phone, `Hola, te escribimos de La Fosforera en Casa sobre tu pedido ${order.id}.`)}>
                    <MessageCircle size={17} />
                  </a>
                </div>
                <div className="row-actions">
                  <select value={order.payment_status} onChange={(event) => updateOrder(order.id, { payment_status: event.target.value as PaymentStatus })}>
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>{paymentLabels[status]}</option>
                    ))}
                  </select>
                  <select value={order.order_status} onChange={(event) => updateOrder(order.id, { order_status: event.target.value as OrderStatus })}>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>{orderLabels[status]}</option>
                    ))}
                  </select>
                  <button className="btn secondary" type="button" onClick={() => updateOrder(order.id, { payment_status: "verified" })}>
                    <Check size={16} /> Pago OK
                  </button>
                  <button className="btn secondary" type="button" onClick={() => updateOrder(order.id, { order_status: "accepted" })}>
                    Aceptar
                  </button>
                  <button className="btn danger" type="button" onClick={() => cancelOrder(order.id)}>
                    <X size={16} /> Cancelar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-section card">
        <h2>Menú del día</h2>
        <div className="dish-admin-row">
          <label className="field">
            <span>Nombre del plato</span>
            <input value={newDish.name} onChange={(event) => setNewDish({ ...newDish, name: event.target.value })} />
          </label>
          <label className="field">
            <span>Descripción</span>
            <input value={newDish.description} onChange={(event) => setNewDish({ ...newDish, description: event.target.value })} />
          </label>
          <label className="field">
            <span>Precio USD</span>
            <input type="number" step="0.01" value={newDish.price_usd} onChange={(event) => setNewDish({ ...newDish, price_usd: event.target.value })} />
          </label>
          <button className="btn" type="button" onClick={addDish} disabled={!newDish.name}>
            <Plus size={17} /> Agregar plato
          </button>
        </div>
        <div className="compact-grid">
          {dishes.map((dish) => (
            <article className="dish-admin-row" key={dish.id}>
              <label className="field">
                <span>Plato</span>
                <input value={dish.name} onChange={(event) => updateDish(dish.id, { name: event.target.value })} />
              </label>
              <label className="field">
                <span>Descripción</span>
                <textarea value={dish.description} onChange={(event) => updateDish(dish.id, { description: event.target.value })} />
              </label>
              <label className="field">
                <span>Precio USD</span>
                <input type="number" step="0.01" value={dish.price_usd} onChange={(event) => updateDish(dish.id, { price_usd: Number(event.target.value) })} />
              </label>
              <div className="row-actions">
                <button className="btn secondary" type="button" onClick={() => updateDish(dish.id, { is_available: !dish.is_available })}>
                  {dish.is_available ? "Marcar agotado" : "Marcar disponible"}
                </button>
                <button className="btn secondary" type="button" onClick={() => updateDish(dish.id, { is_today: !dish.is_today })}>
                  {dish.is_today ? "Quitar del día" : "Poner hoy"}
                </button>
                <button className="btn danger" type="button" onClick={() => deleteDish(dish.id)}>
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
