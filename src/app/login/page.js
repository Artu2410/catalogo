"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Mail, Lock, User, ArrowLeft } from "lucide-react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    if (isRegister) {
      // Handle Registration
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
          setIsRegister(false);
          setPassword("");
        } else {
          setError(data.error || "Error al registrarse");
        }
      } catch (err) {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    } else {
      // Handle Login
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      if (res?.error) {
        setError("Credenciales inválidas. Por favor intenta de nuevo.");
        setLoading(false);
      } else {
        router.push("/admin");
      }
    }
  };

  const handleOAuth = (provider) => {
    signIn(provider.toLowerCase(), { callbackUrl: "/admin" });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card animate-fade-in" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" className="logo" style={{ justifyContent: 'center', marginBottom: '1rem', fontSize: '2rem', display: 'flex' }}>
            <img src="/images/logo.png" alt="KAREH Logo" style={{ height: '48px', width: 'auto' }} />
            KAREH
          </Link>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Completa tus datos para registrarte' : 'Ingresa a tu cuenta para continuar'}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(248, 81, 73, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(46, 160, 67, 0.1)', color: 'var(--success-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={loading}>
            {loading ? (isRegister ? 'Registrando...' : 'Iniciando...') : (isRegister ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button 
            type="button" 
            onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }}
            style={{ color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: '600' }}
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>

        {!isRegister && (
          <>
            <div style={{ position: 'relative', textAlign: 'center', margin: '2rem 0' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
              <span style={{ position: 'relative', backgroundColor: 'var(--secondary-color)', padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', zIndex: 1 }}>
                O iniciar con
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => handleOAuth("Google")} style={{ gap: '0.5rem' }}>
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '18px' }} />
                Google
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleOAuth("Facebook")} style={{ gap: '0.5rem' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" style={{ width: '18px' }} />
                Facebook
              </button>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9rem' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

