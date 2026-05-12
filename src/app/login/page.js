"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
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
  };

  const handleOAuth = (provider) => {
    if (provider === "Google") {
      signIn("google", { callbackUrl: "/admin" });
    } else if (provider === "Facebook") {
      signIn("facebook", { callbackUrl: "/admin" });
    } else if (provider === "Outlook") {
      signIn("azure-ad", { callbackUrl: "/admin" });
    } else {
      alert(`La autenticación con ${provider} requiere un servicio de SMS (como Twilio o Firebase) para enviar códigos al celular. Por ahora, usa las otras opciones.`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem', fontSize: '2rem' }}>
            <img src="/images/logo.png" alt="KAREH Logo" style={{ height: '48px', width: 'auto' }} />
            KAREH
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Iniciar Sesión</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ingresa a tu cuenta para continuar</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(248, 81, 73, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ position: 'relative', textAlign: 'center', margin: '2rem 0' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
          <span style={{ position: 'relative', backgroundColor: 'var(--secondary-color)', padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', zIndex: 1 }}>
            O continuar con
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => handleOAuth("Google")}>
            Google
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => handleOAuth("Facebook")}>
            Facebook
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => handleOAuth("Outlook")}>
            Outlook
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => handleOAuth("Teléfono")}>
            Teléfono
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <Link href="/" style={{ color: 'var(--accent-color)' }}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
