import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import ModalMembro from './MemberModal';
import type { MembroFamilia } from '../../types';

interface Props { idUsuario: string; }

const ROTULOS: Record<string, string> = {
  conjuge: 'Cônjuge', filho: 'Filho(a)', mae: 'Mãe',
  pai: 'Pai', irmao: 'Irmão(ã)', outro: 'Outro',
};
const EMOJIS: Record<string, string> = {
  conjuge: '💑', filho: '👶', mae: '👩',
  pai: '👨', irmao: '🧑', outro: '👤',
};

export default function PaginaMembros({ idUsuario }: Props) {
  const { cores } = useTema();
  const [membros,      setMembros]      = useState<MembroFamilia[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando,     setEditando]     = useState<MembroFamilia | null>(null);
  const [carregando,   setCarregando]   = useState(true);

  useEffect(() => { carregar(); }, [idUsuario]);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase
      .from('family_members').select('*').eq('user_id', idUsuario);
    if (data) setMembros(data);
    setCarregando(false);
  };

  const excluir = async (id: string) => {
    if (!window.confirm('Excluir este membro?')) return;
    await supabase.from('family_members').delete().eq('id', id);
    carregar();
  };

  const abrirNovo = () => { setEditando(null); setMostrarModal(true); };
  const abrirEditar = (m: MembroFamilia) => { setEditando(m); setMostrarModal(true); };
  const fecharModal = () => { setMostrarModal(false); setEditando(null); };
  const salvoModal  = () => { carregar(); fecharModal(); };

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', padding: '20px 16px 96px', transition: 'background .3s' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
            👨‍👩‍👧‍👦 Membros
          </div>
          <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 3 }}>
            {membros.length} membro{membros.length !== 1 ? 's' : ''} cadastrado{membros.length !== 1 ? 's' : ''}
          </div>
        </div>

        <button
          onClick={abrirNovo}
          style={{
            padding: '10px 18px', borderRadius: 14,
            border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: '0 4px 14px rgba(59,130,246,.4)',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'transform .15s, box-shadow .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(59,130,246,.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,.4)'; }}
        >
          <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Adicionar
        </button>
      </div>

      {/* Loading */}
      {carregando && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid ${cores.bgTerciario}`,
            borderTop: `3px solid #3b82f6`,
            animation: 'spin .8s linear infinite',
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Empty state */}
      {!carregando && membros.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', fontFamily: "'DM Sans',sans-serif" }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: cores.textoCorpo, marginBottom: 8 }}>
            Nenhum membro ainda
          </div>
          <div style={{ fontSize: 13, color: cores.textoSutil, maxWidth: 260, margin: '0 auto 28px' }}>
            Adicione quem divide as finanças com você
          </div>
          <button
            onClick={abrirNovo}
            style={{
              padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: '0 4px 16px rgba(59,130,246,.4)',
            }}
          >
            Adicionar primeiro membro
          </button>
        </div>
      )}

      {/* Grid */}
      {!carregando && membros.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {membros.map(m => (
            <MemberCard
              key={m.id}
              membro={m}
              cores={cores}
              onEditar={() => abrirEditar(m)}
              onExcluir={() => excluir(m.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <ModalMembro
          idUsuario={idUsuario}
          membro={editando}
          aoFechar={fecharModal}
          aoSalvar={salvoModal}
        />
      )}
    </div>
  );
}

/* ── Card individual de membro ── */
interface CardProps {
  membro: MembroFamilia;
  cores: any;
  onEditar: () => void;
  onExcluir: () => void;
}

function MemberCard({ membro: m, cores, onEditar, onExcluir }: CardProps) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: cores.bgCard,
        borderRadius: 22,
        border: `1px solid ${hov ? m.cor + '55' : cores.borda}`,
        padding: '22px 14px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        boxShadow: hov ? `0 10px 28px ${m.cor}22` : cores.sombra,
        transition: 'all .25s',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        position: 'relative',
      }}
    >
      {/* Avatar com foto ou inicial */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        background: m.avatar_url ? '#000' : m.cor,
        boxShadow: `0 0 0 3px ${cores.bgCard}, 0 0 0 5px ${m.cor}44, 0 8px 20px ${m.cor}44`,
        transition: 'box-shadow .25s',
      }}>
        {m.avatar_url
          ? <img src={m.avatar_url} alt={m.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: '#fff',
              fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
            }}>
              {m.nome[0].toUpperCase()}
            </div>
        }
      </div>

      {/* Nome */}
      <div style={{
        fontSize: 15, fontWeight: 800, color: cores.textoTitulo,
        fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
        textAlign: 'center', lineHeight: 1.2,
      }}>
        {m.nome}
      </div>

      {/* Badge relação */}
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: m.cor,
        background: `${m.cor}18`,
        padding: '5px 12px', borderRadius: 99,
        fontFamily: "'DM Sans',sans-serif",
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ fontSize: 13 }}>
          {({ conjuge:'💑', filho:'👶', mae:'👩', pai:'👨', irmao:'🧑', outro:'👤' } as any)[m.relacao] ?? '👤'}
        </span>
        {({ conjuge:'Cônjuge', filho:'Filho(a)', mae:'Mãe', pai:'Pai', irmao:'Irmão(ã)', outro:'Outro' } as any)[m.relacao] ?? m.relacao}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {/* Editar */}
        <button
          onClick={onEditar}
          title="Editar"
          style={{
            width: 38, height: 38, borderRadius: 12,
            border: 'none', background: cores.bgTerciario,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .18s, transform .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${m.cor}22`; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = cores.bgTerciario; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg width="15" height="15" fill="none" stroke={m.cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>

        {/* Excluir */}
        <button
          onClick={onExcluir}
          title="Excluir"
          style={{
            width: 38, height: 38, borderRadius: 12,
            border: 'none', background: cores.vermelhFundo,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .18s, transform .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg width="14" height="14" fill="none" stroke={cores.vermelhoTexto} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
