import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.json();
    const { user, cart, totalEfectivo, totalTransf } = data;

    console.log("Procesando pedido para:", user.email);

    // 1. Actualizar stock en Postgres
    try {
      for (const item of cart) {
        await sql`
          UPDATE products 
          SET stock = GREATEST(0, stock - ${item.quantity})
          WHERE id = ${item.id};
        `;
      }
      console.log("Stock actualizado correctamente en la base de datos");
    } catch (err) {
      console.error("Error al actualizar stock en DB:", err);
    }

    // 2. Enviar Correo
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Nodemailer: Variables de entorno no configuradas.");
      return NextResponse.json({ success: true, simulated: true });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const itemsHtml = cart.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.cashPrice}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.transferPrice}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'centrokareh@gmail.com',
      subject: `Nuevo Pedido de ${user.name} - Catálogo Kareh`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #00A896;">¡Nuevo Pedido Recibido!</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3>Datos del Cliente</h3>
            <p><strong>Nombre:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Teléfono/WhatsApp:</strong> ${user.phone}</p>
            <p><strong>Notas:</strong> ${user.notes || 'Sin notas'}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #00A896; color: white;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px;">Cant.</th>
                <th style="padding: 10px; text-align: right;">Efectivo</th>
                <th style="padding: 10px; text-align: right;">Transf.</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Totales:</td>
                <td style="padding: 10px; text-align: right;">$${totalEfectivo}</td>
                <td style="padding: 10px; text-align: right; color: #00A896;">$${totalTransf}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
