import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { obterPeriodoMes, formatarData } from '../../utils/months';
import ModalReceita from './ReceitaModal';
import type { Transacao, MembroFamilia, Conta } from '../../types';
import styles from './ReceitasPage.module.css';

interface PropsReceitasPage {
  idUsuario: string;
  mesAtual: number;
  anoAtual: number;
}

export default function PaginaReceitas({ idUsuario, mesAtual, anoAtual }: PropsReceitasPage) {
  const [receitas, setReceitas] = useState<Transacao[]>([]);
  const [membros, setMembros] = useState<MembroFamilia[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoReceita, setEditandoReceita] = useState<Transacao | null>(null);

  useEffect(() => {
    carregarDados();
  }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async () => {
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    await criarTransacoesRecorrentesMes(idUsuario, anoAtual, mesAtual);

    const [resReceitas, resMembros, resContas] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', idUsuario).eq('tipo', 'receita').gte('data', dataInicioStr).lte('data', dataFimStr).order('data', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', idUsuario),
      supabase.from('accounts').select('*').eq('user_id', idUsuario),
    ]);

    if (resReceitas.data) setReceitas(resReceitas.data);
    if (resMembros.data) setMembros(resMembros.data);
    if (resContas.data) setContas(resContas.data);
  };

  const excluir = async (id: string) => {
    if (window.confirm('Deseja excluir esta receita?')) {
      await supabase.from('transactions').delete().eq('id', id);
      carregarDados();
    }
  };

  const totalReceitas = receitas.filter((r) => r.status === 'recebido').reduce((soma, r) => soma + r.valor, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h3 className={styles.pageTitle}><span>💰</span> Receitas</h3>
        <button className="btn-add" onClick={() => { setEditandoReceita(null); setMostrarModal(true); }}>
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
            <button className="btn-secondary" style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }} onClick={() => setMostrarModal(true)}>
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
                  <span>{formatarData(r.data)}</span>
                  <span>•</span>
                  <span>{r.membro?.nome}</span>
                  <span className={`status-badge ${r.status}`}>{r.status}</span>
                </div>
              </div>
              <div className={`${styles.transactionAmount} ${styles.receita}`}>
                +R$ {r.valor.toFixed(2)}
              </div>
              <div className={styles.transactionActions}>
                <button className="btn-icon" onClick={() => { setEditandoReceita(r); setMostrarModal(true); }}>✏️</button>
                <button className="btn-icon" onClick={() => excluir(r.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {mostrarModal && (
        <ModalReceita
          idUsuario={idUsuario}
          receita={editandoReceita}
          membros={membros}
          contas={contas}
          aoFechar={() => { setMostrarModal(false); setEditandoReceita(null); }}
          aoSalvar={() => { carregarDados(); setMostrarModal(false); setEditandoReceita(null); }}
        />
      )}
    </div>
  );
}
