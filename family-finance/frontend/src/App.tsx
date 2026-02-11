import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// ==================== SUPABASE CONFIG ====================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
// ==================== TYPES ====================
type FamilyType = 'sozinho' | 'casado' | 'morando_junto' | 'familia';

interface User {
  id: string;
  email: string;
  nome?: string;
}

interface FamilyMember {
  id: string;
  user_id: string;
  nome: string;
  relacao: string;
  cor: string;
}

interface Account {
  id: string;
  user_id: string;
  nome: string;
  tipo: 'corrente' | 'poupanca' | 'investimento';
  saldo: number;
  cor: string;
}

interface Card {
  id: string;
  user_id: string;
  nome: string;
  limite: number;
  usado: number;
  cor: string;
  fechamento_dia: number;
}

interface Transaction {
  id: string;
  user_id: string;
  tipo: 'receita' | 'despesa';
  titulo: string;
  valor: number;
  categoria: string;
  membro_id: string;
  membro?: FamilyMember;
  conta_id?: string;
  cartao_id?: string;
  recorrente: boolean;
  status: 'pago' | 'pendente' | 'recebido';
  data: string;
}

// ==================== TIPOS E FUNÇÕES GLOBAIS ====================

// Função para criar transações recorrentes automaticamente em cada mês
async function criarTransacoesRecorrentesMes(userId: string, year: number, month: number) {
  try {
    // Buscar todas as transações recorrentes do usuário (de qualquer mês)
    const { data: recorrentes } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('recorrente', true);

    if (!recorrentes || recorrentes.length === 0) return;

    // Agrupar por título para pegar apenas uma de cada
    const recorrentesUnicas = recorrentes.reduce((acc: any[], curr) => {
      if (!acc.find(r => r.titulo === curr.titulo && r.tipo === curr.tipo)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Para cada recorrente única, verificar se já existe no mês atual
    for (const recorrente of recorrentesUnicas) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Verificar se já existe no mês
      const { data: existente } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('titulo', recorrente.titulo)
        .eq('tipo', recorrente.tipo)
        .gte('data', startDate)
        .lte('data', endDate)
        .single();

      // Se não existe, criar
      if (!existente) {
        // Pegar o dia da transação original
        const diaOriginal = parseInt(recorrente.data.split('-')[2]);
        
        // Criar data para o mês atual (mesmo dia, ou último dia se o mês não tiver)
        const ultimoDiaMes = new Date(year, month, 0).getDate();
        const dia = Math.min(diaOriginal, ultimoDiaMes);
        const novaData = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const novaTransacao = {
          user_id: userId,
          tipo: recorrente.tipo,
          titulo: recorrente.titulo,
          valor: recorrente.valor,
          categoria: recorrente.categoria,
          membro_id: recorrente.membro_id,
          conta_id: recorrente.conta_id,
          cartao_id: recorrente.cartao_id,
          recorrente: true,
          status: 'pendente', // Sempre começa como pendente
          data: novaData
        };

        await supabase.from('transactions').insert(novaTransacao);
        console.log(`✅ Criada recorrente: ${recorrente.titulo} para ${novaData}`);
      }
    }
  } catch (error) {
    console.error('Erro ao criar recorrentes:', error);
  }
}

// ==================== MAIN APP ====================
export default function FamilyFinanceApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'receitas' | 'despesas' | 'membros'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    checkUser();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setCurrentUser({
        id: session.user.id,
        email: session.user.email!,
      });
    } else {
      setCurrentUser(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
    
  }, []);

 const checkUser = async () => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    if (!session?.user) {
      setCurrentUser(null);
      return;
    }
console.log("Session:", session);
console.log("User ID:", session?.user?.id);

    const { data: profile, error: profileError } = await supabase
      .from("users_profile")
      .select("nome, onboarding_completed")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao buscar profile:", profileError);
    }

    setCurrentUser({
      id: session.user.id,
      email: session.user.email!,
      nome: profile?.nome,
    });

    if (!profile || !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    setCurrentUser(null);
  } finally {
    setLoading(false);
  }
};


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowOnboarding(false);
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1];
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={checkUser} />;
  }

  if (showOnboarding) {
    return <OnboardingFlow userId={currentUser.id} onComplete={() => {
      setShowOnboarding(false);
      checkUser();
    }} />;
  }

  return (
    <div className="app-container">
      <Header 
        user={currentUser} 
        onLogout={handleLogout}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        getMonthName={getMonthName}
      />

      {activeView === 'dashboard' && <DashboardView userId={currentUser.id} currentMonth={currentMonth} currentYear={currentYear} />}
      {activeView === 'receitas' && <ReceitasView userId={currentUser.id} currentMonth={currentMonth} currentYear={currentYear} />}
      {activeView === 'despesas' && <DespesasView userId={currentUser.id} currentMonth={currentMonth} currentYear={currentYear} />}
      {activeView === 'membros' && <MembrosView userId={currentUser.id} />}

      <BottomNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}

