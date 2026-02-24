import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { obterPeriodoMes, NOMES_MESES } from '../../utils/months';
import { useTema } from '../../contexts/TemaContexto';
import ModalReceita from '../Receitas/ReceitaModal';
import ModalDespesa from '../Despesas/DespesaModal';
import type { Transacao, MembroFamilia, Conta, Cartao } from '../../types';

interface Props { idUsuario: string; mesAtual: number; anoAtual: number; aoMudarMes: (m: number, a: number) => void; }

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const ICONES: Record<string, string> = { Salário:'💰',Freelance:'💼',Investimentos:'📈',Bônus:'🎁',Outros:'💵',Alimentação:'🍔',Moradia:'🏠',Transporte:'🚗',Saúde:'💊',Educação:'📚',Lazer:'🎮',Assinaturas:'📱',Contas:'⚡',Aluguel:'🏠',Supermercado:'🛒',Internet:'🌐',Combustível:'⛽',Roupas:'👗',Streamings:'📺' };

const IconSearch = () => <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

export default function PaginaTransacoes({ idUsuario, mesAtual, anoAtual, aoMudarMes }: Props) {
  const { cores } = useTema();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [membros, setMembros] = useState<MembroFamilia[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos'|'receita'|'despesa'>('todos');
  const [modalTipo, setModalTipo] = useState<'receita'|'despesa'|null>(null);
  const [carregando, setCarregando] = useState(true);

  const fmtMes = (m: number, a: number) => `${NOMES_MESES[m-1].slice(0,3).toLowerCase()}/${String(a).slice(2)}`;
  const mesAntN = mesAtual === 1 ? 12 : mesAtual - 1;
  const mesProxN = mesAtual === 12 ? 1 : mesAtual + 1;
  const anoAnt = mesAtual === 1 ? anoAtual - 1 : anoAtual;
  const anoProx = mesAtual === 12 ? anoAtual + 1 : anoAtual;

  useEffect(() => { carregarDados(); }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async () => {
    setCarregando(true);
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    await criarTransacoesRecorrentesMes(idUsuario, anoAtual, mesAtual);
    const [resT, resM, resC, resCa] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', idUsuario).gte('data', dataInicioStr).lte('data', dataFimStr).order('data', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', idUsuario),
      supabase.from('accounts').select('*').eq('user_id', idUsuario),
      supabase.from('cards').select('*').eq('user_id', idUsuario),
    ]);
    if (resT.data) setTransacoes(resT.data);
    if (resM.data) setMembros(resM.data);
    if (resC.data) setContas(resC.data);
    if (resCa.data) setCartoes(resCa.data);
    setCarregando(false);
  };

  const excluir = async (id: string) => {
    if (!window.confirm('Excluir esta transação?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    carregarDados();
  };

  const filtradas = transacoes.filter(t => (filtro === 'todos' || t.tipo === filtro) && t.titulo.toLowerCase().includes(busca.toLowerCase()));
  const grupos: Record<string, Transacao[]> = {};
  filtradas.forEach(t => { (grupos[t.data] ??= []).push(t); });

  const fmtGrupo = (d: string) => new Date(d+'T12:00:00').toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const card = { background: cores.bgCard, borderRadius: 18, border: `1px solid ${cores.borda}`, boxShadow: cores.sombra, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 };

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', transition: 'background .3s' }}>
      <div style={{ padding: '16px 16px 0' }}>
        {/* Filtro tipo */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['todos','receita','despesa'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer', background: filtro === f ? cores.azulPrimario : cores.bgTerciario, color: filtro === f ? '#fff' : cores.textoSutil, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
              {f === 'todos' ? 'Todos' : f === 'receita' ? '💰 Receitas' : '💸 Despesas'}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: cores.bgTerciario, borderRadius: 14, padding: '11px 14px', border: `1px solid ${cores.borda}`, marginBottom: 4, color: cores.textoSutil }}>
          <IconSearch />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Pesquisar..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif", color: cores.textoCorpo }} />
        </div>
      </div>

      <div style={{ padding: '4px 16px' }}>
        {carregando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${cores.bgTerciario}`, borderTop: `3px solid ${cores.azulPrimario}`, animation: 'spin .8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : Object.keys(grupos).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div>Nenhuma transação encontrada</div>
          </div>
        ) : (
          Object.entries(grupos).map(([data, items]) => (
            <div key={data}>
              <div style={{ fontSize: 12, fontWeight: 600, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", margin: '16px 0 8px', textTransform: 'capitalize', textDecoration: 'none' }}>
                {fmtGrupo(data)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(t => (
                  <div key={t.id} style={card}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: t.tipo === 'receita' ? cores.verdeFundo : cores.vermelhFundo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>
                      {ICONES[t.categoria] ?? (t.tipo === 'receita' ? '💰' : '💸')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titulo}{t.recorrente ? ' 🔄' : ''}</div>
                      <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>{t.membro?.nome ?? '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.tipo === 'receita' ? cores.verdeTexto : cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
                        {t.tipo === 'receita' ? '+' : '-'}R$ {fmt(t.valor)}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: (t.status === 'recebido' || t.status === 'pago') ? cores.verdeTexto : cores.amareloTexto, background: (t.status === 'recebido' || t.status === 'pago') ? cores.verdeFundo : cores.amareloFundo, padding: '2px 8px', borderRadius: 99, fontFamily: "'DM Sans',sans-serif", marginTop: 2, display: 'inline-block' }}>{t.status}</span>
                    </div>
                    <button onClick={() => excluir(t.id)} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: cores.vermelhFundo, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: 90, right: 'calc(50% - 215px + 16px)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <button onClick={() => setModalTipo('despesa')} style={{ width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', fontSize: 26, boxShadow: '0 6px 20px rgba(59,130,246,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>

      {modalTipo === 'receita' && <ModalReceita idUsuario={idUsuario} receita={null} membros={membros} contas={contas} aoFechar={() => setModalTipo(null)} aoSalvar={() => { carregarDados(); setModalTipo(null); }} />}
      {modalTipo === 'despesa' && <ModalDespesa idUsuario={idUsuario} despesa={null} membros={membros} contas={contas} cartoes={cartoes} aoFechar={() => setModalTipo(null)} aoSalvar={() => { carregarDados(); setModalTipo(null); }} />}
    </div>
  );
}
