import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sales = await sql`
      SELECT * FROM sales 
      ORDER BY created_at DESC;
    `;
    return NextResponse.json(sales.rows);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      items, 
      total_amount, 
      payment_method, 
      source, 
      notes 
    } = body;

    // 1. Insert into sales table
    const result = await sql`
      INSERT INTO sales (
        customer_name, 
        customer_email, 
        customer_phone, 
        items, 
        total_amount, 
        payment_method, 
        source, 
        notes
      ) VALUES (
        ${customer_name}, 
        ${customer_email}, 
        ${customer_phone}, 
        ${JSON.stringify(items)}, 
        ${total_amount}, 
        ${payment_method}, 
        ${source}, 
        ${notes}
      ) RETURNING *;
    `;

    // 2. Update stock for each item
    for (const item of items) {
      await sql`
        UPDATE products 
        SET stock = GREATEST(0, stock - ${item.quantity})
        WHERE id = ${item.id};
      `;
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
