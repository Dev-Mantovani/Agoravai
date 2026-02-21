import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { getMonthDateRange } from '../../utils/months';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import type { Transaction, Card, Account } from '../../types';
import styles from './DashboardPage.module.css';

interface DashboardPageProps {
  userId: string;
  currentMonth: number;
  currentYear: number;
}

export default function DashboardPage({ userId, currentMonth, currentYear }: DashboardPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [receitasRecorrentes, setReceitasRecorrentes] = useState<Transaction[]>([]);
  const [despesasRecorrentes, setDespesasRecorrentes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, currentMonth, currentYear]);

  useEffect(() => {
    loadRecorrentes();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const { startDateStr, endDateStr } = getMonthDateRange(currentYear, currentMonth);
    await criarTransacoesRecorrentesMes(userId, currentYear, currentMonth);

    const [transRes, cardsRes, accountsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, membro:family_members(*)')
        .eq('user_id', userId)
        .gte('data', startDateStr)
        .lte('data', endDateStr)
        .order('data', { ascending: false }),
      supabase.from('cards').select('*').eq('user_id', userId),
      supabase.from('accounts').select('*').eq('user_id', userId),
    ]);

    if (transRes.data) setTransactions(transRes.data);
    if (cardsRes.data) setCards(cardsRes.data);
    if (accountsRes.data) setAccounts(accountsRes.data);
    setLoading(false);
  };

  const loadRecorrentes = async () => {
    const uniqueBy = (arr: Transaction[], key: keyof Transaction) =>
      arr.reduce((acc: Transaction[], curr) => {
        if (!acc.find((r) => r[key] === curr[key])) acc.push(curr);
        return acc;
      }, []);

    const [recRes, despRes] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', userId).eq('tipo', 'receita').eq('recorrente', true),
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', userId).eq('tipo', 'despesa').eq('recorrente', true),
    ]);

    if (recRes.data) setReceitasRecorrentes(uniqueBy(recRes.data, 'titulo'));
    if (despRes.data) setDespesasRecorrentes(uniqueBy(despRes.data, 'titulo'));
  };

  if (loading) return <LoadingScreen />;

  const receitas = transactions.filter((t) => t.tipo === 'receita' && t.status === 'recebido').reduce((s, t) => s + t.valor, 0);
  const despesas = transactions.filter((t) => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
  const saldo = receitas - despesas;
  const totalRecRec = receitasRecorrentes.reduce((s, r) => s + r.valor, 0);
  const totalDespRec = despesasRecorrentes.reduce((s, d) => s + d.valor, 0);

  return (
    <div className={styles.page}>
      {/* Summary */}
      <section className={styles.summarySection}>
        <div className={styles.summaryCards}>
          {[
            { label: '💵 Receitas do Mês', value: receitas, cls: styles.receitas },
            { label: '💳 Despesas do Mês', value: despesas, cls: styles.despesas },
            { label: '💎 Saldo Final', value: saldo, cls: styles.saldo },
          ].map(({ label, value, cls }) => (
            <div key={label} className={`${styles.summaryCard} ${cls}`}>
              <div className={styles.cardLabel}>{label}</div>
              <div className={styles.cardValue}>
                <span className={styles.currency}>R$</span>
                <span>{value.toFixed(2)}</span>
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
                  <div className={styles.recorrenteTotal}>R$ {totalRecRec.toFixed(2)}</div>
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
                  <div className={styles.recorrenteTotal}>R$ {totalDespRec.toFixed(2)}</div>
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
              <strong>+R$ {totalRecRec.toFixed(2)}</strong>
            </div>
            <div className={`${styles.recorrenteSummaryItem} ${styles.negative}`}>
              <span>💸 Despesas Fixas</span>
              <strong>-R$ {totalDespRec.toFixed(2)}</strong>
            </div>
            <div className={`${styles.recorrenteSummaryItem} ${styles.balance}`}>
              <span>💎 Saldo Recorrente</span>
              <strong>R$ {(totalRecRec - totalDespRec).toFixed(2)}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Cartões */}
      {cards.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}><span>💳</span> Cartões</h3>
          </div>
          <div className={styles.cardsGrid}>
            {cards.map((card) => (
              <div key={card.id} className={styles.creditCard}>
                <div className={styles.cardHeaderInfo}>
                  <div className={styles.cardName}>
                    <div className={styles.cardDot} style={{ background: card.cor }} />
                    {card.nome}
                  </div>
                  <div className={styles.cardAmount}>R$ {card.usado.toFixed(2)}</div>
                </div>
                <div className={styles.progressLabel}>
                  <span>R$ {card.usado.toFixed(2)} de R$ {card.limite.toFixed(2)}</span>
                  <span>{((card.usado / card.limite) * 100).toFixed(1)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${(card.usado / card.limite) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contas */}
      {accounts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}><span>🏦</span> Contas</h3>
          </div>
          <div className={styles.cardsGrid}>
            {accounts.map((acc) => (
              <div key={acc.id} className={styles.bankAccount}>
                <div className={styles.cardHeaderInfo}>
                  <div className={styles.cardName}>
                    <div className={styles.cardDot} style={{ background: acc.cor }} />
                    {acc.nome}
                  </div>
                  <div className={styles.cardAmount}>R$ {acc.saldo.toFixed(2)}</div>
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
          {transactions.slice(0, 5).map((t) => (
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
