import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import type { TipoFamilia, TipoRelacao } from '../../types';

interface Props {
  idUsuario: string;
  aoConcluir: () => void;
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

const TIPOS_FAMILIA: { valor: TipoFamilia; rotulo: string; icone: string; desc: string }[] = [
  { valor: 'sozinho',       rotulo: 'Sozinho(a)',   icone: '👤', desc: 'Só eu' },
  { valor: 'casado',        rotulo: 'Casado(a)',    icone: '💑', desc: 'Com cônjuge' },
  { valor: 'morando_junto', rotulo: 'Junto(a)',     icone: '👫', desc: 'Morando junto' },
  { valor: 'familia',       rotulo: 'Família',      icone: '👨‍👩‍👧‍👦', desc: 'Com filhos' },
];

interface MembroForm {
  nome: string;
  relacao: TipoRelacao;
  cor: string;
  fotoPreview: string | null;
  arquivo: File | null;
}

const membroVazio = (): MembroForm => ({
  nome: '', relacao: 'conjuge', cor: '#6366f1',
  fotoPreview: null, arquivo: null,
});

export default function PaginaOnboarding({ idUsuario, aoConcluir }: Props) {
  const { cores } = useTema();
  const [passo,       setPasso]       = useState(1);
  const [nome,        setNome]        = useState('');
  const [tipoFamilia, setTipoFamilia] = useState<TipoFamilia>('familia');
  const [membros,     setMembros]     = useState<MembroForm[]>([]);
  const [form,        setForm]        = useState<MembroForm>(membroVazio());
  const [salvando,    setSalvando]    = useState(false);

  /* ── helpers do formulário de membro ── */
  const atualizarForm = (campos: Partial<MembroForm>) =>
    setForm(prev => ({ ...prev, ...campos }));

  const adicionarMembro = () => {
    if (!form.nome.trim()) return;
    setMembros(prev => [...prev, { ...form }]);
    setForm(membroVazio());
  };

  const removerMembro = (i: number) =>
    setMembros(prev => prev.filter((_, idx) => idx !== i));

  /* ── finalizar onboarding ── */
  const finalizar = async () => {
    setSalvando(true);
    try {
      await supabase
        .from('users_profile')
        .update({ nome: nome.trim(), family_type: tipoFamilia, onboarding_completed: true })
        .eq('id', idUsuario);

      for (const m of membros) {
        let avatarUrl: string | null = null;

        if (m.arquivo) {
          const ext    = m.arquivo.name.split('.').pop() ?? 'jpg';
          const caminho = `${idUsuario}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: errUp } = await supabase.storage
            .from('avatars')
            .upload(caminho, m.arquivo, { upsert: true, cacheControl: '3600' });
          if (!errUp) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
            avatarUrl = data.publicUrl;
          }
        }

        await supabase.from('family_members').insert({
          user_id: idUsuario,
          nome:    m.nome.trim(),
          relacao: m.relacao,
          cor:     m.cor,
          avatar_url: avatarUrl,
        });
      }

      aoConcluir();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  /* ── estilos comuns ── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: 13,
    border: `1.5px solid ${cores.borda}`,
    background: cores.bgTerciario, color: cores.textoCorpo,
    fontSize: 16, fontFamily: "'DM Sans',sans-serif",
    outline: 'none', boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '.7px',
    textTransform: 'uppercase', color: cores.textoSutil,
    fontFamily: "'DM Sans',sans-serif", marginBottom: 7, display: 'block',
  };

  const coresAvatarPicker = {
    bgCard: cores.bgCard, bgSecundario: cores.bgSecundario,
    bgTerciario: cores.bgTerciario, borda: cores.borda,
    textoCorpo: cores.textoCorpo, textoSutil: cores.textoSutil,
    textoTitulo: cores.textoTitulo, vermelhFundo: cores.vermelhFundo,
    vermelhoTexto: cores.vermelhoTexto,
  };

  return (
    <div style={{
      minHeight: '100dvh', background: cores.bgPrimario,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '24px 16px 40px',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {/* Indicador de passos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            height: 5, borderRadius: 99,
            width: passo >= n ? 28 : 16,
            background: passo >= n ? '#3b82f6' : cores.bgTerciario,
            transition: 'all .3s',
          }} />
        ))}
      </div>

      <div style={{
        width: '100%', maxWidth: 420,
        background: cores.bgCard, borderRadius: 28,
        padding: '28px 20px',
        border: `1px solid ${cores.borda}`,
        boxShadow: '0 8px 32px rgba(0,0,0,.08)',
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>

        {/* ══ PASSO 1: Nome ══ */}
        {passo === 1 && (
          <>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: cores.textoTitulo, lineHeight: 1.2 }}>
                👋 Qual é o seu nome?
              </div>
              <div style={{ fontSize: 14, color: cores.textoSutil, marginTop: 6 }}>
                Vamos personalizar sua experiência
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nome</label>
              <input
                style={inputStyle}
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: André"
                autoFocus
              />
            </div>

            <button
              onClick={() => setPasso(2)}
              disabled={!nome.trim()}
              style={{
                padding: '16px', borderRadius: 16, border: 'none',
                cursor: nome.trim() ? 'pointer' : 'not-allowed',
                background: nome.trim()
                  ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)'
                  : cores.bgTerciario,
                color: nome.trim() ? '#fff' : cores.textoSutil,
                fontSize: 16, fontWeight: 800,
                boxShadow: nome.trim() ? '0 6px 20px rgba(59,130,246,.4)' : 'none',
                transition: 'all .2s',
              }}
            >
              Continuar →
            </button>
          </>
        )}

        {/* ══ PASSO 2: Tipo família ══ */}
        {passo === 2 && (
          <>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: cores.textoTitulo, lineHeight: 1.2 }}>
                🏠 Como é a sua família?
              </div>
              <div style={{ fontSize: 14, color: cores.textoSutil, marginTop: 6 }}>
                Selecione o que melhor descreve você
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TIPOS_FAMILIA.map(opcao => {
                const sel = tipoFamilia === opcao.valor;
                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => setTipoFamilia(opcao.valor)}
                    style={{
                      padding: '16px 10px',
                      borderRadius: 18,
                      border: `2px solid ${sel ? '#3b82f6' : cores.borda}`,
                      background: sel ? '#3b82f618' : cores.bgTerciario,
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6,
                      transition: 'all .18s',
                      transform: sel ? 'scale(1.03)' : 'scale(1)',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{opcao.icone}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: sel ? '#3b82f6' : cores.textoCorpo }}>
                      {opcao.rotulo}
                    </span>
                    <span style={{ fontSize: 11, color: cores.textoSutil }}>{opcao.desc}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPasso(1)}
                style={{
                  flex: 1, padding: '15px', borderRadius: 14, border: `1.5px solid ${cores.borda}`,
                  background: 'transparent', color: cores.textoSutil,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ← Voltar
              </button>
              <button
                onClick={() => setPasso(3)}
                style={{
                  flex: 2, padding: '15px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(59,130,246,.4)',
                }}
              >
                Continuar →
              </button>
            </div>
          </>
        )}

        {/* ══ PASSO 3: Membros ══ */}
        {passo === 3 && (
          <>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: cores.textoTitulo, lineHeight: 1.2 }}>
                👨‍👩‍👧 Adicione os membros
              </div>
              <div style={{ fontSize: 14, color: cores.textoSutil, marginTop: 6 }}>
                Quem divide as finanças com você?
              </div>
            </div>

            {/* Lista de membros já adicionados */}
            {membros.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {membros.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: cores.bgTerciario,
                    borderRadius: 14,
                    border: `1px solid ${cores.borda}`,
                  }}>
                    {/* Avatar mini */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      overflow: 'hidden', flexShrink: 0,
                      background: m.fotoPreview ? '#000' : m.cor,
                      boxShadow: `0 0 0 2px ${m.cor}44`,
                    }}>
                      {m.fotoPreview
                        ? <img src={m.fotoPreview} alt={m.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>
                            {m.nome[0].toUpperCase()}
                          </div>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo }}>{m.nome}</div>
                      <div style={{ fontSize: 12, color: m.cor, fontWeight: 600 }}>
                        {RELACOES.find(r => r.valor === m.relacao)?.rotulo}
                      </div>
                    </div>
                    <button
                      onClick={() => removerMembro(i)}
                      style={{
                        width: 30, height: 30, borderRadius: 9, border: 'none',
                        background: cores.vermelhFundo, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="13" height="13" fill="none" stroke={cores.vermelhoTexto} strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário de novo membro */}
            <div style={{
              background: cores.bgSecundario ?? cores.bgTerciario,
              borderRadius: 22, padding: '20px 16px',
              border: `1.5px solid ${form.cor}30`,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {/* AvatarPicker */}
              <AvatarPicker
                nome={form.nome}
                cor={form.cor}
                fotoAtual={form.fotoPreview}
                aoSelecionarArquivo={(arquivo, preview) => atualizarForm({ arquivo, fotoPreview: preview })}
                aoRemoverFoto={() => atualizarForm({ arquivo: null, fotoPreview: null })}
                tamanho={88}
                coresUI={coresAvatarPicker}
              />

              {/* Nome */}
              <div>
                <label style={labelStyle}>Nome do membro</label>
                <input
                  style={inputStyle}
                  value={form.nome}
                  onChange={e => atualizarForm({ nome: e.target.value })}
                  placeholder="Ex: Maria"
                />
              </div>

              {/* Relação */}
              <div>
                <label style={labelStyle}>Relação</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                  {RELACOES.map(r => {
                    const sel = form.relacao === r.valor;
                    return (
                      <button
                        key={r.valor}
                        type="button"
                        onClick={() => atualizarForm({ relacao: r.valor })}
                        style={{
                          padding: '9px 4px',
                          borderRadius: 12,
                          border: `2px solid ${sel ? form.cor : cores.borda}`,
                          background: sel ? `${form.cor}18` : cores.bgTerciario,
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                          transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{r.emoji}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: sel ? form.cor : cores.textoSutil }}>
                          {r.rotulo}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cor */}
              <div>
                <label style={labelStyle}>Cor do avatar</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CORES_AVATAR.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => atualizarForm({ cor: c })}
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: c, border: 'none', padding: 0,
                        cursor: 'pointer',
                        outline: form.cor === c ? `3px solid ${c}` : '3px solid transparent',
                        outlineOffset: 3,
                        transform: form.cor === c ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: form.cor === c ? `0 0 0 5px ${c}30` : 'none',
                        transition: 'all .15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Botão adicionar */}
              <button
                type="button"
                onClick={adicionarMembro}
                disabled={!form.nome.trim()}
                style={{
                  padding: '14px', borderRadius: 14, border: 'none',
                  cursor: form.nome.trim() ? 'pointer' : 'not-allowed',
                  background: form.nome.trim() ? form.cor : cores.bgTerciario,
                  color: form.nome.trim() ? '#fff' : cores.textoSutil,
                  fontSize: 14, fontWeight: 800,
                  boxShadow: form.nome.trim() ? `0 4px 16px ${form.cor}44` : 'none',
                  transition: 'all .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar membro
              </button>
            </div>

            {/* Rodapé */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={finalizar}
                disabled={membros.length === 0 || salvando}
                style={{
                  padding: '16px', borderRadius: 16, border: 'none',
                  cursor: membros.length > 0 && !salvando ? 'pointer' : 'not-allowed',
                  background: membros.length > 0
                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                    : cores.bgTerciario,
                  color: membros.length > 0 ? '#fff' : cores.textoSutil,
                  fontSize: 16, fontWeight: 800,
                  boxShadow: membros.length > 0 ? '0 6px 20px rgba(34,197,94,.4)' : 'none',
                  transition: 'all .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {salvando
                  ? <><Spinner /> Salvando...</>
                  : '🎉 Finalizar configuração'
                }
              </button>

              {membros.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: 12, color: cores.textoSutil, margin: 0 }}>
                  Adicione pelo menos um membro para continuar
                </p>
              )}

              <button
                onClick={() => setPasso(2)}
                style={{
                  padding: '12px', borderRadius: 14, border: 'none',
                  background: 'transparent', color: cores.textoSutil,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                ← Voltar
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2.5px solid rgba(255,255,255,.35)',
      borderTop: '2.5px solid #fff',
      animation: 'spin .7s linear infinite', flexShrink: 0,
    }} />
  );
}
