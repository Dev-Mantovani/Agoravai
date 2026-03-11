import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { MembroFamilia, Conta } from '../../types';

interface Props {
  idUsuario: string;
  receita: any | null;
  membros: MembroFamilia[];
  contas: Conta[];
  aoFechar: () => void;
  aoSalvar: () => void;
}

const CATEGORIAS_RECEITA = [
  { valor: 'Salário',       emoji: '💰' },
  { valor: 'Freelance',     emoji: '💼' },
  { valor: 'Investimentos', emoji: '📈' },
  { valor: 'Bônus',         emoji: '🎁' },
  { valor: 'Aluguel',       emoji: '🏠' },
  { valor: 'Outros',        emoji: '💵' },
];

const STATUS_RECEITA = [
  { valor: 'recebido', rotulo: 'Recebido', cor: '#22c55e' },
  { valor: 'pendente', rotulo: 'Pendente', cor: '#f59e0b' },
];

export default function ModalReceita({ idUsuario, receita, membros, contas, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();

  // Trava scroll da página no mobile — resolve o pulo/URL bar
  useScrollLock(true);

  const hoje = new Date().toISOString().split('T')[0];

  const [titulo,     setTitulo]     = useState(receita?.titulo    ?? '');
  const [valor,      setValor]      = useState(receita?.valor?.toString() ?? '');
  const [categoria,  setCategoria]  = useState(receita?.categoria ?? 'Salário');
  const [status,     setStatus]     = useState(receita?.status    ?? 'recebido');
  const [membroId,   setMembroId]   = useState(receita?.membro_id ?? (membros[0]?.id ?? ''));
  const [data,       setData]       = useState(receita?.data       ?? hoje);
  const [contaId,    setContaId]    = useState(receita?.conta_id   ?? '');
  const [recorrente, setRecorrente] = useState(receita?.recorrente ?? false);
  const [salvando,   setSalvando]   = useState(false);

  const salvar = async () => {
    if (!titulo.trim() || !valor || !membroId) return;
    setSalvando(true);
    try {
      const payload = {
        user_id:    idUsuario,
        tipo:       'receita',
        titulo:     titulo.trim(),
        valor:      parseFloat(valor.replace(',', '.')),
        categoria,
        status,
        membro_id:  membroId,
        data,
        conta_id:   contaId || null,
        recorrente,
      };
      if (receita) {
        await supabase.from('transactions').update(payload).eq('id', receita.id);
      } else {
        await supabase.from('transactions').insert(payload);
      }
      aoSalvar();
    } finally {
      setSalvando(false);
    }
  };

  const podeSalvar = titulo.trim() && valor && membroId;

  /* ── estilos reutilizáveis ── */
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '.7px',
    textTransform: 'uppercase', color: cores.textoSutil,
    fontFamily: "'DM Sans',sans-serif", marginBottom: 6, display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 14,
    border: `1.5px solid ${cores.borda}`,
    background: cores.bgTerciario, color: cores.textoCorpo,
    fontSize: 16,  /* 16px evita zoom automático do iOS */
    fontFamily: "'DM Sans',sans-serif",
    outline: 'none', boxSizing: 'border-box',
    WebkitAppearance: 'none',
    transition: 'border-color .2s',
  };

  return (
    <>
      {/* ── Overlay ── */}
      <div
        onClick={aoFechar}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* ── Sheet ── */}
      <div
        style={{
          /* Posicionamento fixo que não muda com URL bar */
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          zIndex: 401,

          background: cores.bgCard,
          borderRadius: '24px 24px 0 0',

          /* height explícito é necessário no iOS para o flex calcular header/footer */
          height: 'min(92dvh, 92vh)',
          maxHeight: 'min(92dvh, 92vh)',

          display: 'flex',
          flexDirection: 'column',

          /* Sombra pronunciada */
          boxShadow: '0 -8px 40px rgba(0,0,0,.25)',

          /* Animação de entrada */
          animation: 'entrarSheet .3s cubic-bezier(.16,1,.3,1)',

          /* Garante que não vaza do lado no Android */
          overflow: 'hidden',
        }}
      >
        {/* ── Cabeçalho FIXO ── */}
        <div style={{
          flexShrink: 0,
          position: 'sticky' as const, top: 0, zIndex: 2,
          padding: '14px 20px 12px',
          borderBottom: `1px solid ${cores.borda}`,
          background: cores.bgCard,
        }}>
          {/* Handle bar */}
          <div style={{
            width: 36, height: 4, borderRadius: 99,
            background: cores.bgTerciario,
            margin: '0 auto 14px',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontSize: 19, fontWeight: 800, color: cores.textoTitulo,
                fontFamily: "'DM Sans',sans-serif",
              }}>
                💰 {receita ? 'Editar Receita' : 'Nova Receita'}
              </div>
            </div>
            <button
              onClick={aoFechar}
              style={{
                width: 36, height: 36, borderRadius: 12,
                border: 'none', background: cores.bgTerciario,
                cursor: 'pointer', color: cores.textoSutil,
                fontSize: 20, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >×</button>
          </div>
        </div>

        {/* ── Conteúdo com scroll controlado ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          /* Impede o scroll de "vazar" para a página abaixo */
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch' as any,
          padding: '20px 20px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}>

          {/* Título + Valor — lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Título</label>
              <input
                style={inputStyle}
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Salário"
                onFocus={e => e.target.style.borderColor = '#22c55e'}
                onBlur={e => e.target.style.borderColor = cores.borda}
              />
            </div>
            <div>
              <label style={labelStyle}>Valor (R$)</label>
              <input
                style={inputStyle}
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={e => setValor(e.target.value.replace(/[^0-9,.]/g, ''))}
                placeholder="0,00"
                onFocus={e => e.target.style.borderColor = '#22c55e'}
                onBlur={e => e.target.style.borderColor = cores.borda}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label style={labelStyle}>Categoria</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {CATEGORIAS_RECEITA.map(c => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => setCategoria(c.valor)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 14,
                    border: `2px solid ${categoria === c.valor ? '#22c55e' : cores.borda}`,
                    background: categoria === c.valor ? '#22c55e18' : cores.bgTerciario,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                    transition: 'all .18s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: categoria === c.valor ? '#22c55e' : cores.textoSutil,
                    fontFamily: "'DM Sans',sans-serif",
                  }}>
                    {c.valor}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {STATUS_RECEITA.map(s => (
                <button
                  key={s.valor}
                  type="button"
                  onClick={() => setStatus(s.valor)}
                  style={{
                    flex: 1, padding: '13px',
                    borderRadius: 14,
                    border: `2px solid ${status === s.valor ? s.cor : cores.borda}`,
                    background: status === s.valor ? `${s.cor}18` : cores.bgTerciario,
                    cursor: 'pointer',
                    fontSize: 14, fontWeight: 700,
                    color: status === s.valor ? s.cor : cores.textoSutil,
                    fontFamily: "'DM Sans',sans-serif",
                    transition: 'all .18s',
                  }}
                >
                  {s.valor === 'recebido' ? '✅ ' : '⏳ '}{s.rotulo}
                </button>
              ))}
            </div>
          </div>

          {/* Pessoa + Data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Pessoa</label>
              <select
                style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
                value={membroId}
                onChange={e => setMembroId(e.target.value)}
              >
                {membros.map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input
                type="date"
                style={inputStyle}
                value={data}
                onChange={e => setData(e.target.value)}
              />
            </div>
          </div>

          {/* Conta */}
          {contas.length > 0 && (
            <div>
              <label style={labelStyle}>Conta</label>
              <select
                style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
                value={contaId}
                onChange={e => setContaId(e.target.value)}
              >
                <option value="">Nenhuma</option>
                {contas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Recorrente */}
          <button
            type="button"
            onClick={() => setRecorrente((v: boolean) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px',
              borderRadius: 16,
              border: `2px solid ${recorrente ? '#22c55e' : cores.borda}`,
              background: recorrente ? '#22c55e12' : cores.bgTerciario,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all .2s',
            }}
          >
            {/* Toggle visual */}
            <div style={{
              width: 46, height: 26, borderRadius: 99,
              background: recorrente ? '#22c55e' : cores.bgTerciario,
              border: `2px solid ${recorrente ? '#22c55e' : cores.borda}`,
              position: 'relative', flexShrink: 0,
              transition: 'background .2s',
            }}>
              <div style={{
                position: 'absolute',
                top: 2, left: recorrente ? 20 : 2,
                width: 18, height: 18, borderRadius: '50%',
                background: recorrente ? '#fff' : cores.textoSutil,
                transition: 'left .2s, background .2s',
                boxShadow: '0 1px 4px rgba(0,0,0,.2)',
              }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif" }}>
                🔄 Receita recorrente
              </div>
              <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>
                Repete automaticamente todo mês
              </div>
            </div>
          </button>

          {/* Espaço extra para o botão fixo não cobrir conteúdo */}
          <div style={{ height: 4 }} />
        </div>

        {/* ── Botão FIXO no rodapé ── */}
        <div style={{
          flexShrink: 0,
          padding: '12px 20px',
          /* Respeita o notch do iPhone */
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          borderTop: `1px solid ${cores.borda}`,
          background: cores.bgCard,
        }}>
          <button
            type="button"
            onClick={salvar}
            disabled={!podeSalvar || salvando}
            style={{
              width: '100%',
              padding: '17px',
              borderRadius: 16,
              border: 'none',
              cursor: podeSalvar && !salvando ? 'pointer' : 'not-allowed',
              background: podeSalvar
                ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                : cores.bgTerciario,
              color: podeSalvar ? '#fff' : cores.textoSutil,
              fontSize: 16, fontWeight: 800,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: podeSalvar ? '0 6px 20px rgba(34,197,94,.4)' : 'none',
              transition: 'all .25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              /* Toque mais fácil no mobile */
              minHeight: 54,
            }}
          >
            {salvando
              ? <><Spinner /> Salvando...</>
              : receita ? '✅ Salvar alterações' : '💰 Adicionar Receita'
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes entrarSheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: '2.5px solid rgba(255,255,255,.35)',
      borderTop: '2.5px solid #fff',
      animation: 'spin .7s linear infinite',
      flexShrink: 0,
    }} />
  );
}
