# La Fosforera en Casa

Aplicación mobile-first para pedidos delivery con Next.js, Supabase y Cloudflare Pages.

## Funciones

- Menú del día público sin cuenta de cliente.
- Carrito, checkout y totales en USD/Bs.
- Pago Móvil con referencia manual.
- Estados separados de pago y pedido.
- Admin mobile para platos, disponibilidad, precios, tasa, delivery y pedidos.
- Supabase Auth para proteger `/admin`.
- Realtime para refrescar pedidos en admin.

## Desarrollo local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables:

```bash
cp .env.example .env.local
```

3. Ejecuta:

```bash
npm run dev
```

Sin variables de Supabase, la app abre en modo demo.

## Supabase

1. Crea un proyecto en Supabase.
2. En SQL Editor, ejecuta `supabase/schema.sql`.
3. Opcional para realtime: ejecuta `supabase/realtime.sql`.
4. Crea un usuario admin en Authentication.
5. Copia estas variables a `.env.local` y luego a Cloudflare Pages:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

## Cloudflare

Build command:

```bash
npm run cf:build
```

Build output directory:

```bash
.vercel/output/static
```

## Operación diaria

- Entra a `/admin`.
- Cambia la tasa USD/Bs y delivery cuando haga falta.
- Marca platos como disponibles/agotados o quítalos del menú del día.
- Cuando llegue un pedido, revisa referencia de Pago Móvil.
- Cambia pago a `verified` o `rejected`.
- Luego cambia el pedido a `accepted`, `preparing`, `ready`, `in_delivery`, `delivered` o `cancelled`.
