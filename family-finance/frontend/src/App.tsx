import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { ProvedorTema, useTema } from './contexts/TemaContexto';
import { useTamanhoTela } from './hooks/useTamanhoTela';

import Sidebar from './components/Sidebar/Sidebar';
import HeaderGlobal from './components/HeaderGlobal/HeaderGlobal';
import NavegacaoInferior from './components/BottomNav/BottomNav';
import TelaDeCarga from './components/LoadingScreen/LoadingScreen';
import PaginaDashboard from './pages/Dashboard/DashboardPage';
import PaginaTransacoes from './pages/Transacoes/TransacoesPage';
import PaginaRelatorios from './pages/Relatorios/RelatoriosPage';
import PaginaMembros from './pages/Membros/MembrosPage';
import PaginaAutenticacao from './pages/Auth/AuthPage';
import PaginaOnboarding from './pages/Onboarding/OnboardingPage';

import type { Usuario } from './types';

type Tela = 'dashboard' | 'transacoes' | 'relatorios' | 'membros';

function AppInterno() {
  const { cores, tema, alternarTema } = useTema();
  const { ehDesktop } = useTamanhoTela();
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState<Tela>('dashboard');
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [visivel, setVisivel] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    verificarUsuario();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sessao) => {
      if (sessao?.user) setUsuarioAtual({ id: sessao.user.id, email: sessao.user.email! });
      else setUsuarioAtual(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const verificarUsuario = async () => {
    try {
      const { data: { session: sessao } } = await supabase.auth.getSession();
      if (!sessao?.user) { setUsuarioAtual(null); return; }
      const { data: perfil } = await supabase.from('users_profile').select('nome, onboarding_completed').eq('id', sessao.user.id).maybeSingle();
      setUsuarioAtual({ id: sessao.user.id, email: sessao.user.email!, nome: perfil?.nome });
      if (!perfil?.onboarding_completed) setMostrarOnboarding(true);
    } catch (e) { console.error(e); setUsuarioAtual(null); }
    finally { setCarregando(false); }
  };

  const fazerLogout = async () => { await supabase.auth.signOut(); setUsuarioAtual(null); setMostrarOnboarding(false); };

  const trocarMes = (novoMes: number, novoAno: number) => {
    if (atualizando) return;
    setAtualizando(true); setVisivel(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setMesAtual(novoMes); setAnoAtual(novoAno); setVisivel(true); setAtualizando(false); }, 180);
  };

  const irMesAnterior = () => trocarMes(mesAtual === 1 ? 12 : mesAtual - 1, mesAtual === 1 ? anoAtual - 1 : anoAtual);
  const irProximoMes  = () => trocarMes(mesAtual === 12 ? 1 : mesAtual + 1, mesAtual === 12 ? anoAtual + 1 : anoAtual);

  const mudarTela = (tela: Tela) => {
    if (tela === telaAtiva) return;
    setVisivel(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setTelaAtiva(tela); setVisivel(true); }, 150);
  };

  if (carregando) return <TelaDeCarga />;
  if (!usuarioAtual) return <PaginaAutenticacao aoAutenticar={verificarUsuario} />;
  if (mostrarOnboarding) return <PaginaOnboarding idUsuario={usuarioAtual.id} aoConcluir={() => { setMostrarOnboarding(false); verificarUsuario(); }} />;

  // Altura do topbar mobile
  const HEADER_H_MOBILE = telaAtiva === 'membros' || telaAtiva === 'relatorios' ? 80 : 130;

  return (
    <div style={{
      minHeight: '100vh',
      background: cores.bgPrimario,
      transition: 'background .3s ease',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── DESKTOP: Sidebar esquerda + topbar ── */}
      {ehDesktop && (
        <>
          <Sidebar
            telaAtiva={telaAtiva}
            definirTela={mudarTela}
            nomeUsuario={usuarioAtual.nome}
            aoSair={fazerLogout}
            alternarTema={alternarTema}
            tema={tema}
          />
          <HeaderGlobal
            nomeUsuario={usuarioAtual.nome}
            mesAtual={mesAtual}
            anoAtual={anoAtual}
            aoMesAnterior={irMesAnterior}
            aoProximoMes={irProximoMes}
            aoSair={fazerLogout}
            mostrarMeses={telaAtiva !== 'membros'}
          />
          {/* Conteúdo desktop: respeitando sidebar (60px) + topbar (64px) */}
          <div style={{
            marginLeft: 60,
            paddingTop: 64,
            paddingBottom: 32,
            opacity: visivel ? 1 : 0,
            transform: visivel ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity .2s ease, transform .2s ease',
          }}>
            {telaAtiva === 'dashboard'  && <PaginaDashboard  idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} />}
            {telaAtiva === 'transacoes' && <PaginaTransacoes idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} aoMudarMes={trocarMes} />}
            {telaAtiva === 'relatorios' && <PaginaRelatorios idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} />}
            {telaAtiva === 'membros'    && <PaginaMembros    idUsuario={usuarioAtual.id} />}
          </div>
        </>
      )}

      {/* ── MOBILE: Header topo + nav inferior ── */}
      {!ehDesktop && (
        <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
          <HeaderGlobal
            nomeUsuario={usuarioAtual.nome}
            mesAtual={mesAtual}
            anoAtual={anoAtual}
            aoMesAnterior={irMesAnterior}
            aoProximoMes={irProximoMes}
            aoSair={fazerLogout}
            mostrarMeses={telaAtiva !== 'membros'}
          />
          <div style={{
            paddingTop: HEADER_H_MOBILE,
            paddingBottom: 80,
            opacity: visivel ? 1 : 0,
            transform: visivel ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity .2s ease, transform .2s ease',
          }}>
            {telaAtiva === 'dashboard'  && <PaginaDashboard  idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} />}
            {telaAtiva === 'transacoes' && <PaginaTransacoes idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} aoMudarMes={trocarMes} />}
            {telaAtiva === 'relatorios' && <PaginaRelatorios idUsuario={usuarioAtual.id} mesAtual={mesAtual} anoAtual={anoAtual} />}
            {telaAtiva === 'membros'    && <PaginaMembros    idUsuario={usuarioAtual.id} />}
          </div>
          <NavegacaoInferior telaAtiva={telaAtiva} definirTela={mudarTela} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <ProvedorTema><AppInterno /></ProvedorTema>;
}
