import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { getMonthDateRange, formatDate } from '../../utils/months';
import ReceitaModal from './ReceitaModal';
import type { Transaction, FamilyMember, Account } from '../../types';
import styles from './ReceitasPage.module.css';

interface ReceitasPageProps {
  userId: string;
  currentMonth: number;
  currentYear: number;
}

export default function ReceitasPage({ userId, currentMonth, currentYear }: ReceitasPageProps) {
  const [receitas, setReceitas] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, [userId, currentMonth, currentYear]);

  const loadData = async () => {
    const { startDateStr, endDateStr } = getMonthDateRange(currentYear, currentMonth);
    await criarTransacoesRecorrentesMes(userId, currentYear, currentMonth);

    const [recRes, memRes, accRes] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', userId).eq('tipo', 'receita').gte('data', startDateStr).lte('data', endDateStr).order('data', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', userId),
      supabase.from('accounts').select('*').eq('user_id', userId),
    ]);

    if (recRes.data) setReceitas(recRes.data);
    if (memRes.data) setMembers(memRes.data);
    if (accRes.data) setAccounts(accRes.data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir esta receita?')) {
      await supabase.from('transactions').delete().eq('id', id);
      loadData();
    }
  };

  const totalReceitas = receitas.filter((r) => r.status === 'recebido').reduce((s, r) => s + r.valor, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h3 className={styles.pageTitle}><span>💰</span> Receitas</h3>
        <button className="btn-add" onClick={() => { setEditingReceita(null); setShowModal(true); }}>
          + Adicionar
        </button>
      </div>

      <div className={`${styles.summaryCard} ${styles.receitas}`}>
        <div className={styles.cardLabel}>Total de Receitas</div>
        <div className={styles.cardValue}>
          <span className={styles.currency}>R$</span>
          <span>{totalReceitas.toFixed(2)}</span>
        </div>
      </div>

      <div className={styles.transactionList}>
        {receitas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Nenhuma receita cadastrada neste mês</p>
            <button className="btn-secondary" style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }} onClick={() => setShowModal(true)}>
              Adicionar primeira receita
            </button>
          </div>
        ) : (
          receitas.map((r) => (
            <div key={r.id} className={styles.transactionItem}>
              <div className={styles.transactionIcon} style={{ background: 'rgba(46, 213, 115, 0.2)' }}>💰</div>
              <div className={styles.transactionInfo}>
                <div className={styles.transactionTitle}>
                  {r.titulo}
                  {r.recorrente && <span className="recorrente-badge">🔄</span>}
                </div>
                <div className={styles.transactionDetails}>
                  <span>{formatDate(r.data)}</span>
                  <span>•</span>
                  <span>{r.membro?.nome}</span>
                  <span className={`status-badge ${r.status}`}>{r.status}</span>
                </div>
              </div>
              <div className={`${styles.transactionAmount} ${styles.receita}`}>
                +R$ {r.valor.toFixed(2)}
              </div>
              <div className={styles.transactionActions}>
                <button className="btn-icon" onClick={() => { setEditingReceita(r); setShowModal(true); }}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(r.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ReceitaModal
          userId={userId}
          receita={editingReceita}
          members={members}
          accounts={accounts}
          onClose={() => { setShowModal(false); setEditingReceita(null); }}
          onSave={() => { loadData(); setShowModal(false); setEditingReceita(null); }}
        />
      )}
    </div>
  );
}
