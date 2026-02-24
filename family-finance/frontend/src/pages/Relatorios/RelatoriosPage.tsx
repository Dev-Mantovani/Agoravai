import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { obterPeriodoMes, NOMES_MESES } from '../../utils/months';
import { useTema } from '../../contexts/TemaContexto';
import type { Transacao } from '../../types';

interface Props { idUsuario: string; mesAtual: number; anoAtual: number; }
const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

const CORES_CAT: Record<string, string> = { Aluguel:'#FFD93D',Moradia:'#FFD93D',Alimentação:'#6BCB77',Supermercado:'#6BCB77',Saúde:'#FF6B6B',Contas:'#FF6B6B',Transporte:'#4D96FF',Combustível:'#4D96FF',Educação:'#A78BFA',Roupas:'#C77DFF',Internet:'#8B7355',Assinaturas:'#FF9F43',Streamings:'#FF9F43',Lazer:'#26C6DA',Outros:'#9CA3AF',Freelance:'#34D399',Investimentos:'#059669',Bônus:'#F59E0B',Salário:'#10B981' };
const ICONES_CAT: Record<string, string> = { Salário:'💰',Freelance:'💼',Investimentos:'📈',Bônus:'🎁',Outros:'💵',Alimentação:'🍔',Moradia:'🏠',Transporte:'🚗',Saúde:'💊',Educação:'📚',Lazer:'🎮',Assinaturas:'📱',Contas:'⚡',Aluguel:'🏠',Supermercado:'🛒',Internet:'🌐',Combustível:'⛽',Roupas:'👗',Streamings:'📺' };

function GraficoDonut({ dados, total, cores }: { dados: any[]; total: number; cores: any }) {
  const raio = 78;
  const circ = 2 * Math.PI * raio;
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
      <text x="105" y="99" textAnchor="middle" fontSize="11" fill={cores.textoSutil} fontFamily="'DM Sans',sans-serif">Total</text>
      <text x="105" y="120" textAnchor="middle" fontSize="15" fontWeight="800" fill={cores.textoTitulo} fontFamily="'DM Sans',sans-serif">
        R$ {total.toLocaleString('pt-BR',{maximumFractionDigits:0})}
      </text>
    </svg>
  );
}

export default function PaginaRelatorios({ idUsuario, mesAtual, anoAtual }: Props) {
  const { cores } = useTema();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'despesa'|'receita'>('despesa');

  useEffect(() => { carregarDados(); }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async () => {
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    const { data } = await supabase.from('transactions').select('*').eq('user_id', idUsuario).gte('data', dataInicioStr).lte('data', dataFimStr);
    if (data) setTransacoes(data);
  };

  const filtradas = transacoes.filter(t => t.tipo === filtroTipo);
  const total = filtradas.reduce((s, t) => s + t.valor, 0);
  const porCat: Record<string,number> = {};
  filtradas.forEach(t => { porCat[t.categoria] = (porCat[t.categoria]||0)+t.valor; });
  const categorias = Object.entries(porCat).map(([nome,valor]) => ({ nome, valor, cor: CORES_CAT[nome]||'#9CA3AF', icone: ICONES_CAT[nome]||'💰' })).sort((a,b) => b.valor-a.valor);

  return (
    <div style={{ background: cores.bgPrimario, minHeight: '100vh', transition: 'background .3s' }}>
      <div style={{ padding: '61px 16px 0' }}>
        {/* Filtro receita/despesa */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['despesa','receita'] as const).map(tipo => (
            <button key={tipo} onClick={() => setFiltroTipo(tipo)} style={{ padding: '9px 20px', borderRadius: 99, border: 'none', cursor: 'pointer', background: filtroTipo === tipo ? cores.azulPrimario : cores.bgTerciario, color: filtroTipo === tipo ? '#fff' : cores.textoSutil, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}>
              {tipo === 'despesa' ? '💸 Despesas' : '💰 Receitas'}
            </button>
          ))}
        </div>

        {categorias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div>Sem dados para este período</div>
          </div>
        ) : (
          <>
            {/* Gráfico */}
            <div style={{ background: cores.bgCard, borderRadius: 24, padding: '20px 16px', border: `1px solid ${cores.borda}`, marginBottom: 20, boxShadow: cores.sombra, transition: 'background .3s' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif", marginBottom: 16 }}>
                {filtroTipo === 'despesa' ? 'Despesas' : 'Receitas'} por categoria
              </div>
              <GraficoDonut dados={categorias} total={total} cores={cores} />
            </div>

            {/* Grid categorias */}
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
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
