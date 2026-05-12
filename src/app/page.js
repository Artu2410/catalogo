"use client";

import { useEffect, useState } from 'react';
import { ShoppingBag, Search, ShoppingCart, Activity, X, Plus, Minus, Check, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from './store/cartStore';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCartStore();

  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotalEfectivo = cart.reduce((total, item) => total + (item.cashPrice * item.quantity), 0);
  const cartTotalTransf = cart.reduce((total, item) => total + (item.transferPrice * item.quantity), 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: checkoutData,
          cart,
          totalEfectivo: cartTotalEfectivo,
          totalTransf: cartTotalTransf
        })
      });
      
      if (response.ok) {
        alert("¡Pedido enviado con éxito! Te contactaremos a la brevedad.");
        clearCart();
        setIsCartOpen(false);
        setIsCheckout(false);
      } else {
        alert("Hubo un error al enviar el pedido. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error(error);
      alert("Hubo un error al enviar el pedido.");
    }
  };

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <Activity color="#00A896" size={28} />
            KAREH
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ position: 'relative' }}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={18} />
              Carrito
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: 'var(--danger-color)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
            <Link href="/login" className="admin-link">
              Ingresar
            </Link>
          </div>
        </div>
      </header>

      <main className="main container">
        <h1 className="page-title animate-fade-in">Catálogo de Productos</h1>
        <p className="page-subtitle animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Equipamiento profesional para rehabilitación y entrenamiento
        </p>

        <div className="card animate-fade-in" style={{ animationDelay: '0.2s', padding: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Search color="#8b949e" size={20} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: 0 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="product-card animate-fade-in"
                style={{ animationDelay: `${0.1 * (index + 3)}s` }}
              >
                {product.image ? (
                  <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    backgroundImage: `url(${product.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }} />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <ImageIcon size={48} opacity={0.5} />
                  </div>
                )}
                
                <div className="product-header">
                  <h3 className="product-title">{product.name}</h3>
                  <span className="product-badge">Stock: {product.stock}</span>
                </div>
                
                <p className="product-desc">{product.description}</p>
                
                <div className="product-prices">
                  <div className="price-row">
                    <span className="price-label">Precio Efectivo:</span>
                    <span className="price-value">{formatPrice(product.cashPrice)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">Transferencia:</span>
                    <span className="price-value price-highlight">{formatPrice(product.transferPrice)}</span>
                  </div>
                </div>

                <div className="product-actions" style={{ flexDirection: 'column' }}>
                  <button 
                    onClick={() => addToCart(product)} 
                    className="btn btn-primary"
                    disabled={product.stock <= 0}
                  >
                    <ShoppingBag size={18} />
                    {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                  </button>
                  {product.url && (
                    <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                      Ver en TiendaNube
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <ShoppingBag size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No se encontraron productos.</p>
          </div>
        )}
      </main>

      {/* Shopping Cart Modal/Sidebar */}
      {isCartOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '100%', maxWidth: '450px', backgroundColor: 'var(--primary-color)',
            height: '100%', display: 'flex', flexDirection: 'column',
            boxShadow: '-5px 0 25px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={24} /> Mi Carrito
              </h2>
              <button onClick={() => { setIsCartOpen(false); setIsCheckout(false); }} style={{ color: 'var(--text-secondary)', padding: '0.5rem' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>Tu carrito está vacío.</p>
                </div>
              ) : !isCheckout ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '0.25rem' }}>{item.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          Efectivo: {formatPrice(item.cashPrice)} | Transf: {formatPrice(item.transferPrice)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '0.25rem 0.5rem', color: 'white' }}><Minus size={14} /></button>
                            <span style={{ padding: '0 0.5rem', fontSize: '0.9rem' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '0.25rem 0.5rem', color: 'white' }}><Plus size={14} /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Datos de Contacto</h3>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input type="text" className="form-control" required value={checkoutData.name} onChange={e => setCheckoutData({...checkoutData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" className="form-control" required value={checkoutData.email} onChange={e => setCheckoutData({...checkoutData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono / WhatsApp</label>
                    <input type="tel" className="form-control" required value={checkoutData.phone} onChange={e => setCheckoutData({...checkoutData, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas Adicionales (opcional)</label>
                    <textarea className="form-control" rows="3" value={checkoutData.notes} onChange={e => setCheckoutData({...checkoutData, notes: e.target.value})}></textarea>
                  </div>
                </form>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Efectivo:</span>
                  <span>{formatPrice(cartTotalEfectivo)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <span style={{ color: 'var(--success-color)' }}>Total Transferencia:</span>
                  <span style={{ color: 'var(--success-color)' }}>{formatPrice(cartTotalTransf)}</span>
                </div>
                
                {!isCheckout ? (
                  <button onClick={() => setIsCheckout(true)} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                    Proceder al Pago
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setIsCheckout(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                      Volver
                    </button>
                    <button form="checkout-form" type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                      Confirmar Compra
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
