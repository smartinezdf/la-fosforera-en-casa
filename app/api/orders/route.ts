import { NextResponse } from "next/server";
import { checkoutSchema, createOrder } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = checkoutSchema.parse(body);
    const result = await createOrder(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
