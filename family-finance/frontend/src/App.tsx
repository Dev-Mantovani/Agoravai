import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Components
import Header from './components/Header/Header';
import BottomNav from './components/BottomNav/BottomNav';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';

// Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import ReceitasPage from './pages/Receitas/ReceitasPage';
import DespesasPage from './pages/Despesas/DespesasPage';
import MembrosPage from './pages/Membros/MembrosPage';
import AuthPage from './pages/Auth/AuthPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';

// Styles
import './styles/globals.css';

// Types
import type { User } from './types';

type View = 'dashboard' | 'receitas' | 'despesas' | 'membros';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email! });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user) { setCurrentUser(null); return; }

      const { data: profile } = await supabase
        .from('users_profile')
        .select('nome, onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      setCurrentUser({ id: session.user.id, email: session.user.email!, nome: profile?.nome });

      if (!profile?.onboarding_completed) setShowOnboarding(true);
    } catch (err) {
      console.error(err);
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
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  if (loading) return <LoadingScreen />;
  if (!currentUser) return <AuthPage onAuthSuccess={checkUser} />;
  if (showOnboarding) return (
    <OnboardingPage
      userId={currentUser.id}
      onComplete={() => { setShowOnboarding(false); checkUser(); }}
    />
  );

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', background: 'linear-gradient(180deg, #16213e 0%, #0f0f1e 100%)', position: 'relative' }}>
      <Header
        user={currentUser}
        onLogout={handleLogout}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />

      {activeView === 'dashboard' && (
        <DashboardPage userId={currentUser.id} currentMonth={currentMonth} currentYear={currentYear} />
      )}
      {activeView === 'receitas' && (
        <ReceitasPage userId={currentUser.id} currentMonth={currentMonth} currentYear={currentYear} />
      )}
      {activeView === 'despesas' && (
        <DespesasPage userId={currentUser.id} currentMonth={currentMonth} currentYear={currentYear} />
      )}
      {activeView === 'membros' && (
        <MembrosPage userId={currentUser.id} />
      )}

      <BottomNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
