import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { obterPeriodoMes } from '../../utils/months';
import TelaDeCarga from '../../components/LoadingScreen/LoadingScreen';
import type { Transacao, Cartao, Conta } from '../../types';
import styles from './DashboardPage.module.css';

interface PropsDashboard {
  idUsuario: string;
  mesAtual: number;
  anoAtual: number;
}

export default function PaginaDashboard({ idUsuario, mesAtual, anoAtual }: PropsDashboard) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [receitasRecorrentes, setReceitasRecorrentes] = useState<Transacao[]>([]);
  const [despesasRecorrentes, setDespesasRecorrentes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [idUsuario, mesAtual, anoAtual]);

  useEffect(() => {
    carregarRecorrentes();
  }, [idUsuario]);

  const carregarDados = async () => {
    setCarregando(true);
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    await criarTransacoesRecorrentesMes(idUsuario, anoAtual, mesAtual);

    const [resTransacoes, resCartoes, resContas] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, membro:family_members(*)')
        .eq('user_id', idUsuario)
        .gte('data', dataInicioStr)
        .lte('data', dataFimStr)
        .order('data', { ascending: false }),
      supabase.from('cards').select('*').eq('user_id', idUsuario),
      supabase.from('accounts').select('*').eq('user_id', idUsuario),
    ]);

    if (resTransacoes.data) setTransacoes(resTransacoes.data);
    if (resCartoes.data) setCartoes(resCartoes.data);
    if (resContas.data) setContas(resContas.data);
    setCarregando(false);
  };

  const carregarRecorrentes = async () => {
    const filtrarUnicos = (lista: Transacao[], campo: keyof Transacao) =>
      lista.reduce((acumulador: Transacao[], atual) => {
        if (!acumulador.find((r) => r[campo] === atual[campo])) acumulador.push(atual);
        return acumulador;
      }, []);

    const [resReceitas, resDespesas] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', idUsuario).eq('tipo', 'receita').eq('recorrente', true),
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', idUsuario).eq('tipo', 'despesa').eq('recorrente', true),
    ]);

    if (resReceitas.data) setReceitasRecorrentes(filtrarUnicos(resReceitas.data, 'titulo'));
    if (resDespesas.data) setDespesasRecorrentes(filtrarUnicos(resDespesas.data, 'titulo'));
  };

  if (carregando) return <TelaDeCarga />;

  const totalReceitas = transacoes.filter((t) => t.tipo === 'receita' && t.status === 'recebido').reduce((soma, t) => soma + t.valor, 0);
  const totalDespesas = transacoes.filter((t) => t.tipo === 'despesa' && t.status === 'pago').reduce((soma, t) => soma + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;
  const totalReceitasRecorrentes = receitasRecorrentes.reduce((soma, r) => soma + r.valor, 0);
  const totalDespesasRecorrentes = despesasRecorrentes.reduce((soma, d) => soma + d.valor, 0);

  return (
    <div className={styles.page}>
      {/* Resumo */}
      <section className={styles.summarySection}>
        <div className={styles.summaryCards}>
          {[
            { rotulo: '💵 Receitas do Mês', valor: totalReceitas,  classe: styles.receitas },
            { rotulo: '💳 Despesas do Mês', valor: totalDespesas,  classe: styles.despesas },
            { rotulo: '💎 Saldo Final',      valor: saldo,          classe: styles.saldo },
          ].map(({ rotulo, valor, classe }) => (
            <div key={rotulo} className={`${styles.summaryCard} ${classe}`}>
              <div className={styles.cardLabel}>{rotulo}</div>
              <div className={styles.cardValue}>
                <span className={styles.currency}>R$</span>
                <span>{valor.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recorrentes */}
      {(receitasRecorrentes.length > 0 || despesasRecorrentes.length > 0) && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}><span>🔄</span> Recorrentes Mensais</h3>
          </div>

          <div className={styles.recorrentesGrid}>
            {receitasRecorrentes.length > 0 && (
              <div className={`${styles.recorrenteCard} ${styles.receitas}`}>
                <div className={styles.recorrenteHeader}>
                  <div className={styles.recorrenteIcon}>💰</div>
                  <div className={styles.recorrenteInfo}>
                    <div className={styles.recorrenteLabel}>Receitas Fixas</div>
                    <div className={styles.recorrenteCount}>{receitasRecorrentes.length} fonte{receitasRecorrentes.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className={styles.recorrenteTotal}>R$ {totalReceitasRecorrentes.toFixed(2)}</div>
                </div>
                <div className={styles.recorrenteItems}>
                  {receitasRecorrentes.map((r) => (
                    <div key={r.id} className={styles.recorrenteItem}>
                      <span className={styles.recorrenteItemName}>{r.titulo}</span>
                      <span className={styles.recorrenteItemValue}>R$ {r.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {despesasRecorrentes.length > 0 && (
              <div className={`${styles.recorrenteCard} ${styles.despesas}`}>
                <div className={styles.recorrenteHeader}>
                  <div className={styles.recorrenteIcon}>💸</div>
                  <div className={styles.recorrenteInfo}>
                    <div className={styles.recorrenteLabel}>Despesas Fixas</div>
                    <div className={styles.recorrenteCount}>{despesasRecorrentes.length} conta{despesasRecorrentes.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className={styles.recorrenteTotal}>R$ {totalDespesasRecorrentes.toFixed(2)}</div>
                </div>
                <div className={styles.recorrenteItems}>
                  {despesasRecorrentes.map((d) => (
                    <div key={d.id} className={styles.recorrenteItem}>
                      <span className={styles.recorrenteItemName}>{d.titulo}</span>
                      <span className={styles.recorrenteItemValue}>R$ {d.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.recorrenteSummary}>
            <div className={`${styles.recorrenteSummaryItem} ${styles.positive}`}>
              <span>💰 Receitas Fixas</span>
              <strong>+R$ {totalReceitasRecorrentes.toFixed(2)}</strong>
            </div>
            <div className={`${styles.recorrenteSummaryItem} ${styles.negative}`}>
              <span>💸 Despesas Fixas</span>
              <strong>-R$ {totalDespesasRecorrentes.toFixed(2)}</strong>
            </div>
            <div className={`${styles.recorrenteSummaryItem} ${styles.balance}`}>
              <span>💎 Saldo Recorrente</span>
              <strong>R$ {(totalReceitasRecorrentes - totalDespesasRecorrentes).toFixed(2)}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Cartões */}
      {cartoes.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}><span>💳</span> Cartões</h3>
          </div>
          <div className={styles.cardsGrid}>
            {cartoes.map((cartao) => (
              <div key={cartao.id} className={styles.creditCard}>
                <div className={styles.cardHeaderInfo}>
                  <div className={styles.cardName}>
                    <div className={styles.cardDot} style={{ background: cartao.cor }} />
                    {cartao.nome}
                  </div>
                  <div className={styles.cardAmount}>R$ {cartao.usado.toFixed(2)}</div>
                </div>
                <div className={styles.progressLabel}>
                  <span>R$ {cartao.usado.toFixed(2)} de R$ {cartao.limite.toFixed(2)}</span>
                  <span>{((cartao.usado / cartao.limite) * 100).toFixed(1)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${(cartao.usado / cartao.limite) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contas */}
      {contas.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}><span>🏦</span> Contas</h3>
          </div>
          <div className={styles.cardsGrid}>
            {contas.map((conta) => (
              <div key={conta.id} className={styles.bankAccount}>
                <div className={styles.cardHeaderInfo}>
                  <div className={styles.cardName}>
                    <div className={styles.cardDot} style={{ background: conta.cor }} />
                    {conta.nome}
                  </div>
                  <div className={styles.cardAmount}>R$ {conta.saldo.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transações recentes */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}><span>📊</span> Transações Recentes</h3>
        </div>
        <div className={styles.transactionList}>
          {transacoes.slice(0, 5).map((t) => (
            <div key={t.id} className={styles.transactionItem}>
              <div
                className={styles.transactionIcon}
                style={{ background: t.tipo === 'receita' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)' }}
              >
                {t.tipo === 'receita' ? '💰' : '💸'}
              </div>
              <div className={styles.transactionInfo}>
                <div className={styles.transactionTitle}>{t.titulo}</div>
                <div className={styles.transactionDetails}>
                  <span>{t.membro?.nome ?? 'N/A'}</span>
                  <span className={`status-badge ${t.status}`}>{t.status}</span>
                </div>
              </div>
              <div className={`${styles.transactionAmount} ${styles[t.tipo]}`}>
                {t.tipo === 'receita' ? '+' : '-'}R$ {t.valor.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
