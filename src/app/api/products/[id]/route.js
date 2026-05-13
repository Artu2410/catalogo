import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';


const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

async function getProducts() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(dataFilePath, '[]');
      return [];
    }
    throw error;
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updatedData = await request.json();
    const products = await getProducts();
    
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    products[index] = { ...products[index], ...updatedData };
    await fs.writeFile(dataFilePath, JSON.stringify(products, null, 2));
    
    return NextResponse.json(products[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const products = await getProducts();
    
    const filteredProducts = products.filter(p => p.id !== id);
    if (products.length === filteredProducts.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    await fs.writeFile(dataFilePath, JSON.stringify(filteredProducts, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
