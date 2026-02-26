import { useTema } from '../../contexts/TemaContexto';
import { useTamanhoTela } from '../../hooks/useTamanhoTela';
import { NOMES_MESES } from '../../utils/months';

interface Props {
  nomeUsuario?: string;
  mesAtual: number;
  anoAtual: number;
  aoMesAnterior: () => void;
  aoProximoMes: () => void;
  aoSair: () => void;
  mostrarMeses?: boolean;
}

const IconBell = () => (
  <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

// No desktop, o header fica só com meses no centro + sino — sem menu 3 pontos
export default function HeaderGlobal({ nomeUsuario, mesAtual, anoAtual, aoMesAnterior, aoProximoMes, aoSair, mostrarMeses = true }: Props) {
  const { cores, tema, alternarTema } = useTema();
  const { ehDesktop } = useTamanhoTela();

  const mesLabel     = `${NOMES_MESES[mesAtual-1].slice(0,3).toLowerCase()}/${String(anoAtual).slice(2)}`;
  const mesAntLabel  = mesAtual === 1 ? `${NOMES_MESES[11].slice(0,3).toLowerCase()}/${anoAtual-1}` : `${NOMES_MESES[mesAtual-2].slice(0,3).toLowerCase()}/${String(anoAtual).slice(2)}`;
  const mesProxLabel = mesAtual === 12 ? `${NOMES_MESES[0].slice(0,3).toLowerCase()}/${anoAtual+1}` : `${NOMES_MESES[mesAtual].slice(0,3).toLowerCase()}/${String(anoAtual).slice(2)}`;

  const btnIcon = {
    width: 38, height: 38, borderRadius: 11, border: 'none',
    background: cores.bgTerciario, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: cores.textoSutil, transition: 'background .2s', flexShrink: 0 as const,
  };

  // ── Desktop: barra fina com meses centralizados ──────────────────
  if (ehDesktop) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 60, right: 0, zIndex: 200, height: 64,
        background: cores.bgPrimario,
        borderBottom: `1px solid ${cores.borda}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        transition: 'background .3s, border-color .3s',
      }}>
        {/* Título da página / saudação discreta */}
        <div style={{ fontSize: 15, fontWeight: 600, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
          Olá, <span style={{ color: cores.textoTitulo }}>{nomeUsuario ?? 'Usuário'}</span> 👋
        </div>

        {/* Seletor de meses centralizado */}
        {mostrarMeses && (
          <div style={{ display: 'flex', background: cores.bgTerciario, borderRadius: 14, padding: 3, gap: 2 }}>
            {[
              { label: mesAntLabel, ativo: false, acao: aoMesAnterior },
              { label: mesLabel,    ativo: true,  acao: () => {} },
              { label: mesProxLabel,ativo: false, acao: aoProximoMes },
            ].map(({ label, ativo, acao }) => (
              <button key={label} onClick={acao} style={{
                padding: '8px 22px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: ativo ? cores.bgCard : 'transparent',
                color: ativo ? cores.textoTitulo : cores.textoSutil,
                fontWeight: ativo ? 700 : 400,
                fontSize: ativo ? 14 : 13,
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: ativo ? cores.sombra : 'none',
                transition: 'all .2s ease',
              }}>{label}</button>
            ))}
          </div>
        )}

        {/* Ações direita */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={alternarTema} style={{ ...btnIcon, fontSize: 17 }} title={tema === 'claro' ? 'Modo escuro' : 'Modo claro'}>
            {tema === 'claro' ? '🌙' : '☀️'}
          </button>
          <button style={btnIcon}><IconBell /></button>
        </div>
      </div>
    );
  }

  // ── Mobile: header original ──────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 200,
      background: cores.bgPrimario,
      borderBottom: `1px solid ${cores.borda}`,
      transition: 'background .3s ease, border-color .3s ease',
    }}>
      {/* Top row */}
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#FFB6C1,#FF69B4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#fff',
            boxShadow: '0 2px 8px rgba(255,105,180,.4)',
          }}>
            {(nomeUsuario?.[0] ?? 'U').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>Bem-vindo de volta!</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 3, lineHeight: 1 }}>
              Olá, {nomeUsuario ?? 'Usuário'}! 👋
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={alternarTema} style={{ ...btnIcon, fontSize: 17 }}>{tema === 'claro' ? '🌙' : '☀️'}</button>
          <button style={btnIcon}><IconBell /></button>
        </div>
      </div>

      {/* Meses mobile */}
      {mostrarMeses && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ display: 'flex', background: cores.bgTerciario, borderRadius: 14, padding: 3, gap: 2 }}>
            {[
              { label: mesAntLabel, ativo: false, acao: aoMesAnterior },
              { label: mesLabel,    ativo: true,  acao: () => {} },
              { label: mesProxLabel,ativo: false, acao: aoProximoMes },
            ].map(({ label, ativo, acao }) => (
              <button key={label} onClick={acao} style={{
                flex: 1, padding: '8px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
                background: ativo ? cores.bgCard : 'transparent',
                color: ativo ? cores.textoTitulo : cores.textoSutil,
                fontWeight: ativo ? 700 : 400, fontSize: ativo ? 14 : 12,
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: ativo ? cores.sombra : 'none',
                transition: 'all .2s ease',
              }}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
