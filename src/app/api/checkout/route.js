import { NextResponse } from 'next/server';
import { getFormspreeEndpoint } from '@/lib/env';
import { createSaleWithStockReservation } from '@/lib/sales';

export const dynamic = 'force-dynamic';

function formatPrice(price) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
}

function buildOrderSummary(cart = []) {
  return cart
    .map(
      (item) =>
        `${item.quantity}x ${item.name} | Efectivo: ${formatPrice(
          item.cashPrice
        )} | Transferencia: ${formatPrice(item.transferPrice)}`
    )
    .join('\n');
}

function buildOrderMessage({ user, cart, totalEfectivo, totalTransf }) {
  return [
    'Nuevo pedido desde catalogokareh',
    '',
    'Cliente',
    `Nombre: ${user.name}`,
    `Email: ${user.email}`,
    `Telefono / WhatsApp: ${user.phone}`,
    `Notas: ${user.notes?.trim() || 'Sin notas'}`,
    '',
    'Productos',
    buildOrderSummary(cart),
    '',
    `Total Efectivo: ${formatPrice(totalEfectivo)}`,
    `Total Transferencia: ${formatPrice(totalTransf)}`,
  ].join('\n');
}

async function sendOrderNotification(order) {
  const endpoint = getFormspreeEndpoint();
  const params = new URLSearchParams({
    name: order.user.name,
    email: order.user.email,
    phone: order.user.phone,
    notes: order.user.notes?.trim() || 'Sin notas',
    items: buildOrderSummary(order.cart),
    total_efectivo: formatPrice(order.totalEfectivo),
    total_transferencia: formatPrice(order.totalTransf),
    project: 'catalogokareh',
    message: buildOrderMessage(order),
    _subject: `Nuevo pedido de ${order.user.name} - Catalogo Kareh`,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Formspree request failed with ${response.status}: ${responseText}`
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { user, cart } = data;
    const hasValidUser =
      user?.name?.trim() && user?.email?.trim() && user?.phone?.trim();

    if (!hasValidUser) {
      return NextResponse.json(
        { error: 'Por favor completa correctamente todos los campos requeridos' },
        { status: 400 }
      );
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email.trim())) {
      return NextResponse.json(
        { error: 'El email no es válido' },
        { status: 400 }
      );
    }

    console.log("Procesando pedido para:", user.email);

    const saleResult = await createSaleWithStockReservation({
      customerName: user.name.trim(),
      customerEmail: user.email.trim(),
      customerPhone: user.phone.trim(),
      items: cart,
      paymentMethod: 'pendiente',
      source: 'web',
      notes: user.notes?.trim() || '',
      priceMode: 'transferencia',
    });

    if (saleResult.error) {
      return NextResponse.json(
        { error: saleResult.error },
        { status: saleResult.status }
      );
    }

    console.log('Venta registrada y stock actualizado correctamente');

    let notificationSent = false;

    try {
      await sendOrderNotification({
        user,
        cart: saleResult.saleItems,
        totalEfectivo: saleResult.totals.cash,
        totalTransf: saleResult.totals.transfer,
      });
      notificationSent = true;
    } catch (notificationError) {
      console.error('Error sending Formspree notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      notificationSent,
      saleId: saleResult.sale.id,
      totals: saleResult.totals,
    });
    
  } catch (error) {
    console.error("Error processing order:", error);
    return NextResponse.json({ error: 'No pudimos procesar tu pedido. Por favor intenta de nuevo.' }, { status: 500 });
  }
}
