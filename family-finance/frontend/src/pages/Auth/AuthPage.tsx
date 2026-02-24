import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AuthPage.module.css';

interface PropsAutenticacao {
  aoAutenticar: () => void;
}

export default function PaginaAutenticacao({ aoAutenticar }: PropsAutenticacao) {
  const [ehLogin, setEhLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const autenticar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

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
    } catch (err: any) {
      setErro(err.message ?? 'Erro ao autenticar');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{ehLogin ? 'Bem-vindo de volta!' : 'Criar conta'}</h1>
        <p className={styles.subtitle}>
          {ehLogin ? 'Entre para gerenciar suas finanças' : 'Comece a organizar suas finanças'}
        </p>

        {erro && <div className="error-message">{erro}</div>}

        <form onSubmit={autenticar} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={carregando}>
            {carregando ? 'Carregando...' : (ehLogin ? 'Entrar' : 'Criar conta')}
          </button>

          <button type="button" className="btn-secondary" onClick={() => setEhLogin(!ehLogin)}>
            {ehLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </form>
      </div>
    </div>
  );
}
