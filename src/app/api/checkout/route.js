import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const data = await request.json();
    const { user, cart, totalEfectivo, totalTransf } = data;

    // We check if environment variables are set. If not, we still return success 
    // but log it so the developer knows it needs configuration.
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Nodemailer: Las variables de entorno EMAIL_USER o EMAIL_PASS no están configuradas. Simulando envío de correo.");
      console.log("Datos del pedido:", data);
      return NextResponse.json({ success: true, simulated: true });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can use other services
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
            <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Datos del Cliente</h3>
            <p><strong>Nombre:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Teléfono/WhatsApp:</strong> ${user.phone}</p>
            <p><strong>Notas:</strong> ${user.notes || 'Sin notas adicionales'}</p>
          </div>

          <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px;">Detalle del Pedido</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #00A896; color: white;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cant.</th>
                <th style="padding: 10px; text-align: right;">Efectivo</th>
                <th style="padding: 10px; text-align: right;">Transf.</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Totales:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">$${totalEfectivo}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #00A896;">$${totalTransf}</td>
              </tr>
            </tfoot>
          </table>
          
          <p style="font-size: 12px; color: #888; text-align: center;">Este correo fue generado automáticamente desde tu Catálogo Kareh.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
