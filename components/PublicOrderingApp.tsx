"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { CartItem, Dish, Settings } from "@/lib/types";
import { bs, usd } from "@/lib/format";

type Props = {
  dishes: Dish[];
  settings: Settings;
  demoMode: boolean;
};

type CheckoutFields = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  locationReference: string;
  notes: string;
  paymentReference: string;
};

const initialFields: CheckoutFields = {
  customerName: "",
  customerPhone: "",
  deliveryAddress: "",
  locationReference: "",
  notes: "",
  paymentReference: "",
};

export function PublicOrderingApp({ dishes, settings, demoMode }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fields, setFields] = useState(initialFields);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<string | null>(null);
  const availableToday = dishes.filter((dish) => dish.is_today).sort((a, b) => a.sort_order - b.sort_order);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.dish.price_usd * item.quantity, 0), [cart]);
  const total = subtotal + settings.delivery_usd;

  function setQuantity(dish: Dish, nextQuantity: number) {
    setCart((current) => {
      if (nextQuantity <= 0) return current.filter((item) => item.dish.id !== dish.id);
      const existing = current.find((item) => item.dish.id === dish.id);
      if (existing) {
        return current.map((item) => (item.dish.id === dish.id ? { ...item, quantity: nextQuantity } : item));
      }
      return [...current, { dish, quantity: nextQuantity }];
    });
  }

  function quantityFor(dishId: string) {
    return cart.find((item) => item.dish.id === dishId)?.quantity ?? 0;
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.length) return;
    setIsSubmitting(true);
    setOrderResult(null);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...fields,
        items: cart.map((item) => ({ dishId: item.dish.id, quantity: item.quantity })),
      }),
    });
    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setOrderResult(payload.error ?? "No se pudo enviar el pedido.");
      return;
    }

    setOrderResult(`Pedido recibido: ${payload.orderId}. Estado inicial: pago pendiente de verificacion y orden pendiente de aceptar.`);
    setCart([]);
    setFields(initialFields);
  }

  return (
    <main className="page-shell public-page">
      <section className="hero">
        <div className="hero-mark">
          <Image src="/logo-la-fosforera.png" alt="La Fosforera en Casa" width={510} height={216} priority />
        </div>
        <div className="hero-copy">
          <span className="pill">
            <Sparkles size={15} /> El sabor de siempre
          </span>
          <h1 className="serif">Menú del día</h1>
          <p>Comida familiar venezolana hecha en casa. Haz tu pedido, registra tu Pago Móvil y el restaurante confirma el pago y acepta la orden.</p>
          {demoMode ? <strong className="demo-note">Modo demo: conecta Supabase para datos reales.</strong> : null}
        </div>
      </section>

      <section className="ordering-grid">
        <div className="menu-list" aria-label="Menú del día">
          {availableToday.map((dish) => {
            const quantity = quantityFor(dish.id);
            return (
              <article className="dish card" key={dish.id}>
                <div>
                  <div className="dish-heading">
                    <h2>{dish.name}</h2>
                    <span className={dish.is_available ? "status-chip ok" : "status-chip bad"}>
                      {dish.is_available ? "Disponible" : "Agotado"}
                    </span>
                  </div>
                  <p>{dish.description}</p>
                </div>
                <div className="dish-footer">
                  <div className="price-stack">
                    <strong>{usd(dish.price_usd)}</strong>
                    <span>{bs(dish.price_usd * settings.usd_to_bs_rate)}</span>
                  </div>
                  <div className="qty-control" aria-label={`Cantidad de ${dish.name}`}>
                    <button type="button" disabled={!dish.is_available || quantity === 0} onClick={() => setQuantity(dish, quantity - 1)}>
                      <Minus size={16} />
                    </button>
                    <span>{quantity}</span>
                    <button type="button" disabled={!dish.is_available} onClick={() => setQuantity(dish, quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="checkout card" aria-label="Carrito y checkout">
          <div className="checkout-title">
            <ShoppingBag size={20} />
            <h2>Tu pedido</h2>
          </div>
          {cart.length ? (
            <div className="cart-lines">
              {cart.map((item) => (
                <div className="cart-line" key={item.dish.id}>
                  <div>
                    <strong>{item.dish.name}</strong>
                    <span>
                      {item.quantity} x {usd(item.dish.price_usd)}
                    </span>
                  </div>
                  <button type="button" aria-label="Eliminar" onClick={() => setQuantity(item.dish, 0)}>
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Agrega platos para comenzar tu pedido.</p>
          )}

          <div className="totals">
            <div>
              <span>Subtotal</span>
              <strong>{usd(subtotal)}</strong>
              <small>{bs(subtotal * settings.usd_to_bs_rate)}</small>
            </div>
            <div>
              <span>Delivery</span>
              <strong>{usd(settings.delivery_usd)}</strong>
              <small>{bs(settings.delivery_usd * settings.usd_to_bs_rate)}</small>
            </div>
            <div className="grand-total">
              <span>Total</span>
              <strong>{usd(total)}</strong>
              <small>{bs(total * settings.usd_to_bs_rate)}</small>
            </div>
          </div>

          <div className="payment-box">
            <span>Pago Móvil</span>
            <strong>{settings.payment_mobile_phone}</strong>
            <small>{settings.payment_mobile_bank} · {settings.payment_mobile_id}</small>
          </div>

          <form className="checkout-form" onSubmit={submitOrder}>
            <label className="field">
              <span>Nombre</span>
              <input required value={fields.customerName} onChange={(event) => setFields({ ...fields, customerName: event.target.value })} />
            </label>
            <label className="field">
              <span>WhatsApp</span>
              <input required inputMode="tel" value={fields.customerPhone} onChange={(event) => setFields({ ...fields, customerPhone: event.target.value })} />
            </label>
            <label className="field">
              <span>Dirección de delivery</span>
              <textarea required value={fields.deliveryAddress} onChange={(event) => setFields({ ...fields, deliveryAddress: event.target.value })} />
            </label>
            <label className="field">
              <span>Referencia de ubicación</span>
              <input value={fields.locationReference} onChange={(event) => setFields({ ...fields, locationReference: event.target.value })} />
            </label>
            <label className="field">
              <span>Referencia Pago Móvil</span>
              <input inputMode="numeric" value={fields.paymentReference} onChange={(event) => setFields({ ...fields, paymentReference: event.target.value })} />
            </label>
            <label className="field">
              <span>Notas opcionales</span>
              <textarea value={fields.notes} onChange={(event) => setFields({ ...fields, notes: event.target.value })} />
            </label>
            <button className="btn" disabled={!cart.length || isSubmitting} type="submit">
              {isSubmitting ? "Enviando..." : "Enviar pedido"}
            </button>
          </form>
          {orderResult ? <p className="result-message">{orderResult}</p> : null}
        </aside>
      </section>
    </main>
  );
}
