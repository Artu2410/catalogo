import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await initDb();

    const authError = await requireAdmin();
    if (authError) {
      return authError;
    }

    const saleId = params.id;
    const sale = await sql`
      SELECT * FROM sales WHERE id = ${saleId}
    `;

    if (sale.rows.length === 0) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(sale.rows[0]);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await initDb();

    const authError = await requireAdmin();
    if (authError) {
      return authError;
    }

    const saleId = params.id;
    const body = await request.json();

    // Verificar que la venta exista
    const existingSale = await sql`
      SELECT id FROM sales WHERE id = ${saleId}
    `;

    if (existingSale.rows.length === 0) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Actualizar los campos permitidos
    const updatedSale = await sql`
      UPDATE sales 
      SET 
        customer_name = COALESCE(${body.customer_name}, customer_name),
        customer_email = COALESCE(${body.customer_email}, customer_email),
        customer_phone = COALESCE(${body.customer_phone}, customer_phone),
        payment_method = COALESCE(${body.payment_method}, payment_method),
        notes = COALESCE(${body.notes}, notes)
      WHERE id = ${saleId}
      RETURNING *
    `;

    return NextResponse.json(updatedSale.rows[0]);
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await initDb();

    const authError = await requireAdmin();
    if (authError) {
      return authError;
    }

    const saleId = params.id;

    // Verificar que la venta exista
    const existingSale = await sql`
      SELECT id FROM sales WHERE id = ${saleId}
    `;

    if (existingSale.rows.length === 0) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Eliminar la venta
    await sql`
      DELETE FROM sales WHERE id = ${saleId}
    `;

    return NextResponse.json({ success: true, message: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