// ==================== HEADER ====================
function Header({ user, onLogout, currentMonth, currentYear, onPreviousMonth, onNextMonth, getMonthName }: { 
  user: User; 
  onLogout: () => void;
  currentMonth: number;
  currentYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  getMonthName: (month: number) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="user-greeting">
          <div className="user-avatar">{user.nome?.[0]?.toUpperCase() || 'U'}</div>
          <div className="greeting-text">
            <h2>Olá, {user.nome || 'Usuário'}!</h2>
            <p>Bem-vindo de volta</p>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="notification-btn" onClick={() => setShowMenu(!showMenu)}>
            <span>⚙️</span>
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={onLogout} className="menu-item">
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="month-selector">
        <button onClick={onPreviousMonth}>‹</button>
        <div className="current-month">{getMonthName(currentMonth)} {currentYear}</div>
        <button onClick={onNextMonth}>›</button>
      </div>
    </header>
  );
}

// ==================== DASHBOARD VIEW ====================
function DashboardView({ userId, currentMonth, currentYear }: { userId: string; currentMonth: number; currentYear: number }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, currentMonth, currentYear]);

  const loadData = async () => {
    try {
      // Criar datas corretas para o mês inteiro
      const year = currentYear;
      const month = currentMonth;
      
      // Primeiro dia do mês
      const startDate = new Date(year, month - 1, 1);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Último dia do mês (vai para o próximo mês e volta 1 dia)
      const endDate = new Date(year, month, 0); // Dia 0 = último dia do mês anterior
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('Filtrando de', startDateStr, 'até', endDateStr);

      // Antes de carregar, criar transações recorrentes para este mês se não existirem
      await criarTransacoesRecorrentesMes(userId, year, month);

      const [transRes, membersRes, cardsRes, accountsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, membro:family_members(*)')
          .eq('user_id', userId)
          .gte('data', startDateStr)
          .lte('data', endDateStr)
          .order('data', { ascending: false }),
        supabase.from('family_members').select('*').eq('user_id', userId),
        supabase.from('cards').select('*').eq('user_id', userId),
        supabase.from('accounts').select('*').eq('user_id', userId)
      ]);

      console.log('Transações encontradas:', transRes.data?.length);

      if (transRes.data) setTransactions(transRes.data);
      if (membersRes.data) setMembers(membersRes.data);
      if (cardsRes.data) setCards(cardsRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const receitas = transactions.filter(t => t.tipo === 'receita' && t.status === 'recebido').reduce((sum, t) => sum + t.valor, 0);
  const despesas = transactions.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((sum, t) => sum + t.valor, 0);
  const saldo = receitas - despesas;

  // Calcular totais recorrentes (buscar de qualquer mês)
  const [receitasRecorrentes, setReceitasRecorrentes] = useState<Transaction[]>([]);
  const [despesasRecorrentes, setDespesasRecorrentes] = useState<Transaction[]>([]);

  useEffect(() => {
    loadRecorrentes();
  }, [userId]);

  const loadRecorrentes = async () => {
    const { data: receitasRec } = await supabase
      .from('transactions')
      .select('*, membro:family_members(*)')
      .eq('user_id', userId)
      .eq('tipo', 'receita')
      .eq('recorrente', true)
      .limit(1); // Pega só uma instância de cada recorrente

    const { data: despesasRec } = await supabase
      .from('transactions')
      .select('*, membro:family_members(*)')
      .eq('user_id', userId)
      .eq('tipo', 'despesa')
      .eq('recorrente', true)
      .limit(1);

    // Agrupar por título para evitar duplicatas
    const receitasUnicas = receitasRec?.reduce((acc: Transaction[], curr) => {
      if (!acc.find(r => r.titulo === curr.titulo)) acc.push(curr);
      return acc;
    }, []) || [];

    const despesasUnicas = despesasRec?.reduce((acc: Transaction[], curr) => {
      if (!acc.find(d => d.titulo === curr.titulo)) acc.push(curr);
      return acc;
    }, []) || [];

    setReceitasRecorrentes(receitasUnicas);
    setDespesasRecorrentes(despesasUnicas);
  };

  const totalReceitasRecorrentes = receitasRecorrentes.reduce((sum, r) => sum + r.valor, 0);
  const totalDespesasRecorrentes = despesasRecorrentes.reduce((sum, d) => sum + d.valor, 0);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <section className="summary-section">
        <div className="summary-cards">
          <div className="summary-card receitas">
            <div className="card-label">💵 Receitas do Mês</div>
            <div className="card-value">
              <span className="currency">R$</span>
              <span>{receitas.toFixed(2)}</span>
            </div>
          </div>

          <div className="summary-card despesas">
            <div className="card-label">💳 Despesas do Mês</div>
            <div className="card-value">
              <span className="currency">R$</span>
              <span>{despesas.toFixed(2)}</span>
            </div>
          </div>

          <div className="summary-card saldo">
            <div className="card-label">💎 Saldo Final</div>
            <div className="card-value">
              <span className="currency">R$</span>
              <span>{saldo.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recorrentes */}
      {(receitasRecorrentes.length > 0 || despesasRecorrentes.length > 0) && (
        <section className="section">
          <div className="section-header">
            <h3 className="section-title">
              <span>🔄</span>
              Recorrentes Mensais
            </h3>
          </div>

          <div className="recorrentes-grid">
            {/* Card de Receitas Recorrentes */}
            {receitasRecorrentes.length > 0 && (
              <div className="recorrente-card receitas">
                <div className="recorrente-header">
                  <div className="recorrente-icon">💰</div>
                  <div className="recorrente-info">
                    <div className="recorrente-label">Receitas Fixas</div>
                    <div className="recorrente-count">{receitasRecorrentes.length} fonte{receitasRecorrentes.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className="recorrente-total">
                    R$ {totalReceitasRecorrentes.toFixed(2)}
                  </div>
                </div>
                <div className="recorrente-items">
                  {receitasRecorrentes.map(rec => (
                    <div key={rec.id} className="recorrente-item">
                      <span className="recorrente-item-name">{rec.titulo}</span>
                      <span className="recorrente-item-value">R$ {rec.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card de Despesas Recorrentes */}
            {despesasRecorrentes.length > 0 && (
              <div className="recorrente-card despesas">
                <div className="recorrente-header">
                  <div className="recorrente-icon">💸</div>
                  <div className="recorrente-info">
                    <div className="recorrente-label">Despesas Fixas</div>
                    <div className="recorrente-count">{despesasRecorrentes.length} conta{despesasRecorrentes.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className="recorrente-total">
                    R$ {totalDespesasRecorrentes.toFixed(2)}
                  </div>
                </div>
                <div className="recorrente-items">
                  {despesasRecorrentes.map(desp => (
                    <div key={desp.id} className="recorrente-item">
                      <span className="recorrente-item-name">{desp.titulo}</span>
                      <span className="recorrente-item-value">R$ {desp.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resumo Recorrente */}
          <div className="recorrente-summary">
            <div className="recorrente-summary-item positive">
              <span>💰 Receitas Fixas</span>
              <strong>+R$ {totalReceitasRecorrentes.toFixed(2)}</strong>
            </div>
            <div className="recorrente-summary-item negative">
              <span>💸 Despesas Fixas</span>
              <strong>-R$ {totalDespesasRecorrentes.toFixed(2)}</strong>
            </div>
            <div className="recorrente-summary-item balance">
              <span>💎 Saldo Recorrente</span>
              <strong>R$ {(totalReceitasRecorrentes - totalDespesasRecorrentes).toFixed(2)}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Cartões */}
      {cards.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h3 className="section-title"><span>💳</span> Cartões</h3>
          </div>
          <div className="cards-grid">
            {cards.map(card => (
              <div key={card.id} className="credit-card">
                <div className="card-header-info">
                  <div className="card-name">
                    <div className="card-icon" style={{ background: card.cor }}></div>
                    {card.nome}
                  </div>
                  <div className="card-amount">R$ {card.usado.toFixed(2)}</div>
                </div>
                <div className="card-progress">
                  <div className="progress-label">
                    <span>R$ {card.usado.toFixed(2)} de R$ {card.limite.toFixed(2)}</span>
                    <span>{((card.usado / card.limite) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(card.usado / card.limite) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {accounts.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h3 className="section-title"><span>🏦</span> Contas</h3>
          </div>
          <div className="cards-grid">
            {accounts.map(account => (
              <div key={account.id} className="bank-account">
                <div className="card-header-info">
                  <div className="card-name">
                    <div className="card-icon" style={{ background: account.cor }}></div>
                    {account.nome}
                  </div>
                  <div className="card-amount">R$ {account.saldo.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-header">
          <h3 className="section-title"><span>📊</span> Transações Recentes</h3>
        </div>
        <div className="transactions-list">
          {transactions.slice(0, 5).map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-icon" style={{ 
                background: transaction.tipo === 'receita' ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)' 
              }}>
                {transaction.tipo === 'receita' ? '💰' : '💸'}
              </div>
              <div className="transaction-info">
                <div className="transaction-title">{transaction.titulo}</div>
                <div className="transaction-details">
                  <span>{transaction.membro?.nome || 'N/A'}</span>
                  <span className={`status-badge ${transaction.status}`}>{transaction.status}</span>
                </div>
              </div>
              <div className={`transaction-amount ${transaction.tipo}`}>
                {transaction.tipo === 'receita' ? '+' : '-'}R$ {transaction.valor.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ==================== RECEITAS VIEW ====================
function ReceitasView({ userId, currentMonth, currentYear }: { userId: string; currentMonth: number; currentYear: number }) {
  const [receitas, setReceitas] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, [userId, currentMonth, currentYear]);

  const loadData = async () => {
    // Criar datas corretas para o mês inteiro
    const year = currentYear;
    const month = currentMonth;
    
    // Primeiro dia do mês
    const startDate = new Date(year, month - 1, 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Último dia do mês
    const endDate = new Date(year, month, 0);
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('Receitas - Filtrando de', startDateStr, 'até', endDateStr);

    // Criar recorrentes antes de carregar
    await criarTransacoesRecorrentesMes(userId, year, month);

    const [recRes, memRes, accRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, membro:family_members(*)')
        .eq('user_id', userId)
        .eq('tipo', 'receita')
        .gte('data', startDateStr)
        .lte('data', endDateStr)
        .order('data', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', userId),
      supabase.from('accounts').select('*').eq('user_id', userId)
    ]);

    console.log('Receitas encontradas:', recRes.data?.length);

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

  const totalReceitas = receitas.filter(r => r.status === 'recebido').reduce((sum, r) => sum + r.valor, 0);

  return (
    <section className="section" style={{ paddingTop: '20px' }}>
      <div className="section-header">
        <h3 className="section-title"><span>💰</span> Receitas</h3>
        <button className="btn-add" onClick={() => { setEditingReceita(null); setShowModal(true); }}>
          + Adicionar
        </button>
      </div>
      
      <div className="summary-cards">
        <div className="summary-card receitas">
          <div className="card-label">Total de Receitas</div>
          <div className="card-value">
            <span className="currency">R$</span>
            <span>{totalReceitas.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="transactions-list" style={{ marginTop: '20px' }}>
        {receitas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Nenhuma receita cadastrada neste mês</p>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              Adicionar primeira receita
            </button>
          </div>
        ) : (
          receitas.map(receita => (
            <div key={receita.id} className="transaction-item">
              <div className="transaction-icon" style={{ background: 'rgba(46, 213, 115, 0.2)' }}>💰</div>
              <div className="transaction-info">
                <div className="transaction-title">
                  {receita.titulo}
                  {receita.recorrente && <span className="recorrente-badge">🔄</span>}
                </div>
                <div className="transaction-details">
                  <span>{receita.data.split('-').reverse().join('/')}</span>
                  <span>•</span>
                  <span>{receita.membro?.nome}</span>
                  <span className={`status-badge ${receita.status}`}>{receita.status}</span>
                </div>
              </div>
              <div className="transaction-amount receita">+R$ {receita.valor.toFixed(2)}</div>
              <div className="transaction-actions">
                <button onClick={() => { setEditingReceita(receita); setShowModal(true); }} className="btn-icon">✏️</button>
                <button onClick={() => handleDelete(receita.id)} className="btn-icon">🗑️</button>
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
    </section>
  );
}

// ==================== RECEITA MODAL ====================
function ReceitaModal({ userId, receita, members, accounts, onClose, onSave }: any) {
  const [titulo, setTitulo] = useState(receita?.titulo || '');
  const [valor, setValor] = useState(receita?.valor || '');
  const [categoria, setCategoria] = useState(receita?.categoria || 'Salário');
  const [membroId, setMembroId] = useState(receita?.membro_id || '');
  const [contaId, setContaId] = useState(receita?.conta_id || '');
  const [recorrente, setRecorrente] = useState(receita?.recorrente || false);
  const [status, setStatus] = useState(receita?.status || 'recebido');
  const [data, setData] = useState(receita?.data || new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    const receitaData = {
      user_id: userId,
      tipo: 'receita',
      titulo,
      valor: parseFloat(valor),
      categoria,
      membro_id: membroId,
      conta_id: contaId || null,
      recorrente,
      status,
      data
    };

    if (receita) {
      await supabase.from('transactions').update(receitaData).eq('id', receita.id);
    } else {
      await supabase.from('transactions').insert(receitaData);
    }

    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{receita ? 'Editar' : 'Nova'} Receita</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label className="form-label">Título</label>
          <input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Salário" />
        </div>

        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input className="form-input" type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" />
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select className="form-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="Salário">Salário</option>
            <option value="Freelance">Freelance</option>
            <option value="Investimentos">Investimentos</option>
            <option value="Bônus">Bônus</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Pessoa</label>
          <select className="form-select" value={membroId} onChange={e => setMembroId(e.target.value)}>
            <option value="">Selecione</option>
            {members.map((m: FamilyMember) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Conta</label>
          <select className="form-select" value={contaId} onChange={e => setContaId(e.target.value)}>
            <option value="">Selecione</option>
            {accounts.map((a: Account) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Data</label>
          <input className="form-input" type="date" value={data} onChange={e => setData(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="recebido">Recebido</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} />
            <span>Receita recorrente</span>
          </label>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={!titulo || !valor || !membroId}>
          {receita ? 'Atualizar' : 'Adicionar'} Receita
        </button>
      </div>
    </div>
  );
}

// ==================== DESPESAS VIEW ====================
function DespesasView({ userId, currentMonth, currentYear }: { userId: string; currentMonth: number; currentYear: number }) {
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
    // Criar datas corretas para o mês inteiro
    const year = currentYear;
    const month = currentMonth;
    
    // Primeiro dia do mês
    const startDate = new Date(year, month - 1, 1);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Último dia do mês
    const endDate = new Date(year, month, 0);
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('Despesas - Filtrando de', startDateStr, 'até', endDateStr);

    // Criar recorrentes antes de carregar
    await criarTransacoesRecorrentesMes(userId, year, month);

    const [despRes, memRes, accRes, cardRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, membro:family_members(*)')
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data', startDateStr)
        .lte('data', endDateStr)
        .order('data', { ascending: false }),
      supabase.from('family_members').select('*').eq('user_id', userId),
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('cards').select('*').eq('user_id', userId)
    ]);

    console.log('Despesas encontradas:', despRes.data?.length);

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

  const totalDespesas = despesas.filter(d => d.status === 'pago').reduce((sum, d) => sum + d.valor, 0);

  return (
    <section className="section" style={{ paddingTop: '20px' }}>
      <div className="section-header">
        <h3 className="section-title"><span>💸</span> Despesas</h3>
        <button className="btn-add" onClick={() => { setEditingDespesa(null); setShowModal(true); }}>
          + Adicionar
        </button>
      </div>
      
      <div className="summary-cards">
        <div className="summary-card despesas">
          <div className="card-label">Total de Despesas</div>
          <div className="card-value">
            <span className="currency">R$</span>
            <span>{totalDespesas.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="transactions-list" style={{ marginTop: '20px' }}>
        {despesas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Nenhuma despesa cadastrada neste mês</p>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              Adicionar primeira despesa
            </button>
          </div>
        ) : (
          despesas.map(despesa => (
            <div key={despesa.id} className="transaction-item">
              <div className="transaction-icon" style={{ background: 'rgba(255, 71, 87, 0.2)' }}>💸</div>
              <div className="transaction-info">
                <div className="transaction-title">
                  {despesa.titulo}
                  {despesa.recorrente && <span className="recorrente-badge">🔄</span>}
                </div>
                <div className="transaction-details">
                  <span>{despesa.data.split('-').reverse().join('/')}</span>
                  <span>•</span>
                  <span>{despesa.membro?.nome}</span>
                  <span className={`status-badge ${despesa.status}`}>{despesa.status}</span>
                </div>
              </div>
              <div className="transaction-amount despesa">-R$ {despesa.valor.toFixed(2)}</div>
              <div className="transaction-actions">
                <button onClick={() => { setEditingDespesa(despesa); setShowModal(true); }} className="btn-icon">✏️</button>
                <button onClick={() => handleDelete(despesa.id)} className="btn-icon">🗑️</button>
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
    </section>
  );
}

// ==================== DESPESA MODAL ====================
function DespesaModal({ userId, despesa, members, accounts, cards, onClose, onSave }: any) {
  const [titulo, setTitulo] = useState(despesa?.titulo || '');
  const [valor, setValor] = useState(despesa?.valor || '');
  const [categoria, setCategoria] = useState(despesa?.categoria || 'Alimentação');
  const [membroId, setMembroId] = useState(despesa?.membro_id || '');
  const [contaId, setContaId] = useState(despesa?.conta_id || '');
  const [cartaoId, setCartaoId] = useState(despesa?.cartao_id || '');
  const [recorrente, setRecorrente] = useState(despesa?.recorrente || false);
  const [status, setStatus] = useState(despesa?.status || 'pago');
  const [data, setData] = useState(despesa?.data || new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    const despesaData = {
      user_id: userId,
      tipo: 'despesa',
      titulo,
      valor: parseFloat(valor),
      categoria,
      membro_id: membroId,
      conta_id: contaId || null,
      cartao_id: cartaoId || null,
      recorrente,
      status,
      data
    };

    if (despesa) {
      await supabase.from('transactions').update(despesaData).eq('id', despesa.id);
    } else {
      await supabase.from('transactions').insert(despesaData);
    }

    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{despesa ? 'Editar' : 'Nova'} Despesa</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label className="form-label">Título</label>
          <input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Mercado" />
        </div>

        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input className="form-input" type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" />
        </div>

        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select className="form-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="Alimentação">Alimentação</option>
            <option value="Moradia">Moradia</option>
            <option value="Transporte">Transporte</option>
            <option value="Saúde">Saúde</option>
            <option value="Educação">Educação</option>
            <option value="Lazer">Lazer</option>
            <option value="Assinaturas">Assinaturas</option>
            <option value="Contas">Contas</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Pessoa</label>
          <select className="form-select" value={membroId} onChange={e => setMembroId(e.target.value)}>
            <option value="">Selecione</option>
            {members.map((m: FamilyMember) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Conta</label>
          <select className="form-select" value={contaId} onChange={e => setContaId(e.target.value)}>
            <option value="">Selecione (opcional)</option>
            {accounts.map((a: Account) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Cartão</label>
          <select className="form-select" value={cartaoId} onChange={e => setCartaoId(e.target.value)}>
            <option value="">Selecione (opcional)</option>
            {cards.map((c: Card) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Data</label>
          <input className="form-input" type="date" value={data} onChange={e => setData(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} />
            <span>Despesa recorrente</span>
          </label>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={!titulo || !valor || !membroId}>
          {despesa ? 'Atualizar' : 'Adicionar'} Despesa
        </button>
      </div>
    </div>
  );
}

// ==================== MEMBROS VIEW ====================
function MembrosView({ userId }: { userId: string }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    loadMembers();
  }, [userId]);

  const loadMembers = async () => {
    const { data } = await supabase.from('family_members').select('*').eq('user_id', userId);
    if (data) setMembers(data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir este membro?')) {
      await supabase.from('family_members').delete().eq('id', id);
      loadMembers();
    }
  };

  return (
    <section className="section" style={{ paddingTop: '20px' }}>
      <div className="section-header">
        <h3 className="section-title"><span>👨‍👩‍👧‍👦</span> Membros da Família</h3>
        <button className="btn-add" onClick={() => { setEditingMember(null); setShowModal(true); }}>
          + Adicionar
        </button>
      </div>

      <div className="members-grid">
        {members.map(member => (
          <div key={member.id} className="member-card">
            <div className="member-avatar" style={{ background: member.cor }}>
              {member.nome[0].toUpperCase()}
            </div>
            <div className="member-name">{member.nome}</div>
            <div className="member-relation">{member.relacao}</div>
            <div className="member-actions">
              <button onClick={() => { setEditingMember(member); setShowModal(true); }} className="btn-icon-small">✏️</button>
              <button onClick={() => handleDelete(member.id)} className="btn-icon-small">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <MemberModal
          userId={userId}
          member={editingMember}
          onClose={() => { setShowModal(false); setEditingMember(null); }}
          onSave={() => { loadMembers(); setShowModal(false); setEditingMember(null); }}
        />
      )}
    </section>
  );
}

// ==================== MEMBER MODAL ====================
function MemberModal({ userId, member, onClose, onSave }: any) {
  const [nome, setNome] = useState(member?.nome || '');
  const [relacao, setRelacao] = useState(member?.relacao || 'conjuge');
  const [cor, setCor] = useState(member?.cor || '#667eea');

  const colors = ['#667eea', '#2ed573', '#ffc312', '#ff4757', '#764ba2', '#26de81'];

  const handleSave = async () => {
    const memberData = { user_id: userId, nome, relacao, cor };

    if (member) {
      await supabase.from('family_members').update(memberData).eq('id', member.id);
    } else {
      await supabase.from('family_members').insert(memberData);
    }

    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{member ? 'Editar' : 'Novo'} Membro</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label className="form-label">Nome</label>
          <input className="form-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João" />
        </div>

        <div className="form-group">
          <label className="form-label">Relação</label>
          <select className="form-select" value={relacao} onChange={e => setRelacao(e.target.value)}>
            <option value="conjuge">Cônjuge</option>
            <option value="filho">Filho(a)</option>
            <option value="mae">Mãe</option>
            <option value="pai">Pai</option>
            <option value="irmao">Irmão(ã)</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Cor</label>
          <div className="color-picker">
            {colors.map(c => (
              <div
                key={c}
                className={`color-option ${cor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setCor(c)}
              />
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={!nome}>
          {member ? 'Atualizar' : 'Adicionar'} Membro
        </button>
      </div>
    </div>
  );
}

// ==================== BOTTOM NAV ====================
function BottomNav({ activeView, setActiveView }: any) {
  return (
    <nav className="bottom-nav">
      <div className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
        <div className="nav-icon">🏠</div>
        <div className="nav-label">Início</div>
      </div>
      <div className={`nav-item ${activeView === 'receitas' ? 'active' : ''}`} onClick={() => setActiveView('receitas')}>
        <div className="nav-icon">💰</div>
        <div className="nav-label">Receitas</div>
      </div>
      <div className={`nav-item ${activeView === 'despesas' ? 'active' : ''}`} onClick={() => setActiveView('despesas')}>
        <div className="nav-icon">💸</div>
        <div className="nav-label">Despesas</div>
      </div>
      <div className={`nav-item ${activeView === 'membros' ? 'active' : ''}`} onClick={() => setActiveView('membros')}>
        <div className="nav-icon">👨‍👩‍👧‍👦</div>
        <div className="nav-label">Família</div>
      </div>
    </nav>
  );
}

// ==================== LOADING SCREEN ====================
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <div className="loading-text">Carregando...</div>
    </div>
  );
}

// ==================== AUTH SCREEN ====================
function AuthScreen({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Conta criada com sucesso! Faça login para continuar.');
        setIsLogin(true);
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
        </h1>
        <p className="auth-subtitle">
          {isLogin ? 'Entre para gerenciar suas finanças' : 'Comece a organizar suas finanças'}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleAuth} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta')}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== ONBOARDING FLOW ====================
function OnboardingFlow({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState('');
  const [familyType, setFamilyType] = useState<FamilyType>('familia');
  const [members, setMembers] = useState<Array<{ nome: string; relacao: string; cor: string }>>([]);
  const [currentMemberName, setCurrentMemberName] = useState('');
  const [currentMemberRelacao, setCurrentMemberRelacao] = useState('conjuge');
  const [selectedColor, setSelectedColor] = useState('');

  const colors = ['#667eea', '#2ed573', '#ffc312', '#ff4757', '#764ba2', '#26de81'];

  const handleAddMember = () => {
    if (currentMemberName && selectedColor) {
      setMembers([...members, {
        nome: currentMemberName,
        relacao: currentMemberRelacao,
        cor: selectedColor
      }]);
      setCurrentMemberName('');
      setSelectedColor('');
    }
  };

  const handleComplete = async () => {
  try {
    const { error: profileError } = await supabase
      .from('users_profile')
      .update({
        nome,
        family_type: familyType,
        onboarding_completed: true
      })
      .eq('id', userId);

    if (profileError) {
      console.error("Erro no profile:", profileError);
      return;
    }

    for (const member of members) {
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          user_id: userId,
          ...member
        });

      if (memberError) {
        console.error("Erro member:", memberError);
        return;
      }
    }

    onComplete();
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
};


  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {step === 1 && (
          <>
            <h1 className="onboarding-title">Qual é o seu nome?</h1>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => setStep(2)}
              disabled={!nome.trim()}
            >
              Continuar
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="onboarding-title">Como é sua família?</h1>
            <div className="family-type-grid">
              {[
                { value: 'sozinho', label: 'Moro sozinho(a)', icon: '👤' },
                { value: 'casado', label: 'Casado(a)', icon: '💑' },
                { value: 'morando_junto', label: 'Morando junto', icon: '👫' },
                { value: 'familia', label: 'Família', icon: '👨‍👩‍👧‍👦' }
              ].map((option) => (
                <div
                  key={option.value}
                  className={`family-type-card ${familyType === option.value ? 'selected' : ''}`}
                  onClick={() => setFamilyType(option.value as FamilyType)}
                >
                  <span className="family-type-icon">{option.icon}</span>
                  <div className="family-type-label">{option.label}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setStep(3)}>
              Continuar
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="onboarding-title">Adicione os membros</h1>
            <p className="onboarding-subtitle">
              Cadastre as pessoas que dividem as finanças com você
            </p>

            {members.length > 0 && (
              <div className="added-members-list">
                {members.map((member, index) => (
                  <div key={index} className="added-member-item">
                    <div className="added-member-avatar" style={{ background: member.cor }}>
                      {member.nome[0].toUpperCase()}
                    </div>
                    <div className="added-member-info">
                      <div className="added-member-name">{member.nome}</div>
                      <div className="added-member-relation">{member.relacao}</div>
                    </div>
                    <button 
                      className="remove-member-btn"
                      onClick={() => setMembers(members.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: João"
                value={currentMemberName}
                onChange={(e) => setCurrentMemberName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relação</label>
              <select 
                className="form-select"
                value={currentMemberRelacao}
                onChange={(e) => setCurrentMemberRelacao(e.target.value)}
              >
                <option value="conjuge">Cônjuge</option>
                <option value="filho">Filho(a)</option>
                <option value="mae">Mãe</option>
                <option value="pai">Pai</option>
                <option value="irmao">Irmão(ã)</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cor</label>
              <div className="color-picker">
                {colors.map((color) => (
                  <div
                    key={color}
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <button
              className="btn-secondary"
              onClick={handleAddMember}
              disabled={!currentMemberName.trim() || !selectedColor}
            >
              Adicionar Membro
            </button>

            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={members.length === 0}
            >
              Finalizar Configuração
            </button>

            {members.length === 0 && (
              <p className="hint-text">
                Adicione pelo menos um membro para continuar
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
