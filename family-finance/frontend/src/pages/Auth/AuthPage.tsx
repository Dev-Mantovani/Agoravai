import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Props { aoAutenticar: () => void; }

export default function PaginaAutenticacao({ aoAutenticar }: Props) {
  const [ehLogin, setEhLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const autenticar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true); setErro('');
    try {
      if (ehLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        aoAutenticar();
      } else {
        const { error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        alert('Conta criada! Faça login para continuar.');
        setEhLogin(true);
      }
    } catch (err: any) { setErro(err.message ?? 'Erro ao autenticar'); }
    finally { setCarregando(false); }
  };

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 14, outline: 'none',
    border: '1.5px solid #E5E7EB', fontSize: 15, fontFamily: "'DM Sans',sans-serif",
    background: '#F9FAFB', color: '#111827', boxSizing: 'border-box' as const,
    transition: 'border-color .2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 24px' }}>
      {/* Logo / ícone */}
      <div style={{ width: 72, height: 72, borderRadius: 24, background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 28, boxShadow: '0 8px 24px rgba(59,130,246,.35)' }}>
        💰
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', fontFamily: "'DM Sans',sans-serif", margin: '0 0 8px', textAlign: 'center' }}>
        {ehLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
      </h1>
      <p style={{ fontSize: 14, color: '#9CA3AF', fontFamily: "'DM Sans',sans-serif", margin: '0 0 32px', textAlign: 'center' }}>
        {ehLogin ? 'Entre para gerenciar suas finanças' : 'Comece a organizar suas finanças'}
      </p>

      {erro && (
        <div style={{ width: '100%', maxWidth: 380, background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '12px 16px', color: '#B91C1C', fontSize: 14, fontFamily: "'DM Sans',sans-serif", marginBottom: 16 }}>
          ⚠️ {erro}
        </div>
      )}

      <form onSubmit={autenticar} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 6 }}>Email</label>
          <input type="email" style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 6 }}>Senha</label>
          <input type="password" style={inp} value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required minLength={6} />
        </div>

        <button type="submit" disabled={carregando} style={{ padding: '15px', borderRadius: 14, border: 'none', cursor: carregando ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", opacity: carregando ? .7 : 1, marginTop: 4, boxShadow: '0 4px 16px rgba(59,130,246,.4)', transition: 'opacity .2s' }}>
          {carregando ? 'Carregando...' : (ehLogin ? 'Entrar' : 'Criar conta')}
        </button>

        <button type="button" onClick={() => setEhLogin(!ehLogin)} style={{ padding: '14px', borderRadius: 14, border: '1.5px solid #E5E7EB', cursor: 'pointer', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
          {ehLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
        </button>
      </form>
    </div>
  );
}
