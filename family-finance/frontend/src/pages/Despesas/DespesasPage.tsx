import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { criarTransacoesRecorrentesMes } from '../../utils/recorrentes';
import { obterPeriodoMes, formatarData } from '../../utils/months';
import ModalDespesa from './DespesaModal';
import type { Transacao, MembroFamilia, Conta, Cartao } from '../../types';
import styles from '../Receitas/ReceitasPage.module.css';

interface PropsDespesasPage {
  idUsuario: string;
  mesAtual: number;
  anoAtual: number;
}

export default function PaginaDespesas({ idUsuario, mesAtual, anoAtual }: PropsDespesasPage) {
  const [despesas, setDespesas] = useState<Transacao[]>([]);
  const [membros, setMembros] = useState<MembroFamilia[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoDespesa, setEditandoDespesa] = useState<Transacao | null>(null);

  useEffect(() => {
    carregarDados();
  }, [idUsuario, mesAtual, anoAtual]);

  const carregarDados = async () => {
    const { dataInicioStr, dataFimStr } = obterPeriodoMes(anoAtual, mesAtual);
    await criarTransacoesRecorrentesMes(idUsuario, anoAtual, mesAtual);

    const [resDespesas, resMembros, resContas, resCartoes] = await Promise.all([
      supabase.from('transactions').select('*, membro:family_members(*)').eq('user_id', idUsuario).eq('tipo', 'despesa').gte('data', dataInicioStr).lte('data', dataFimStr).order('data', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', idUsuario),
      supabase.from('accounts').select('*').eq('user_id', idUsuario),
      supabase.from('cards').select('*').eq('user_id', idUsuario),
    ]);

    if (resDespesas.data) setDespesas(resDespesas.data);
    if (resMembros.data) setMembros(resMembros.data);
    if (resContas.data) setContas(resContas.data);
    if (resCartoes.data) setCartoes(resCartoes.data);
  };

  const excluir = async (id: string) => {
    if (window.confirm('Deseja excluir esta despesa?')) {
      await supabase.from('transactions').delete().eq('id', id);
      carregarDados();
    }
  };

  const totalDespesas = despesas.filter((d) => d.status === 'pago').reduce((soma, d) => soma + d.valor, 0);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h3 className={styles.pageTitle}><span>💸</span> Despesas</h3>
        <button className="btn-add" onClick={() => { setEditandoDespesa(null); setMostrarModal(true); }}>
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
            <button className="btn-secondary" style={{ display: 'inline-block', width: 'auto', padding: '12px 24px' }} onClick={() => setMostrarModal(true)}>
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
                  <span>{formatarData(d.data)}</span>
                  <span>•</span>
                  <span>{d.membro?.nome}</span>
                  <span className={`status-badge ${d.status}`}>{d.status}</span>
                </div>
              </div>
              <div className={`${styles.transactionAmount} ${styles.despesa}`}>
                -R$ {d.valor.toFixed(2)}
              </div>
              <div className={styles.transactionActions}>
                <button className="btn-icon" onClick={() => { setEditandoDespesa(d); setMostrarModal(true); }}>✏️</button>
                <button className="btn-icon" onClick={() => excluir(d.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {mostrarModal && (
        <ModalDespesa
          idUsuario={idUsuario}
          despesa={editandoDespesa}
          membros={membros}
          contas={contas}
          cartoes={cartoes}
          aoFechar={() => { setMostrarModal(false); setEditandoDespesa(null); }}
          aoSalvar={() => { carregarDados(); setMostrarModal(false); setEditandoDespesa(null); }}
        />
      )}
    </div>
  );
}
