"use client";

import Image from "next/image";
import { MapPin, Minus, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
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
  fulfillmentMethod: "delivery" | "pickup";
  deliveryAddress: string;
  locationReference: string;
  notes: string;
  paymentReference: string;
};

const initialFields: CheckoutFields = {
  customerName: "",
  customerPhone: "",
  fulfillmentMethod: "delivery",
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
  const deliveryFee = fields.fulfillmentMethod === "pickup" ? 0 : settings.delivery_usd;
  const total = subtotal + deliveryFee;
  const pickupAddress = "Av. Atlantida, Calle 6, Qta Guadalupana, La Guaira";

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
        deliveryAddress: fields.fulfillmentMethod === "pickup" ? pickupAddress : fields.deliveryAddress,
        items: cart.map((item) => ({ dishId: item.dish.id, quantity: item.quantity })),
      }),
    });
    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setOrderResult(payload.error ?? "No se pudo enviar el pedido.");
      return;
    }

    setOrderResult("Pedido recibido. Revisaremos tu referencia de Pago Movil y te confirmaremos por WhatsApp cuando el restaurante acepte la orden.");
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
          <span className="eyebrow">La Guaira · Cocina de costa hecha en casa</span>
          <h1>Menú de hoy</h1>
          <p>
            Platos caseros con sabor de mar y mesa familiar. Delivery solo en La Guaira; pedidos para Caracas se entregan al final del dia por encargo.
          </p>
          <div className="hero-actions">
            <a className="mini-link" href={`https://wa.me/${settings.restaurant_whatsapp.replace(/[^\d]/g, "")}`}>
              <Phone size={15} /> Plato especial o encargo: {settings.restaurant_whatsapp}
            </a>
            <span className="mini-link muted-link">
              <MapPin size={15} /> Pickup: {pickupAddress}
            </span>
          </div>
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
              <span>{fields.fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"}</span>
              <strong>{usd(deliveryFee)}</strong>
              <small>{bs(deliveryFee * settings.usd_to_bs_rate)}</small>
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
            <small>{settings.payment_mobile_bank} · {settings.payment_mobile_id}. Coloca la referencia para agilizar la confirmacion.</small>
          </div>

          <form className="checkout-form" onSubmit={submitOrder}>
            <label className="field">
              <span>Nombre</span>
              <input required placeholder="Tu nombre" value={fields.customerName} onChange={(event) => setFields({ ...fields, customerName: event.target.value })} />
            </label>
            <label className="field">
              <span>WhatsApp obligatorio</span>
              <input
                required
                inputMode="tel"
                minLength={7}
                placeholder="Ej: 0412-0000000"
                title="Necesitamos tu numero de WhatsApp para confirmar el pedido."
                value={fields.customerPhone}
                onChange={(event) => setFields({ ...fields, customerPhone: event.target.value })}
              />
            </label>
            <div className="delivery-toggle" role="group" aria-label="Metodo de entrega">
              <button
                type="button"
                className={fields.fulfillmentMethod === "delivery" ? "active" : ""}
                onClick={() => setFields({ ...fields, fulfillmentMethod: "delivery" })}
              >
                Delivery en La Guaira
              </button>
              <button
                type="button"
                className={fields.fulfillmentMethod === "pickup" ? "active" : ""}
                onClick={() => setFields({ ...fields, fulfillmentMethod: "pickup", deliveryAddress: "" })}
              >
                Pickup
              </button>
            </div>
            {fields.fulfillmentMethod === "delivery" ? (
              <label className="field">
                <span>Dirección en La Guaira</span>
                <textarea
                  required
                  placeholder="Urbanizacion, edificio/casa, calle y punto de referencia"
                  value={fields.deliveryAddress}
                  onChange={(event) => setFields({ ...fields, deliveryAddress: event.target.value })}
                />
              </label>
            ) : (
              <div className="pickup-box">
                <strong>Retiro en tienda</strong>
                <span>{pickupAddress}</span>
              </div>
            )}
            <label className="field">
              <span>Referencia de ubicación</span>
              <input placeholder="Color de casa, edificio, porton, piso..." value={fields.locationReference} onChange={(event) => setFields({ ...fields, locationReference: event.target.value })} />
            </label>
            <label className="field">
              <span>Referencia Pago Móvil</span>
              <input inputMode="numeric" placeholder="Ultimos numeros de la referencia" value={fields.paymentReference} onChange={(event) => setFields({ ...fields, paymentReference: event.target.value })} />
            </label>
            <label className="field">
              <span>Notas opcionales</span>
              <textarea placeholder="Sin picante, hora ideal, plato especial, encargo para Caracas..." value={fields.notes} onChange={(event) => setFields({ ...fields, notes: event.target.value })} />
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
