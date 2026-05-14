import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import { initDb } from '@/lib/db';

export async function GET() {
  try {
    // 1. Initialize tables
    await initDb();

    // 2. Migrate Users
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = JSON.parse(await fs.readFile(usersPath, 'utf8'));

    for (const user of usersData) {
      await sql`
        INSERT INTO users (name, email, password, role)
        VALUES (${user.name}, ${user.email}, ${user.password}, ${user.role})
        ON CONFLICT (email) DO NOTHING;
      `;
    }

    // 3. Migrate Products
    const productsPath = path.join(process.cwd(), 'data', 'products.json');
    const productsData = JSON.parse(await fs.readFile(productsPath, 'utf8'));

    for (const product of productsData) {
      await sql`
        INSERT INTO products (name, description, stock, cost_price, cash_price, transfer_price, image)
        VALUES (
          ${product.name}, 
          ${product.description}, 
          ${product.stock}, 
          ${product.costPrice || product.cost_price || 0}, 
          ${product.cashPrice || product.cash_price || 0}, 
          ${product.transferPrice || product.transfer_price || 0}, 
          ${product.image}
        );
      `;
    }

    return NextResponse.json({ message: "Migración completada con éxito" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
