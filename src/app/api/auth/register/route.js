import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

async function getUsers() {
  try {
    const fileContents = await fs.readFile(usersFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const users = await getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'user'
    };
    
    users.push(newUser);
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
    
    return NextResponse.json({ message: 'Usuario registrado con éxito' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 });
  }
}
