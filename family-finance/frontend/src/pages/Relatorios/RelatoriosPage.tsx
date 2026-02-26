import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { obterPeriodoMes, NOMES_MESES } from '../../utils/months';
import { useTema } from '../../contexts/TemaContexto';
import { useTamanhoTela } from '../../hooks/useTamanhoTela';
import type { Transacao } from '../../types';

interface Props { idUsuario: string; mesAtual: number; anoAtual: number; }

type FiltroTipo = 'despesa' | 'receita' | 'consolidado';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const CORES_CAT: Record<string, string> = {
  Aluguel:'#FFD93D',Moradia:'#FFD93D',Alimentação:'#6BCB77',Supermercado:'#6BCB77',
  Saúde:'#FF6B6B',Contas:'#FF6B6B',Transporte:'#4D96FF',Combustível:'#4D96FF',
  Educação:'#A78BFA',Roupas:'#C77DFF',Internet:'#8B7355',Assinaturas:'#FF9F43',
  Streamings:'#FF9F43',Lazer:'#26C6DA',Outros:'#9CA3AF',Freelance:'#34D399',
  Investimentos:'#059669',Bônus:'#F59E0B',Salário:'#10B981',
};
const ICONES_CAT: Record<string, string> = {
  Salário:'💰',Freelance:'💼',Investimentos:'📈',Bônus:'🎁',Outros:'💵',
  Alimentação:'🍔',Moradia:'🏠',Transporte:'🚗',Saúde:'💊',Educação:'📚',
  Lazer:'🎮',Assinaturas:'📱',Contas:'⚡',Aluguel:'🏠',Supermercado:'🛒',
  Internet:'🌐',Combustível:'⛽',Roupas:'👗',Streamings:'📺',
};

// ─── Gráfico donut por categorias ─────────────────────────────────
function GraficoDonut({ dados, total, cores }: { dados: any[]; total: number; cores: any }) {
  const raio = 78; const circ = 2 * Math.PI * raio;
  let off = 0;
  const segs = dados.map(d => { const c = (d.valor/total)*circ; const s = { ...d, c, off }; off += c; return s; });
  return (
    <svg width="210" height="210" viewBox="0 0 210 210" style={{ display:'block', margin:'0 auto' }}>
      <circle cx="105" cy="105" r={raio} fill="none" stroke={cores.bgTerciario} strokeWidth="28" />
      {segs.map((s,i) => (
        <circle key={i} cx="105" cy="105" r={raio} fill="none" stroke={s.cor} strokeWidth="28"
          strokeDasharray={`${s.c} ${circ-s.c}`} strokeDashoffset={-s.off}
          style={{ transform:'rotate(-90deg)', transformOrigin:'105px 105px', transition:'stroke-dasharray .6s ease' }} />
      ))}
      <text x="105" y="98" textAnchor="middle" fontSize="11" fill={cores.textoSutil} fontFamily="'DM Sans',sans-serif">Total</text>
      <text x="105" y="118" textAnchor="middle" fontSize="14" fontWeight="800" fill={cores.textoTitulo} fontFamily="'DM Sans',sans-serif">
        R$ {total.toLocaleString('pt-BR',{maximumFractionDigits:0})}
      </text>
    </svg>
  );
}

