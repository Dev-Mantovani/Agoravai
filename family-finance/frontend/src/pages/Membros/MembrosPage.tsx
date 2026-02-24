import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import ModalMembro from './MemberModal';
import type { MembroFamilia } from '../../types';

interface Props { idUsuario: string; }

const ROTULOS_RELACAO: Record<string, string> = { conjuge:'Cônjuge', filho:'Filho(a)', mae:'Mãe', pai:'Pai', irmao:'Irmão(ã)', outro:'Outro' };

export default function PaginaMembros({ idUsuario }: Props) {
  const { cores } = useTema();
  const [membros, setMembros] = useState<MembroFamilia[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoMembro, setEditandoMembro] = useState<MembroFamilia | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregarMembros(); }, [idUsuario]);

  const carregarMembros = async () => {
    setCarregando(true);
    const { data } = await supabase.from('family_members').select('*').eq('user_id', idUsuario);
    if (data) setMembros(data);
    setCarregando(false);
  };

  const excluir = async (id: string) => {
    if (!window.confirm('Deseja excluir este membro?')) return;
    await supabase.from('family_members').delete().eq('id', id);
    carregarMembros();
  };

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', padding: '20px 16px', transition: 'background .3s' }}>
      {/* Título da página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>Família</div>
          <div style={{ fontSize: 13, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>
            {membros.length} membro{membros.length !== 1 ? 's' : ''} cadastrado{membros.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={() => { setEditandoMembro(null); setMostrarModal(true); }} style={{ padding: '10px 18px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 14px rgba(59,130,246,.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
          + Adicionar
        </button>
      </div>

      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${cores.bgTerciario}`, borderTop: `3px solid ${cores.azulPrimario}`, animation: 'spin .8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : membros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: cores.textoCorpo, marginBottom: 8 }}>Nenhum membro ainda</div>
          <div style={{ fontSize: 13, color: cores.textoSutil }}>Adicione as pessoas que dividem as finanças com você</div>
          <button onClick={() => { setEditandoMembro(null); setMostrarModal(true); }} style={{ marginTop: 24, padding: '12px 28px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", boxShadow: '0 4px 14px rgba(59,130,246,.4)' }}>
            Adicionar primeiro membro
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {membros.map(m => (
            <div key={m.id} style={{ background: cores.bgCard, borderRadius: 20, padding: '20px 16px', border: `1px solid ${cores.borda}`, boxShadow: cores.sombra, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', transition: 'background .3s' }}>
              {/* Avatar */}
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: m.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', boxShadow: `0 4px 14px ${m.cor}55` }}>
                {m.nome[0].toUpperCase()}
              </div>
              {/* Nome */}
              <div style={{ fontSize: 16, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>{m.nome}</div>
              {/* Relação badge */}
              <div style={{ fontSize: 12, fontWeight: 600, color: cores.azulPrimario, background: cores.azulFundo, padding: '4px 12px', borderRadius: 99, fontFamily: "'DM Sans',sans-serif" }}>
                {ROTULOS_RELACAO[m.relacao] ?? m.relacao}
              </div>
              {/* Ações */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => { setEditandoMembro(m); setMostrarModal(true); }} style={{ width: 36, height: 36, borderRadius: 11, border: 'none', background: cores.bgTerciario, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>✏️</button>
                <button onClick={() => excluir(m.id)} style={{ width: 36, height: 36, borderRadius: 11, border: 'none', background: cores.vermelhFundo, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <ModalMembro
          idUsuario={idUsuario}
          membro={editandoMembro}
          aoFechar={() => { setMostrarModal(false); setEditandoMembro(null); }}
          aoSalvar={() => { carregarMembros(); setMostrarModal(false); setEditandoMembro(null); }}
        />
      )}
    </div>
  );
}
