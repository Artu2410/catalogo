# 📋 Guía de Testing - Experiencia de Compra

## ✅ Checklist de Testing

### 1. Página Principal
- [ ] Los productos cargan correctamente
- [ ] Puedes buscar productos por nombre
- [ ] El filtro de ordenamiento funciona (precio, nombre, relevancia)
- [ ] Stock muestra correctamente (incluyendo "SIN STOCK" para agotados)

### 2. Agregar al Carrito
- [ ] Al agregar un producto, aparece toast verde con "✅ [Producto] agregado"
- [ ] El contador del carrito aumenta en la esquina derecha
- [ ] Al agregar el mismo producto 2 veces, dice "📦 Se agregó más de"
- [ ] No puedes agregar productos sin stock (botón deshabilitado)

### 3. Abrir Carrito
- [ ] El carrito abre como panel lateral derecho
- [ ] Se ven todos los productos agregados con imágenes
- [ ] Se muestran ambos precios: 💵 efectivo y 💸 transferencia
- [ ] Puedes cambiar cantidad con +/- 
- [ ] Botón "Eliminar" remueve producto (show toast "❌ [Producto] removido")

### 4. Totales
- [ ] Total Efectivo se calcula correctamente
- [ ] Total Transferencia se calcula correctamente (generalmente menor)
- [ ] Los totales se actualizan al cambiar cantidades

### 5. Proceder al Pago
- [ ] Al hacer click "Proceder al Pago ➜", se muestra:
  - Resumen del pedido en recuadro gris
  - Formulario con campos: Nombre, Email, Teléfono, Notas
- [ ] Puedes volver atrás sin perder datos

### 6. Validaciones
- **Campo Nombre:**
  - [ ] Campo vacío muestra error rojo "El nombre debe tener al menos 3 caracteres"
  - [ ] Input se pone rojo
  - [ ] Error desaparece al escribir correctamente

- **Campo Email:**
  - [ ] Email sin @ muestra error rojo
  - [ ] Email válido lo quita
  - [ ] Placeholder dice "tu@email.com"

- **Campo Teléfono:**
  - [ ] Menos de 10 números muestra error
  - [ ] Error se quita al escribir 10+ dígitos

### 7. Confirmación
- [ ] Botón "✓ Confirmar Compra" está habilitado solo si todos los datos son válidos
- [ ] Al clickear, muestra "⏳ Enviando..."
- [ ] Se espera respuesta del servidor

### 8. Éxito
- [ ] Aparece modal con:
  - Check verde grande ✓
  - "¡Pedido enviado con éxito!"
  - Mensaje sobre contacto por WhatsApp
- [ ] Botón "Entendido" cierra el modal
- [ ] Carrito se vacía automáticamente

### 9. Casos de Error
- [ ] Si hay error de conexión, muestra toast rojo con error
- [ ] Si el servidor rechaza datos inválidos, muestra error claro
- [ ] Puedes intentar de nuevo sin perder datos

### 10. UX General
- [ ] Toast notifications desaparecen después de 3 segundos
- [ ] No hay parpadeos o saltos visuales
- [ ] Todo es responsive (funciona en móvil y escritorio)
- [ ] Los botones tienen estados hover claros

## 🧪 Escenarios de Test Completos

### Escenario 1: Compra Exitosa
1. Agregar 2-3 productos diferentes
2. Cambiar cantidades de algunos
3. Ir a checkout
4. Llenar datos válidos
5. Confirmar compra
6. ✅ Debería funcionar sin problemas

### Escenario 2: Validación de Errores
1. Ir a checkout sin carrito → debería estar bloqueado
2. Llenar con datos inválidos (email sin @, nombre corto, teléfono corto)
3. Ver errores rojos aparecer
4. ✅ Corregir debe quitar los errores

### Escenario 3: Manejo del Carrito
1. Agregar producto
2. Cambiar cantidad varias veces
3. Eliminar un producto
4. Volver a agregar
5. ✅ Todo debe ser fluido sin recargas

## 🔍 Cosas a Revisar en Consola del Navegador
- [ ] No hay errores rojos en la consola
- [ ] Los requests a `/api/checkout` son POST
- [ ] La respuesta tiene `success: true` al completar compra

## 📱 Testing en Móvil
- [ ] El carrito lateral funciona en pantalla pequeña
- [ ] Todos los inputs son usables en móvil
- [ ] Los botones tienen tamaño adecuado para tocar

---

## 💡 Notas de Testing
- La compra se registra en la BD aunque el email falle (Formspree)
- El usuario recibe confirmación por WhatsApp de todas formas
- Los datos están validados en cliente y servidor

Si encuentras algún problema, reportalo con:
- Qué intentaste hacer
- Qué pasó (error, comportamiento inesperado)
- En qué navegador/dispositivo
