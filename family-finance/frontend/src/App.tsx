import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Componentes
import Cabecalho from './components/Header/Header';
import NavegacaoInferior from './components/BottomNav/BottomNav';
import TelaDeCarga from './components/LoadingScreen/LoadingScreen';

// Páginas
import PaginaDashboard from './pages/Dashboard/DashboardPage';
import PaginaReceitas from './pages/Receitas/ReceitasPage';
import PaginaDespesas from './pages/Despesas/DespesasPage';
import PaginaMembros from './pages/Membros/MembrosPage';
import PaginaAutenticacao from './pages/Auth/AuthPage';
import PaginaOnboarding from './pages/Onboarding/OnboardingPage';

// Estilos
import './styles/globals.css';

// Tipos
import type { Usuario } from './types';

type Tela = 'dashboard' | 'receitas' | 'despesas' | 'membros';

export default function App() {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState<Tela>('dashboard');
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  useEffect(() => {
    verificarUsuario();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (sessao?.user) {
        setUsuarioAtual({ id: sessao.user.id, email: sessao.user.email! });
      } else {
        setUsuarioAtual(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const verificarUsuario = async () => {
    try {
      const { data: { session: sessao }, error: erro } = await supabase.auth.getSession();
      if (erro) throw erro;
      if (!sessao?.user) { setUsuarioAtual(null); return; }

      const { data: perfil } = await supabase
        .from('users_profile')
        .select('nome, onboarding_completed')
        .eq('id', sessao.user.id)
        .maybeSingle();

      setUsuarioAtual({ id: sessao.user.id, email: sessao.user.email!, nome: perfil?.nome });

      if (!perfil?.onboarding_completed) setMostrarOnboarding(true);
    } catch (erro) {
      console.error(erro);
      setUsuarioAtual(null);
    } finally {
      setCarregando(false);
    }
  };

  const fazerLogout = async () => {
    await supabase.auth.signOut();
    setUsuarioAtual(null);
    setMostrarOnboarding(false);
  };

  const irMesAnterior = () => {
    if (mesAtual === 1) { setMesAtual(12); setAnoAtual((a) => a - 1); }
    else setMesAtual((m) => m - 1);
  };

  const irProximoMes = () => {
    if (mesAtual === 12) { setMesAtual(1); setAnoAtual((a) => a + 1); }
    else setMesAtual((m) => m + 1);
  };

  if (carregando) return <TelaDeCarga />;
  if (!usuarioAtual) return <PaginaAutenticacao aoAutenticar={verificarUsuario} />;
  if (mostrarOnboarding) return (
    <PaginaOnboarding
      idUsuario={usuarioAtual.id}
      aoConcluir={() => { setMostrarOnboarding(false); verificarUsuario(); }}
    />
  );

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: 'linear-gradient(180deg, #16213e 0%, #0f0f1e 100%)', position: 'relative' }}>
      <Cabecalho
        usuario={usuarioAtual}
        aoSair={fazerLogout}
        mesAtual={mesAtual}
        anoAtual={anoAtual}
        aoMesAnterior={irMesAnterior}
        aoProximoMes={irProximoMes}
      />

      {telaAtiva === 'dashboard' && (
        <PaginaDashboard idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} />
      )}
      {telaAtiva === 'receitas' && (
        <PaginaReceitas idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} />
      )}
      {telaAtiva === 'despesas' && (
        <PaginaDespesas idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} />
      )}
      {telaAtiva === 'membros' && (
        <PaginaMembros idUsuario={usuarioAtual.id} />
      )}

      <NavegacaoInferior telaAtiva={telaAtiva} definirTela={setTelaAtiva} />
    </div>
  );
}
