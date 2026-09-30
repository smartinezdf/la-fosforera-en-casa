# Guía rápida de administración

## Cada mañana

1. Abre `/admin`.
2. Actualiza la tasa USD/Bs.
3. Revisa el costo de delivery.
4. Marca cuáles platos van en el menú del día.
5. Marca agotado cualquier plato que no esté disponible.

## Cuando entra un pedido

1. Revisa teléfono, dirección y referencia de ubicación.
2. Contacta al cliente por WhatsApp si falta algo.
3. Verifica la referencia de Pago Móvil.
4. Cambia el estado del pago a `verified` o `rejected`.
5. Decide si el restaurante acepta el pedido.

## Estados

Pago:

- `pending_reference`: el cliente no envió referencia.
- `reference_submitted`: el cliente envió referencia.
- `verified`: pago confirmado manualmente.
- `rejected`: pago rechazado.
- `refunded`: pago devuelto.

Pedido:

- `pending`: pedido recibido.
- `accepted`: restaurante aceptó la orden.
- `preparing`: cocina preparando.
- `ready`: listo para salir.
- `in_delivery`: en delivery.
- `delivered`: entregado.
- `cancelled`: cancelado.
