import { useEffect, useState, type ReactNode } from 'react';
import { useTema } from '../../contexts/TemaContexto';
import { useTamanhoTela } from '../../hooks/useTamanhoTela';

interface Props { titulo: string; aoFechar: () => void; children: ReactNode; }

export default function Modal({ titulo, aoFechar, children }: Props) {
  const { cores } = useTema();
  const { ehDesktop } = useTamanhoTela();
  const [visivel, setVisivel] = useState(false);

  // Animação de entrada
  useEffect(() => { requestAnimationFrame(() => setVisivel(true)); }, []);

  const fecharComAnimacao = () => {
    setVisivel(false);
    setTimeout(aoFechar, 200);
  };

  return (
    <div
      onClick={fecharComAnimacao}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex',
        alignItems: ehDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        background: visivel ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,0)',
        transition: 'background .2s ease',
        padding: ehDesktop ? 24 : 0,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: cores.bgCard,
          borderRadius: ehDesktop ? 24 : '24px 24px 0 0',
          width: '100%',
          maxWidth: ehDesktop ? 520 : 430,
          maxHeight: ehDesktop ? '88vh' : '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          // Animação: slide up mobile, scale desktop
          opacity: visivel ? 1 : 0,
          transform: ehDesktop
            ? (visivel ? 'scale(1) translateY(0)' : 'scale(.96) translateY(8px)')
            : (visivel ? 'translateY(0)' : 'translateY(100%)'),
          transition: 'opacity .22s ease, transform .22s ease',
          boxShadow: ehDesktop ? '0 24px 60px rgba(0,0,0,.22)' : '0 -4px 30px rgba(0,0,0,.14)',
        }}
      >
        {/* Header do modal */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 20px 0', position: 'sticky', top: 0,
          background: cores.bgCard, zIndex: 10,
          borderBottom: `1px solid ${cores.borda}`,
          paddingBottom: 16, marginBottom: 0,
        }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>
            {titulo}
          </div>
          <button onClick={fecharComAnimacao} style={{
            width: 34, height: 34, borderRadius: 10, border: 'none',
            background: cores.bgTerciario, cursor: 'pointer',
            fontSize: 20, color: cores.textoSutil, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Conteúdo scrollável */}
        <div style={{ padding: '20px 20px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
