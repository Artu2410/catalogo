import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await sql`SELECT id, name, stock FROM products LIMIT 10`;
    const users = await sql`SELECT id, email, role FROM users LIMIT 10`;
    
    return NextResponse.json({ 
      products: products.rows, 
      users: users.rows 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
