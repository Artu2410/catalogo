import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { requireAdmin } from '@/lib/auth';
import { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ⚠️ DANGER ZONE - Solo admin puede limpiar la BD
export async function POST(request) {
  try {
    await initDb();

    const authError = await requireAdmin();
    if (authError) {
      return authError;
    }

    // Verificar header de confirmación
    const body = await request.json();
    if (body.confirm !== 'BORRAR_TODO') {
      return NextResponse.json(
        { error: 'Confirmación requerida: enviar confirm: "BORRAR_TODO"' },
        { status: 400 }
      );
    }

    console.log('🔴 Limpiando base de datos...');

    // 1. Eliminar todas las ventas y sus items
    await sql`DELETE FROM sale_items`;
    await sql`DELETE FROM sales`;

    // 2. Resetear todos los productos al stock inicial
    const productsData = [
      { id: '1', name: 'SET BANDAS TELA (X3)', stock: 5 },
      { id: '2', name: 'BANDAS (X5)', stock: 4 },
      { id: '3', name: 'TIRABANDAS', stock: 3 },
      { id: '4', name: 'HAND GRIP', stock: 2 },
      { id: '5', name: 'MINI BOZU', stock: 2 },
      { id: '6', name: 'PELOTAS MASAJE', stock: 2 },
      { id: '1778631727112', name: 'BANDA CIRCULA TELA VERDE 60LB 74*8cm', stock: 1 },
      { id: '1778631860441', name: 'BANDA CIRCULA TELA ROSA 90LB 74*8cm', stock: 1 },
      { id: '1778631942272', name: 'BANDA CIRCULA TELA VIOLETA 120LB 74*8cm', stock: 1 },
    ];

    for (const product of productsData) {
      await sql`
        UPDATE products 
        SET stock = ${product.stock}, reserved_stock = 0
        WHERE id = ${product.id}
      `;
    }

    console.log('✅ Base de datos limpiada y reseteada');

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada correctamente',
      deletedSales: true,
      restoredProducts: productsData.length
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
