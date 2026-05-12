import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newProduct = await request.json();
    const products = await getProducts();
    
    const product = {
      ...newProduct,
      id: Date.now().toString(),
    };
    
    products.push(product);
    await fs.writeFile(dataFilePath, JSON.stringify(products, null, 2));
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}
