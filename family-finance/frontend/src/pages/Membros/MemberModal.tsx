import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import type { MembroFamilia, TipoRelacao } from '../../types';

interface Props { idUsuario: string; membro: MembroFamilia | null; aoFechar: () => void; aoSalvar: () => void; }
const CORES = ['#667eea','#2ed573','#ffc312','#ff4757','#764ba2','#26de81','#3B82F6','#F59E0B','#EF4444','#10B981'];
const RELACOES: { valor: TipoRelacao; rotulo: string }[] = [ {valor:'conjuge',rotulo:'Cônjuge'},{valor:'filho',rotulo:'Filho(a)'},{valor:'mae',rotulo:'Mãe'},{valor:'pai',rotulo:'Pai'},{valor:'irmao',rotulo:'Irmão(ã)'},{valor:'outro',rotulo:'Outro'} ];

export default function ModalMembro({ idUsuario, membro, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();
  const [nome, setNome] = useState(membro?.nome ?? '');
  const [relacao, setRelacao] = useState<TipoRelacao>(membro?.relacao ?? 'conjuge');
  const [cor, setCor] = useState(membro?.cor ?? '#667eea');

  const salvar = async () => {
    const dados = { user_id: idUsuario, nome, relacao, cor };
    if (membro) await supabase.from('family_members').update(dados).eq('id', membro.id);
    else await supabase.from('family_members').insert(dados);
    aoSalvar();
  };

  const inp = { width: '100%', padding: '13px 14px', borderRadius: 13, border: `1.5px solid ${cores.borda}`, fontSize: 15, fontFamily: "'DM Sans',sans-serif", background: cores.bgTerciario, color: cores.textoCorpo, outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }} onClick={aoFechar}>
      <div style={{ background: cores.bgCard, borderRadius: '24px 24px 0 0', padding: '28px 20px 40px', width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{membro ? 'Editar' : 'Novo'} Membro</div>
          <button onClick={aoFechar} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: cores.bgTerciario, cursor: 'pointer', fontSize: 18, color: cores.textoSutil }}>×</button>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 6 }}>Nome</label>
          <input style={inp} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João" />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 6 }}>Relação</label>
          <select style={{ ...inp, appearance: 'none' }} value={relacao} onChange={e => setRelacao(e.target.value as TipoRelacao)}>
            {RELACOES.map(r => <option key={r.valor} value={r.valor}>{r.rotulo}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 10 }}>Cor</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CORES.map(c => (
              <div key={c} onClick={() => setCor(c)} style={{ width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer', border: cor === c ? '3px solid #fff' : '3px solid transparent', boxShadow: cor === c ? `0 0 0 2px ${c}` : 'none', transition: 'all .15s' }} />
            ))}
          </div>
        </div>
        <button onClick={salvar} disabled={!nome} style={{ padding: '15px', borderRadius: 14, border: 'none', cursor: nome ? 'pointer' : 'not-allowed', background: nome ? 'linear-gradient(135deg,#3B82F6,#1D4ED8)' : cores.bgTerciario, color: nome ? '#fff' : cores.textoSutil, fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", marginTop: 4, boxShadow: nome ? '0 4px 14px rgba(59,130,246,.4)' : 'none', transition: 'all .2s' }}>
          {membro ? 'Atualizar' : 'Adicionar'} Membro
        </button>
      </div>
    </div>
  );
}
