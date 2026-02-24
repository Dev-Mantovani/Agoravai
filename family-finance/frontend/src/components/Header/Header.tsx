import { useState } from 'react';
import type { Usuario } from '../../types';
import { obterNomeMes } from '../../utils/months';
import styles from './Header.module.css';

interface PropsCabecalho {
  usuario: Usuario;
  aoSair: () => void;
  mesAtual: number;
  anoAtual: number;
  aoMesAnterior: () => void;
  aoProximoMes: () => void;
}

export default function Cabecalho({
  usuario,
  aoSair,
  mesAtual,
  anoAtual,
  aoMesAnterior,
  aoProximoMes,
}: PropsCabecalho) {
  const [mostrarMenu, setMostrarMenu] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.userGreeting}>
          <div className={styles.userAvatar}>
            {usuario.nome?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className={styles.greetingText}>
            <h2>Olá, {usuario.nome ?? 'Usuário'}!</h2>
            <p>Bem-vindo de volta</p>
          </div>
        </div>

        <div className={styles.menuWrapper}>
          <button className={styles.menuBtn} onClick={() => setMostrarMenu(!mostrarMenu)}>
            ⚙️
          </button>
          {mostrarMenu && (
            <div className={styles.dropdownMenu}>
              <button className={styles.menuItem} onClick={aoSair}>
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.monthSelector}>
        <button className={styles.monthBtn} onClick={aoMesAnterior}>‹</button>
        <div className={styles.currentMonth}>
          {obterNomeMes(mesAtual)} {anoAtual}
        </div>
        <button className={styles.monthBtn} onClick={aoProximoMes}>›</button>
      </div>
    </header>
  );
}
