import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AuthPage.module.css';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Conta criada! Faça login para continuar.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}</h1>
        <p className={styles.subtitle}>
          {isLogin ? 'Entre para gerenciar suas finanças' : 'Comece a organizar suas finanças'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleAuth} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta')}
          </button>

          <button type="button" className="btn-secondary" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </form>
      </div>
    </div>
  );
}
