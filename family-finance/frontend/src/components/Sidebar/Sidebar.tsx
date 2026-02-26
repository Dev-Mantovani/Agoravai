import { useState } from 'react';
import { useTema } from '../../contexts/TemaContexto';

type Tela = 'dashboard' | 'transacoes' | 'relatorios' | 'membros';

interface Props {
  telaAtiva: Tela;
  definirTela: (t: Tela) => void;
  nomeUsuario?: string;
  aoSair: () => void;
  alternarTema: () => void;
  tema: 'claro' | 'escuro';
}

const IconHome = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconList = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconSettings = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ITENS: { id: Tela | 'sair'; icone: React.ReactNode; rotulo: string; separador?: boolean }[] = [
  { id: 'dashboard',  icone: <IconHome />,    rotulo: 'Início' },
  { id: 'transacoes', icone: <IconList />,    rotulo: 'Transações' },
  { id: 'relatorios', icone: <IconChart />,   rotulo: 'Relatórios' },
  { id: 'membros',    icone: <IconUsers />,   rotulo: 'Família' },
];

const LARGURA_RECOLHIDA = 60;
const LARGURA_EXPANDIDA = 220;

export default function Sidebar({ telaAtiva, definirTela, nomeUsuario, aoSair, alternarTema, tema }: Props) {
  const { cores } = useTema();
  const [expandido, setExpandido] = useState(false);

  const largura = expandido ? LARGURA_EXPANDIDA : LARGURA_RECOLHIDA;

  return (
    <div
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={() => setExpandido(false)}
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 300,
        width: largura,
        background: cores.bgCard,
        borderRight: `1px solid ${cores.borda}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width .22s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        boxShadow: expandido ? '4px 0 24px rgba(0,0,0,.08)' : 'none',
      }}
    >
      {/* Logo / avatar no topo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 18px', gap: 12, flexShrink: 0,
        borderBottom: `1px solid ${cores.borda}`,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#FFB6C1,#FF69B4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#fff',
          boxShadow: '0 2px 8px rgba(255,105,180,.4)',
        }}>
          {(nomeUsuario?.[0] ?? 'U').toUpperCase()}
        </div>
        <div style={{
          opacity: expandido ? 1 : 0,
          transform: expandido ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'opacity .18s ease, transform .18s ease',
          whiteSpace: 'nowrap', minWidth: 0,
        }}>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>Bem-vindo</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 2, lineHeight: 1 }}>
            {nomeUsuario ?? 'Usuário'}
          </div>
        </div>
      </div>

      {/* Itens de navegação */}
      <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ITENS.map(item => {
          const ativo = telaAtiva === item.id;
          return (
            <button
              key={item.id}
              onClick={() => definirTela(item.id as Tela)}
              title={!expandido ? item.rotulo : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 18px', border: 'none', cursor: 'pointer',
                background: ativo ? cores.azulFundo : 'transparent',
                color: ativo ? cores.azulPrimario : cores.textoSutil,
                borderRadius: '0 10px 10px 0',
                marginRight: 8,
                transition: 'background .15s, color .15s',
                width: '100%', textAlign: 'left',
                whiteSpace: 'nowrap', overflow: 'hidden',
                borderLeft: ativo ? `3px solid ${cores.azulPrimario}` : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = cores.bgTerciario; }}
              onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icone}</span>
              <span style={{
                fontSize: 14, fontWeight: ativo ? 700 : 500,
                fontFamily: "'DM Sans',sans-serif",
                opacity: expandido ? 1 : 0,
                transform: expandido ? 'translateX(0)' : 'translateX(-6px)',
                transition: 'opacity .16s ease, transform .16s ease',
              }}>
                {item.rotulo}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Rodapé: dark mode + sair */}
      <div style={{ padding: '12px 0', borderTop: `1px solid ${cores.borda}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Dark mode toggle */}
        <button
          onClick={alternarTema}
          title={!expandido ? (tema === 'claro' ? 'Modo escuro' : 'Modo claro') : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 18px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: cores.textoSutil,
            width: '100%', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
            transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = cores.bgTerciario}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ flexShrink: 0, fontSize: 20, lineHeight: 1 }}>{tema === 'claro' ? '🌙' : '☀️'}</span>
          <span style={{
            fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
            opacity: expandido ? 1 : 0,
            transform: expandido ? 'translateX(0)' : 'translateX(-6px)',
            transition: 'opacity .16s ease, transform .16s ease',
          }}>
            {tema === 'claro' ? 'Modo escuro' : 'Modo claro'}
          </span>
        </button>

        {/* Sair */}
        <button
          onClick={aoSair}
          title={!expandido ? 'Sair' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 18px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#EF4444',
            width: '100%', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
            transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFF1F2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}><IconLogout /></span>
          <span style={{
            fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
            opacity: expandido ? 1 : 0,
            transform: expandido ? 'translateX(0)' : 'translateX(-6px)',
            transition: 'opacity .16s ease, transform .16s ease',
          }}>
            Sair
          </span>
        </button>
      </div>
    </div>
  );
}
