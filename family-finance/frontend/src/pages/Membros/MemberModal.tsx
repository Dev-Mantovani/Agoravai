import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import type { MembroFamilia, TipoRelacao } from '../../types';

interface Props {
  idUsuario: string;
  membro: MembroFamilia | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}

const CORES_AVATAR = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#a855f7', '#84cc16',
];

const RELACOES: { valor: TipoRelacao; rotulo: string; emoji: string }[] = [
  { valor: 'conjuge', rotulo: 'Cônjuge',  emoji: '💑' },
  { valor: 'filho',   rotulo: 'Filho(a)', emoji: '👶' },
  { valor: 'mae',     rotulo: 'Mãe',      emoji: '👩' },
  { valor: 'pai',     rotulo: 'Pai',      emoji: '👨' },
  { valor: 'irmao',   rotulo: 'Irmão(ã)',emoji: '🧑' },
  { valor: 'outro',   rotulo: 'Outro',    emoji: '👤' },
];

export default function ModalMembro({ idUsuario, membro, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();

  const [nome,     setNome]     = useState(membro?.nome    ?? '');
  const [relacao,  setRelacao]  = useState<TipoRelacao>(membro?.relacao ?? 'conjuge');
  const [cor,      setCor]      = useState(membro?.cor     ?? '#6366f1');
  const [fotoPreview, setFotoPreview] = useState<string | null>(membro?.avatar_url ?? null);
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  /* ── upload de foto ── */
  const aoSelecionarFoto = (arquivo: File, preview: string) => {
    setArquivoFoto(arquivo);
    setFotoPreview(preview);
  };

  const aoRemoverFoto = () => {
    setArquivoFoto(null);
    setFotoPreview(null);
  };

  /* ── salvar ── */
  const salvar = async () => {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      let avatarUrl: string | null = membro?.avatar_url ?? null;

      // Upload de nova foto
      if (arquivoFoto) {
        const ext    = arquivoFoto.name.split('.').pop() ?? 'jpg';
        const caminho = `${idUsuario}/${Date.now()}.${ext}`;
        const { error: errUpload } = await supabase.storage
          .from('avatars')
          .upload(caminho, arquivoFoto, { upsert: true, cacheControl: '3600' });
        if (!errUpload) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
          avatarUrl = data.publicUrl;
        }
      }

      // Foto removida manualmente
      if (!fotoPreview && !arquivoFoto) avatarUrl = null;

      if (membro) {
        // UPDATE: nunca enviar user_id no body — causa 400 Bad Request
        const { error: errUpdate } = await supabase
          .from('family_members')
          .update({ nome: nome.trim(), relacao, cor, avatar_url: avatarUrl })
          .eq('id', membro.id);
        if (errUpdate) throw errUpdate;
      } else {
        // INSERT: user_id obrigatório
        const { error: errInsert } = await supabase
          .from('family_members')
          .insert({ user_id: idUsuario, nome: nome.trim(), relacao, cor, avatar_url: avatarUrl });
        if (errInsert) throw errInsert;
      }

      aoSalvar();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const coresAvatarPicker = {
    bgCard:       cores.bgCard,
    bgSecundario: cores.bgSecundario,
    bgTerciario:  cores.bgTerciario,
    borda:        cores.borda,
    textoCorpo:   cores.textoCorpo,
    textoSutil:   cores.textoSutil,
    textoTitulo:  cores.textoTitulo,
    vermelhFundo: cores.vermelhFundo,
    vermelhoTexto:cores.vermelhoTexto,
  };

  const podeSalvar = nome.trim() && !salvando;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={aoFechar}
    >
      <div
        style={{
          width: '100%', maxWidth: 440,
          background: cores.bgCard,
          borderRadius: '28px 28px 0 0',
          padding: '12px 20px 48px',
          maxHeight: '92dvh', overflowY: 'auto',
          animation: 'subirModal .3s cubic-bezier(.16,1,.3,1)',
          display: 'flex', flexDirection: 'column', gap: 22,
          boxShadow: '0 -16px 60px rgba(0,0,0,.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: cores.bgTerciario, margin: '0 auto' }} />

        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
              {membro ? '✏️ Editar membro' : '✨ Novo membro'}
            </div>
            <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>
              Personalize o perfil do membro
            </div>
          </div>
          <button
            onClick={aoFechar}
            style={{
              width: 36, height: 36, borderRadius: 12,
              border: 'none', background: cores.bgTerciario,
              cursor: 'pointer', color: cores.textoSutil,
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* ── AVATAR PICKER ── */}
        <div style={{
          background: `linear-gradient(135deg, ${cor}11, ${cor}06)`,
          border: `1.5px solid ${cor}30`,
          borderRadius: 22, padding: '24px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <AvatarPicker
            nome={nome}
            cor={cor}
            fotoAtual={fotoPreview}
            aoSelecionarArquivo={aoSelecionarFoto}
            aoRemoverFoto={aoRemoverFoto}
            tamanho={110}
            coresUI={coresAvatarPicker}
          />
        </div>

        {/* ── NOME ── */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.7px' }}>
            Nome
          </label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: João"
            style={{
              width: '100%', padding: '13px 14px', borderRadius: 14,
              border: `1.5px solid ${nome ? cor + '60' : cores.borda}`,
              background: cores.bgTerciario, color: cores.textoCorpo,
              fontSize: 15, fontFamily: "'DM Sans',sans-serif",
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = cor}
            onBlur={e => e.target.style.borderColor = nome ? cor + '60' : cores.borda}
          />
        </div>

        {/* ── RELAÇÃO ── */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.7px' }}>
            Relação
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {RELACOES.map(r => {
              const sel = relacao === r.valor;
              return (
                <button
                  key={r.valor}
                  type="button"
                  onClick={() => setRelacao(r.valor)}
                  style={{
                    padding: '11px 6px', borderRadius: 14,
                    border: `2px solid ${sel ? cor : cores.borda}`,
                    background: sel ? `${cor}18` : cores.bgTerciario,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    transition: 'all .18s',
                    transform: sel ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{r.emoji}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: sel ? cor : cores.textoSutil,
                    fontFamily: "'DM Sans',sans-serif",
                    transition: 'color .18s',
                  }}>
                    {r.rotulo}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── COR DO AVATAR ── */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.7px' }}>
            Cor do avatar
          </label>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            {CORES_AVATAR.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: c, border: 'none', cursor: 'pointer', padding: 0,
                  outline: cor === c ? `3px solid ${c}` : '3px solid transparent',
                  outlineOffset: 3,
                  boxShadow: cor === c ? `0 0 0 5px ${c}30, 0 4px 12px ${c}55` : `0 2px 8px ${c}44`,
                  transform: cor === c ? 'scale(1.22)' : 'scale(1)',
                  transition: 'all .18s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {cor === c && (
                  <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── BOTÃO SALVAR ── */}
        <button
          type="button"
          onClick={salvar}
          disabled={!podeSalvar}
          style={{
            padding: '16px', borderRadius: 16, border: 'none',
            cursor: podeSalvar ? 'pointer' : 'not-allowed',
            background: podeSalvar
              ? `linear-gradient(135deg, ${cor}, ${cor}cc)`
              : cores.bgTerciario,
            color: podeSalvar ? '#fff' : cores.textoSutil,
            fontSize: 15, fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
            boxShadow: podeSalvar ? `0 8px 24px ${cor}55` : 'none',
            transition: 'all .25s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          }}
        >
          {salvando ? (
            <>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,.3)',
                borderTop: '2.5px solid #fff',
                animation: 'spin .7s linear infinite',
              }} />
              Salvando...
            </>
          ) : membro ? '✅ Salvar alterações' : '🎉 Adicionar membro'}
        </button>
      </div>

      <style>{`
        @keyframes subirModal {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