// ─── Gráfico consolidado: donut duplo + barras ────────────────────
function GraficoConsolidado({ receitas, despesas, saldo, cores }: { receitas: number; despesas: number; saldo: number; cores: any }) {
  const total = receitas + despesas;
  const pctReceitas = total > 0 ? (receitas / total) * 100 : 50;
  const pctDespesas = total > 0 ? (despesas / total) * 100 : 50;

  // SVG donut 2 cores
  const raio = 78; const circ = 2 * Math.PI * raio;
  const cR = (receitas / total) * circ;
  const cD = (despesas / total) * circ;

  return (
    <div>
      {/* Donut comparativo */}
      <svg width="210" height="210" viewBox="0 0 210 210" style={{ display: 'block', margin: '0 auto' }}>
        <circle cx="105" cy="105" r={raio} fill="none" stroke={cores.bgTerciario} strokeWidth="28" />
        {/* Receitas (verde) */}
        <circle cx="105" cy="105" r={raio} fill="none" stroke="#22C55E" strokeWidth="28"
          strokeDasharray={`${cR} ${circ - cR}`} strokeDashoffset={0}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '105px 105px', transition: 'stroke-dasharray .7s ease' }} />
        {/* Despesas (vermelho) - começa depois das receitas */}
        <circle cx="105" cy="105" r={raio} fill="none" stroke="#EF4444" strokeWidth="28"
          strokeDasharray={`${cD} ${circ - cD}`} strokeDashoffset={-cR}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '105px 105px', transition: 'stroke-dasharray .7s ease' }} />
        <text x="105" y="95" textAnchor="middle" fontSize="11" fill={cores.textoSutil} fontFamily="'DM Sans',sans-serif">Saldo</text>
        <text x="105" y="115" textAnchor="middle" fontSize="14" fontWeight="800" fill={saldo >= 0 ? '#16A34A' : '#DC2626'} fontFamily="'DM Sans',sans-serif">
          R$ {saldo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </text>
        {/* Legenda */}
        <circle cx="60" cy="185" r="5" fill="#22C55E" />
        <text x="70" y="189" fontSize="11" fill={cores.textoSutil} fontFamily="'DM Sans',sans-serif">Receitas</text>
        <circle cx="130" cy="185" r="5" fill="#EF4444" />
        <text x="140" y="189" fontSize="11" fill={cores.textoSutil} fontFamily="'DM Sans',sans-serif">Despesas</text>
      </svg>

      {/* Barras horizontais */}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Receitas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', fontFamily: "'DM Sans',sans-serif" }}>💰 Receitas</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', fontFamily: "'DM Sans',sans-serif" }}>R$ {fmt(receitas)}</span>
          </div>
          <div style={{ height: 10, background: cores.bgTerciario, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pctReceitas}%`, height: '100%', background: 'linear-gradient(90deg,#22C55E,#4ADE80)', borderRadius: 99, transition: 'width .7s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>{pctReceitas.toFixed(1)}% do total movimentado</div>
        </div>

        {/* Despesas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', fontFamily: "'DM Sans',sans-serif" }}>💸 Despesas</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', fontFamily: "'DM Sans',sans-serif" }}>R$ {fmt(despesas)}</span>
          </div>
          <div style={{ height: 10, background: cores.bgTerciario, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${pctDespesas}%`, height: '100%', background: 'linear-gradient(90deg,#EF4444,#F87171)', borderRadius: 99, transition: 'width .7s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>{pctDespesas.toFixed(1)}% do total movimentado</div>
        </div>

        {/* Saldo final */}
        <div style={{
          background: saldo >= 0 ? cores.verdeFundo : cores.vermelhFundo,
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: `1px solid ${saldo >= 0 ? '#22C55E33' : '#EF444433'}`,
          transition: 'background .3s',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif" }}>
            💎 Saldo do período
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: saldo >= 0 ? '#16A34A' : '#DC2626', fontFamily: "'DM Sans',sans-serif" }}>
            R$ {fmt(saldo)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────
export default function PaginaRelatorios({ idUsuario, mesAtual, anoAtual }: Props) {
  const { cores } = useTema();
  const { ehDesktop } = useTamanhoTela();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('despesa');
  const nomeMes = `${NOMES_MESES[mesAtual-1]} ${anoAtual}`;

  useEffect(() => { carregarDados(); }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async () => {
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    const { data } = await supabase.from('transactions').select('*').eq('user_id', idUsuario).gte('data', dataInicioStr).lte('data', dataFimStr);
    if (data) setTransacoes(data);
  };

  // Totais
  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  // Categorias filtradas
  const filtradas = filtroTipo === 'consolidado' ? [] : transacoes.filter(t => t.tipo === filtroTipo);
  const total = filtradas.reduce((s, t) => s + t.valor, 0);
  const porCat: Record<string,number> = {};
  filtradas.forEach(t => { porCat[t.categoria] = (porCat[t.categoria]||0) + t.valor; });
  const categorias = Object.entries(porCat)
    .map(([nome,valor]) => ({ nome, valor, cor: CORES_CAT[nome]||'#9CA3AF', icone: ICONES_CAT[nome]||'💰' }))
    .sort((a,b) => b.valor - a.valor);

  const FILTROS: { id: FiltroTipo; label: string; emoji: string }[] = [
    { id: 'despesa',      label: 'Despesas',    emoji: '💸' },
    { id: 'receita',      label: 'Receitas',    emoji: '💰' },
    { id: 'consolidado',  label: 'Consolidado', emoji: '📊' },
  ];

  const semDados = filtroTipo !== 'consolidado' && categorias.length === 0;
  const semDadosConsolidado = filtroTipo === 'consolidado' && transacoes.length === 0;

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', transition: 'background .3s', padding: ehDesktop ? '20px 32px' : '51px 16px 0' }}>

      {/* Cards de resumo rápido (sempre visíveis) */}
      {transacoes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Receitas', valor: totalReceitas, bg: cores.verdeFundo, textColor: '#16A34A', icon: '💰' },
            { label: 'Despesas', valor: totalDespesas, bg: cores.vermelhFundo, textColor: '#DC2626', icon: '💸' },
            { label: 'Saldo', valor: saldo, bg: saldo >= 0 ? cores.azulFundo : cores.vermelhFundo, textColor: saldo >= 0 ? cores.azulPrimario : '#DC2626', icon: '💎' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 16, padding: '14px 12px', transition: 'background .3s' }}>
              <div style={{ fontSize: 11, color: c.textColor, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{c.icon} {c.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>R$ {fmt(c.valor)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltroTipo(f.id)} style={{
            padding: '9px 18px', borderRadius: 99, border: 'none', cursor: 'pointer',
            background: filtroTipo === f.id ? cores.azulPrimario : cores.bgTerciario,
            color: filtroTipo === f.id ? '#fff' : cores.textoSutil,
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
            transition: 'all .2s', boxShadow: filtroTipo === f.id ? '0 4px 12px rgba(59,130,246,.35)' : 'none',
          }}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* Conteúdo principal */}
      {semDados || semDadosConsolidado ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: cores.textoCorpo }}>Sem dados para este período</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Adicione transações para ver os relatórios</div>
        </div>
      ) : (
        <div style={{ display: ehDesktop && filtroTipo !== 'consolidado' ? 'grid' : 'block', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Gráfico */}
          <div style={{ background: cores.bgCard, borderRadius: 24, padding: '20px 16px', border: `1px solid ${cores.borda}`, marginBottom: ehDesktop ? 0 : 20, boxShadow: cores.sombra, transition: 'background .3s' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginBottom: 16 }}>
              {filtroTipo === 'consolidado' ? `📊 Receitas × Despesas — ${nomeMes}` : filtroTipo === 'despesa' ? '💸 Despesas por categoria' : '💰 Receitas por categoria'}
            </div>

            {filtroTipo === 'consolidado' ? (
              <GraficoConsolidado receitas={totalReceitas} despesas={totalDespesas} saldo={saldo} cores={cores} />
            ) : (
              <GraficoDonut dados={categorias} total={total} cores={cores} />
            )}
          </div>

          {/* Grid de categorias (só em despesas/receitas) */}
          {filtroTipo !== 'consolidado' && categorias.length > 0 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}>
                Detalhamento por categoria
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {categorias.map(c => (
                  <div key={c.nome} style={{ background: cores.bgCard, borderRadius: 18, padding: 14, border: `1px solid ${cores.borda}`, boxShadow: cores.sombra, transition: 'background .3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: `${c.cor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.icone}</div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
                    </div>
                    <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{c.nome.length>14?c.nome.slice(0,14)+'…':c.nome}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>R$ {fmt(c.valor)}</div>
                    <div style={{ height: 4, background: cores.bgTerciario, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${(c.valor/total)*100}%`, height: '100%', background: c.cor, borderRadius: 99, transition: 'width .5s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>{((c.valor/total)*100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consolidado: tabela por membro */}
          {filtroTipo === 'consolidado' && (
            <div style={{ marginTop: ehDesktop ? 0 : 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}>
                Top categorias de despesas
              </div>
              {(() => {
                const despCat: Record<string,number> = {};
                transacoes.filter(t => t.tipo === 'despesa').forEach(t => { despCat[t.categoria] = (despCat[t.categoria]||0)+t.valor; });
                const tops = Object.entries(despCat).sort((a,b)=>b[1]-a[1]).slice(0,6);
                const maxD = tops[0]?.[1] ?? 1;
                return (
                  <div style={{ background: cores.bgCard, borderRadius: 20, padding: 16, border: `1px solid ${cores.borda}`, boxShadow: cores.sombra }}>
                    {tops.map(([nome, val]) => (
                      <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: `${CORES_CAT[nome]||'#9CA3AF'}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {ICONES_CAT[nome]||'💰'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: cores.textoCorpo, fontFamily: "'DM Sans',sans-serif" }}>{nome}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', fontFamily: "'DM Sans',sans-serif" }}>R$ {fmt(val)}</span>
                          </div>
                          <div style={{ height: 6, background: cores.bgTerciario, borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${(val/maxD)*100}%`, height: '100%', background: CORES_CAT[nome]||'#9CA3AF', borderRadius: 99, transition: 'width .5s ease' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
