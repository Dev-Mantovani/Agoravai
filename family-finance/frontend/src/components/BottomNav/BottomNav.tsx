import styles from './BottomNav.module.css';

type View = 'dashboard' | 'receitas' | 'despesas' | 'membros';

interface BottomNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NAV_ITEMS: { view: View; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '🏠', label: 'Início' },
  { view: 'receitas', icon: '💰', label: 'Receitas' },
  { view: 'despesas', icon: '💸', label: 'Despesas' },
  { view: 'membros', icon: '👨‍👩‍👧‍👦', label: 'Família' },
];

export default function BottomNav({ activeView, setActiveView }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map(({ view, icon, label }) => (
        <button
          key={view}
          className={`${styles.navItem} ${activeView === view ? styles.active : ''}`}
          onClick={() => setActiveView(view)}
        >
          <span className={styles.navIcon}>{icon}</span>
          <span className={styles.navLabel}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
