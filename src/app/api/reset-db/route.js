import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function loadProductSeed() {
  const filePath = path.join(process.cwd(), 'data', 'products.json');
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// ⚠️ DANGER ZONE - Solo admin puede limpiar la BD
export async function POST(request) {
  try {
    await initDb();

    const authError = await requireAdmin();
    if (authError) {
      return authError;
    }

    const body = await request.json();
    if (body.confirm !== 'BORRAR_TODO') {
      return NextResponse.json(
        { error: 'Confirmación requerida: enviar confirm: "BORRAR_TODO"' },
        { status: 400 }
      );
    }

    console.log('🔴 Limpiando base de datos...');

    // 1. Eliminar todas las ventas
    await sql`DELETE FROM sales`;

    // 2. Limpiar y recargar productos desde el seed
    await sql`TRUNCATE TABLE products RESTART IDENTITY CASCADE`;

    const productsData = await loadProductSeed();
    let insertedCount = 0;

    for (const product of productsData) {
      await sql`
        INSERT INTO products (
          name,
          description,
          stock,
          cost_price,
          cash_price,
          transfer_price,
          image
        ) VALUES (
          ${product.name},
          ${product.description},
          ${product.stock},
          ${product.costPrice ?? product.cost_price ?? 0},
          ${product.cashPrice ?? product.cash_price ?? 0},
          ${product.transferPrice ?? product.transfer_price ?? 0},
          ${product.image}
        )`;
      insertedCount += 1;
    }

    console.log('✅ Base de datos limpiada y productos recargados');

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada y productos recargados correctamente',
      deletedSales: true,
      insertedProducts: insertedCount,
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
