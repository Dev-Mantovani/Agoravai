import type { ReactNode } from 'react';
import { useTema } from '../../contexts/TemaContexto';

interface Props { titulo: string; aoFechar: () => void; children: ReactNode; }

export default function Modal({ titulo, aoFechar, children }: Props) {
  const { cores } = useTema();
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }} onClick={aoFechar}>
      <div style={{ background: cores.bgCard, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{titulo}</div>
          <button onClick={aoFechar} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: cores.bgTerciario, cursor: 'pointer', fontSize: 18, color: cores.textoSutil }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
