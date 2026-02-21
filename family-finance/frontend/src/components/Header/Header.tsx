import { useState } from 'react';
import type { User } from '../../types';
import { getMonthName } from '../../utils/months';
import styles from './Header.module.css';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  currentMonth: number;
  currentYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export default function Header({
  user,
  onLogout,
  currentMonth,
  currentYear,
  onPreviousMonth,
  onNextMonth,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.userGreeting}>
          <div className={styles.userAvatar}>
            {user.nome?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className={styles.greetingText}>
            <h2>Olá, {user.nome ?? 'Usuário'}!</h2>
            <p>Bem-vindo de volta</p>
          </div>
        </div>

        <div className={styles.menuWrapper}>
          <button className={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>
            ⚙️
          </button>
          {showMenu && (
            <div className={styles.dropdownMenu}>
              <button className={styles.menuItem} onClick={onLogout}>
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.monthSelector}>
        <button className={styles.monthBtn} onClick={onPreviousMonth}>‹</button>
        <div className={styles.currentMonth}>
          {getMonthName(currentMonth)} {currentYear}
        </div>
        <button className={styles.monthBtn} onClick={onNextMonth}>›</button>
      </div>
    </header>
  );
}
