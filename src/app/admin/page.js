"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, LogOut } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stock: 0,
    costPrice: 0,
    cashPrice: 0,
    transferPrice: 0,
    image: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status, router]);


  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['stock', 'costPrice', 'cashPrice', 'transferPrice'].includes(name) 
        ? Number(value) 
        : value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      stock: 0,
      costPrice: 0,
      cashPrice: 0,
      transferPrice: 0,
      image: ''
    });
    setEditingId(null);
  };

  const handleEdit = (product) => {
    setFormData({ ...product });
    setEditingId(product.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      
      await fetchProducts();
      resetForm();
    } catch (err) {
      console.error("Failed to save product", err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    setLoading(true);
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      await fetchProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="admin-header">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Panel de Administración</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestiona los productos de tu catálogo</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/" className="btn btn-secondary">
            <ArrowLeft size={18} />
            Volver al Catálogo
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-danger">
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="card animate-fade-in">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {editingId ? <Edit size={20} /> : <Plus size={20} />}
          {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre del Producto</label>
              <input 
                type="text" 
                className="form-control" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock / Cantidad</label>
              <input 
                type="number" 
                className="form-control" 
                name="stock" 
                value={formData.stock} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input 
              type="text" 
              className="form-control" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Precio de Lista (Costo)</label>
              <input 
                type="number" 
                className="form-control" 
                name="costPrice" 
                value={formData.costPrice} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio Efectivo</label>
              <input 
                type="number" 
                className="form-control" 
                name="cashPrice" 
                value={formData.cashPrice} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Precio Transferencia</label>
              <input 
                type="number" 
                className="form-control" 
                name="transferPrice" 
                value={formData.transferPrice} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">URL de la Imagen (opcional)</label>
            <input 
              type="url" 
              className="form-control" 
              name="image" 
              value={formData.image || ''} 
              onChange={handleInputChange} 
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto' }}>
              <Save size={18} />
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ width: 'auto' }}>
                <X size={18} />
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Productos Existentes</h2>
        
        {loading && !products.length ? (
          <div className="loader-container" style={{ minHeight: '200px' }}>
            <div className="loader"></div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem 0' }}>Nombre</th>
                  <th>Stock</th>
                  <th>Costo</th>
                  <th>Efectivo</th>
                  <th>Transferencia</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(48, 54, 61, 0.5)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: '600' }}>{product.name}</td>
                    <td>{product.stock}</td>
                    <td>${product.costPrice}</td>
                    <td>${product.cashPrice}</td>
                    <td>${product.transferPrice}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleEdit(product)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem', width: 'auto' }}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="btn btn-danger"
                          style={{ padding: '0.5rem', width: 'auto' }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!products.length && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                      No hay productos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
