"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Search, ShoppingCart, Activity, X, Plus, Minus, Check, Image as ImageIcon, Filter } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from './store/cartStore';

function ProductPreviewImage({ src, alt }) {
  const normalizedSrc = String(src || '').trim();

  if (!normalizedSrc) {
    return null;
  }

  if (normalizedSrc.startsWith('/')) {
    return (
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="product-image"
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={normalizedSrc} alt={alt} className="product-image" />;
}

function CartPreviewImage({ src, alt }) {
  const normalizedSrc = String(src || '').trim();

  if (!normalizedSrc) {
    return null;
  }

  const sharedStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '2px',
  };

  if (normalizedSrc.startsWith('/')) {
    return (
      <Image
        src={normalizedSrc}
        alt={alt}
        width={56}
        height={56}
        unoptimized
        style={sharedStyle}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={normalizedSrc} alt={alt} style={sharedStyle} />;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevant');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [checkoutWarning, setCheckoutWarning] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  
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

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const validateCheckoutData = () => {
    const errors = {};
    
    if (!checkoutData.name.trim() || checkoutData.name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!checkoutData.email.trim() || !emailRegex.test(checkoutData.email)) {
      errors.email = 'Por favor ingresa un email válido';
    }
    
    if (!checkoutData.phone.trim() || checkoutData.phone.trim().length < 10) {
      errors.phone = 'Por favor ingresa un teléfono válido';
    }
    
    setCheckoutErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return a.cashPrice - b.cashPrice;
      if (sortBy === 'price-desc') return b.cashPrice - a.cashPrice;
      return 0; // relevant
    });

  const cartTotalEfectivo = cart.reduce((total, item) => total + (item.cashPrice * item.quantity), 0);
  const cartTotalTransf = cart.reduce((total, item) => total + (item.transferPrice * item.quantity), 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!validateCheckoutData()) {
      showToast('Por favor completa correctamente todos los campos');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setCheckoutWarning('');

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
      const result = await response.json().catch(() => ({}));
      
      if (response.ok) {
        if (result.notificationSent === false) {
          setCheckoutWarning('✅ Pedido registrado. Nota: No pudimos enviar el email de confirmación, pero recibirás actualizaciones por WhatsApp.');
        }
        clearCart();
        setIsCartOpen(false);
        setIsCheckout(false);
        setShowSuccessModal(true);
      } else {
        const errorMsg = result.error === 'Datos de compra invalidos' 
          ? 'Por favor completa correctamente todos los campos'
          : result.error || "Hubo un error al enviar el pedido. Por favor intenta de nuevo.";
        showToast('❌ ' + errorMsg);
      }
    } catch (error) {
      console.error(error);
      showToast('❌ Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <Image
              src="/images/logo.png"
              alt="KAREH Logo"
              width={40}
              height={40}
              priority
              style={{ height: '40px', width: 'auto' }}
            />
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

        <div className="search-sort-container animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="search-box">
            <Search color="#8b949e" size={20} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="sort-box">
            <Filter color="#8b949e" size={18} />
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="relevant">Más relevantes</option>
              <option value="name-asc">Nombre: A - Z</option>
              <option value="name-desc">Nombre: Z - A</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
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
                  <div className="product-image-container">
                    <ProductPreviewImage src={product.image} alt={product.name} />
                  </div>
                ) : (
                  <div className="product-image-placeholder">
                    <ImageIcon size={48} opacity={0.5} />
                  </div>
                )}
                
                <div className="product-header">
                  <h3 className="product-title">{product.name}</h3>
                  <span className={`product-badge ${product.stock <= 0 ? 'badge-danger' : ''}`}>
                    {product.stock <= 0 ? 'SIN STOCK' : `Stock: ${product.stock}`}
                  </span>
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
                    onClick={() => {
                      const isAlreadyInCart = cart.some(item => item.id === product.id);
                      addToCart(product);
                      if (isAlreadyInCart) {
                        showToast(`📦 Se agregó más de ${product.name}`);
                      } else {
                        showToast(`✅ ${product.name} agregado al carrito`);
                      }
                    }} 
                    className="btn btn-primary"
                    disabled={product.stock <= 0}
                  >
                    <ShoppingBag size={18} />
                    {product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                  </button>
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

      <footer className="footer animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="container">
          <p>KAREH © 2026 Todos los derechos reservados</p>
        </div>
      </footer>

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
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Agrega productos para comenzar</p>
                </div>
              ) : !isCheckout ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {item.image && (
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '8px', 
                          overflow: 'hidden',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CartPreviewImage src={item.image} alt={item.name} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '0.25rem' }}>{item.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          💵 {formatPrice(item.cashPrice)} | 💸 {formatPrice(item.transferPrice)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '0.25rem 0.5rem', color: 'white', cursor: 'pointer' }}><Minus size={14} /></button>
                            <span style={{ padding: '0 0.5rem', fontSize: '0.9rem', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '0.25rem 0.5rem', color: 'white', cursor: 'pointer' }}><Plus size={14} /></button>
                          </div>
                          <button onClick={() => { removeFromCart(item.id); showToast(`❌ ${item.name} removido`); }} style={{ color: 'var(--danger-color)', fontSize: '0.85rem', cursor: 'pointer' }}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📋 Resumen del Pedido</h3>
                  <div style={{ backgroundColor: 'var(--secondary-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                    {cart.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < cart.length - 1 ? '1px solid var(--border-color)' : 'none', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{item.quantity}x {item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💵 {formatPrice(item.cashPrice)} | 💸 {formatPrice(item.transferPrice)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Total Efectivo:</span>
                      <span style={{ fontWeight: 'bold' }}>{formatPrice(cartTotalEfectivo)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: 'bold', color: 'var(--success-color)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <span>Total Transferencia:</span>
                      <span>{formatPrice(cartTotalTransf)}</span>
                    </div>
                  </div>

                  <form id="checkout-form" method="POST" onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📋 Completa tus datos</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Todos los campos son obligatorios</p>
                    
                    <div className="form-group">
                      <label className="form-label">Nombre Completo</label>
                      <input 
                        type="text" 
                        name="name" 
                        className={`form-control ${checkoutErrors.name ? 'error' : ''}`}
                        required 
                        value={checkoutData.name} 
                        onChange={e => {
                          setCheckoutData({...checkoutData, name: e.target.value});
                          if (checkoutErrors.name) setCheckoutErrors({...checkoutErrors, name: ''});
                        }}
                        placeholder="Tu nombre completo"
                      />
                      {checkoutErrors.name && <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem' }}>❌ {checkoutErrors.name}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Correo Electrónico</label>
                      <input 
                        type="email" 
                        name="email" 
                        className={`form-control ${checkoutErrors.email ? 'error' : ''}`}
                        required 
                        value={checkoutData.email} 
                        onChange={e => {
                          setCheckoutData({...checkoutData, email: e.target.value});
                          if (checkoutErrors.email) setCheckoutErrors({...checkoutErrors, email: ''});
                        }}
                        placeholder="tu@email.com"
                      />
                      {checkoutErrors.email && <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem' }}>❌ {checkoutErrors.email}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Teléfono / WhatsApp</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        className={`form-control ${checkoutErrors.phone ? 'error' : ''}`}
                        required 
                        value={checkoutData.phone} 
                        onChange={e => {
                          setCheckoutData({...checkoutData, phone: e.target.value});
                          if (checkoutErrors.phone) setCheckoutErrors({...checkoutErrors, phone: ''});
                        }}
                        placeholder="Tu número de WhatsApp"
                      />
                      {checkoutErrors.phone && <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.25rem' }}>❌ {checkoutErrors.phone}</p>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Notas o Comentarios (opcional)</label>
                      <textarea 
                        name="notes" 
                        className="form-control" 
                        rows="2" 
                        value={checkoutData.notes} 
                        onChange={e => setCheckoutData({...checkoutData, notes: e.target.value})}
                        placeholder="¿Algo que debamos saber? (ubicación, horario de entrega, etc.)"
                        style={{ fontSize: '0.9rem' }}
                      ></textarea>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>💵 Efectivo:</span>
                  <span>{formatPrice(cartTotalEfectivo)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  <span style={{ color: 'var(--success-color)' }}>💸 Transferencia:</span>
                  <span style={{ color: 'var(--success-color)' }}>{formatPrice(cartTotalTransf)}</span>
                </div>
                
                {!isCheckout ? (
                  <button onClick={() => { setCheckoutErrors({}); setIsCheckout(true); }} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                    Proceder al Pago ➜
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setIsCheckout(false)} className="btn btn-secondary" style={{ flex: 1 }} disabled={isSubmitting}>
                      ← Volver
                    </button>
                    <button form="checkout-form" type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isSubmitting}>
                      {isSubmitting ? '⏳ Enviando...' : '✓ Confirmar Compra'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content success-modal animate-fade-in">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h2>¡Pedido enviado con éxito!</h2>
            <p style={{ marginBottom: '0.5rem' }}>Gracias por confiar en KAREH. 🙏</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nos pondremos en contacto contigo a través de WhatsApp a la brevedad para coordinar el pago y la entrega.</p>
            {checkoutWarning && (
              <p style={{ marginTop: '1rem', color: '#f5c46b', fontSize: '0.9rem' }}>{checkoutWarning}</p>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setShowSuccessModal(false); setCheckoutWarning(''); }} className="btn btn-primary" style={{ flex: 1 }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          zIndex: 2000,
          animation: 'slideInUp 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          maxWidth: '300px'
        }}>
          {toastMessage}
        </div>
      )}
    </>
  );
}
