import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { getMonthDateRange, formatDate } from '../../utils/months';
import DespesaModal from './DespesaModal';
import type { Transaction, FamilyMember, Account, Card } from '../../types';
// Reuse same CSS module pattern as Receitas
import styles from '../Receitas/ReceitasPage.module.css';

interface DespesasPageProps {
  userId: string;
  currentMonth: number;
  currentYear: number;
}

export default function DespesasPage({ userId, currentMonth, currentYear }: DespesasPageProps) {
  const [despesas, setDespesas] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, [userId, currentMonth, currentYear]);

  const loadData = async () => {
    const { startDateStr, endDateStr } = getMonthDateRange(currentYear, currentMonth);
    await criarTransacoesRecorrentesMes(userId, currentYear, currentMonth);

    const [despRes, memRes, accRes, cardRes] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', userId).eq('tipo', 'despesa').gte('data', startDateStr).lte('data', endDateStr).order('data', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', userId),
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('cards').select('*').eq('user_id', userId),
    ]);

    if (despRes.data) setDespesas(despRes.data);
    if (memRes.data) setMembers(memRes.data);
    if (accRes.data) setAccounts(accRes.data);
    if (cardRes.data) setCards(cardRes.data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir esta despesa?')) {
      await supabase.from('transactions').delete().eq('id', id);
      loadData();
    }
  };

  const totalDespesas = despesas.filter((d) => d.status === 'pago').reduce((s, d) => s + d.valor, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h3 className={styles.pageTitle}><span>💸</span> Despesas</h3>
        <button className="btn-add" onClick={() => { setEditingDespesa(null); setShowModal(true); }}>
          + Adicionar
        </button>
      </div>

      <div className={`${styles.summaryCard} ${styles.despesas}`}>
        <div className={styles.cardLabel}>Total de Despesas</div>
        <div className={styles.cardValue}>
          <span className={styles.currency}>R$</span>
          <span>{totalDespesas.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.transactionList}>
        {despesas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Nenhuma despesa cadastrada neste mês</p>
            <button className="btn-secondary" style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }} onClick={() => setShowModal(true)}>
              Adicionar primeira despesa
            </button>
          </div>
        ) : (
          despesas.map((d) => (
            <div key={d.id} className={styles.transactionItem}>
              <div className={styles.transactionIcon} style={{ background: 'rgba(255, 71, 87, 0.2)' }}>💸</div>
              <div className={styles.transactionInfo}>
                <div className={styles.transactionTitle}>
                  {d.titulo}
                  {d.recorrente && <span className="recorrente-badge">🔄</span>}
                </div>
                <div className={styles.transactionDetails}>
                  <span>{formatDate(d.data)}</span>
                  <span>•</span>
                  <span>{d.membro?.nome}</span>
                  <span className={`status-badge ${d.status}`}>{d.status}</span>
                </div>
              </div>
              <div className={`${styles.transactionAmount} ${styles.despesa}`}>
                -R$ {d.valor.toFixed(2)}
              </div>
              <div className={styles.transactionActions}>
                <button className="btn-icon" onClick={() => { setEditingDespesa(d); setShowModal(true); }}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(d.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <DespesaModal
          userId={userId}
          despesa={editingDespesa}
          members={members}
          accounts={accounts}
          cards={cards}
          onClose={() => { setShowModal(false); setEditingDespesa(null); }}
          onSave={() => { loadData(); setShowModal(false); setEditingDespesa(null); }}
        />
      )}
    </div>
  );
}
