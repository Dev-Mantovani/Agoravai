import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { obterPeriodoMes } from '../../utils/months';
import { useTema } from '../../contexts/TemaContexto';
import type { Transacao, Cartao, Conta } from '../../types';

interface Props { idUsuario: string; mesAtual: number; anoAtual: number; }

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export default function PaginaDashboard({ idUsuario, mesAtual, anoAtual }: Props) {
  const { cores } = useTema();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregarDados(); }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async () => {
    setCarregando(true);
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    await criarTransacoesRecorrentesMes(idUsuario, anoAtual, mesAtual);
    const [resT, resC, resA] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', idUsuario).gte('data', dataInicioStr).lte('data', dataFimStr).order('data', { ascending: false }),
      supabase.from('cards').select('*').eq('user_id', idUsuario),
      supabase.from('accounts').select('*').eq('user_id', idUsuario),
    ]);
    if (resT.data) setTransacoes(resT.data);
    if (resC.data) setCartoes(resC.data);
    if (resA.data) setContas(resA.data);
    setCarregando(false);
  };

  const receitas = transacoes.filter(t => t.tipo === 'receita' && t.status === 'recebido').reduce((s, t) => s + t.valor, 0);
  const despesas = transacoes.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
  const saldo = receitas - despesas;

  const card = { background: cores.bgCard, borderRadius: 20, border: `1px solid ${cores.borda}`, boxShadow: cores.sombra };
  const secTitulo = { fontSize: 17, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" };

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${cores.bgTerciario}`, borderTop: `3px solid ${cores.azulPrimario}`, animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', transition: 'background .3s' }}>
      <div style={{ padding: '16px 16px 0' }}>
        {/* Cards receita + despesa */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          {[
            { label: 'Receitas', valor: receitas, bg: cores.verdeFundo, iconBg: '#22C55E', textColor: cores.verdeTexto },
            { label: 'Despesas', valor: despesas, bg: cores.vermelhFundo, iconBg: '#EF4444', textColor: cores.vermelhoTexto },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 20, padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10, transition: 'background .3s' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>$</div>
              <div>
                <div style={{ fontSize: 11, color: c.textColor, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 1 }}>R$ {fmt(c.valor)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Saldo */}
        <div style={{ background: cores.azulFundo, borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, border: `1px solid ${cores.azulPrimario}33`, transition: 'background .3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: cores.azulPrimario, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐷</div>
            <div style={{ fontSize: 13, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif" }}>
              Saldo do mês
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: saldo >= 0 ? cores.verdeTexto : cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
            R$ {fmt(saldo)}
          </div>
        </div>

        {/* Cartões */}
        {cartoes.length > 0 && (
          <>
            <Secao titulo="Meus cartões" cores={cores} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {cartoes.map(cartao => {
                const pct = Math.min((cartao.usado / cartao.limite) * 100, 100);
                return (
                  <div key={cartao.id} style={{ ...card, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: cartao.cor || '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                        {cartao.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Cartão de crédito</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{cartao.nome}</div>
                      </div>
                      {cartao.fechamento_dia && <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Fecha {cartao.fechamento_dia}</div>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif" }}>R$ {fmt(cartao.usado)}</span>
                      <span style={{ fontSize: 13, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>R$ {fmt(cartao.limite)}</span>
                    </div>
                    <div style={{ height: 8, background: cores.bgTerciario, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? 'linear-gradient(90deg,#EF4444,#F87171)' : 'linear-gradient(90deg,#22C55E,#4ADE80)', borderRadius: 99, transition: 'width .5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Contas */}
        {contas.length > 0 && (
          <>
            <Secao titulo="Minhas contas" cores={cores} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {contas.map(conta => (
                <div key={conta.id} style={{ ...card, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: conta.cor || '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                      {conta.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Conta {conta.tipo}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{conta.nome}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>Saldo atual</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>R$ {fmt(conta.saldo)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Últimas transações */}
        {transacoes.length > 0 && (
          <>
            <Secao titulo="Últimas transações" cores={cores} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {transacoes.slice(0, 5).map(t => (
                <div key={t.id} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: t.tipo === 'receita' ? cores.verdeFundo : cores.vermelhFundo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {t.tipo === 'receita' ? '💰' : '💸'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titulo}</div>
                    <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>{t.membro?.nome}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.tipo === 'receita' ? cores.verdeTexto : cores.vermelhoTexto, fontFamily: "'DM Sans',sans-serif" }}>
                      {t.tipo === 'receita' ? '+' : '-'}R$ {fmt(t.valor)}
                    </div>
                    <BadgeStatus status={t.status} cores={cores} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Secao({ titulo, cores }: { titulo: string; cores: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>{titulo}</div>
      <button style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: cores.azulFundo, color: cores.azulPrimario, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
    </div>
  );
}

function BadgeStatus({ status, cores }: { status: string; cores: any }) {
  const ok = status === 'recebido' || status === 'pago';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: ok ? cores.verdeTexto : cores.amareloTexto, background: ok ? cores.verdeFundo : cores.amareloFundo, padding: '2px 8px', borderRadius: 99, fontFamily: "'DM Sans',sans-serif", marginTop: 2, display: 'inline-block' }}>
      {status}
    </span>
  );
}
