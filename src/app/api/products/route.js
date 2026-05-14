import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM products ORDER BY id ASC`;
    
    // Map database fields to frontend camelCase
    const products = rows.map(p => ({
      ...p,
      costPrice: Number(p.cost_price),
      cashPrice: Number(p.cash_price),
      transferPrice: Number(p.transfer_price)
    }));
    
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products from database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newProduct = await request.json();
    
    const { rows } = await sql`
      INSERT INTO products (name, description, stock, cost_price, cash_price, transfer_price, image)
      VALUES (
        ${newProduct.name}, 
        ${newProduct.description}, 
        ${newProduct.stock}, 
        ${newProduct.costPrice}, 
        ${newProduct.cashPrice}, 
        ${newProduct.transferPrice}, 
        ${newProduct.image}
      )
      RETURNING *;
    `;
    
    const product = {
      ...rows[0],
      costPrice: Number(rows[0].cost_price),
      cashPrice: Number(rows[0].cash_price),
      transferPrice: Number(rows[0].transfer_price)
    };
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add product to database' }, { status: 500 });
  }
}
