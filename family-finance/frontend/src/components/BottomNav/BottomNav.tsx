import styles from './BottomNav.module.css';

type Tela = 'dashboard' | 'receitas' | 'despesas' | 'membros';

interface PropsNavegacaoInferior {
  telaAtiva: Tela;
  definirTela: (tela: Tela) => void;
}

const ITENS_NAV: { tela: Tela; icone: string; rotulo: string }[] = [
  { tela: 'dashboard', icone: '🏠', rotulo: 'Início' },
  { tela: 'receitas',  icone: '💰', rotulo: 'Receitas' },
  { tela: 'despesas',  icone: '💸', rotulo: 'Despesas' },
  { tela: 'membros',   icone: '👨‍👩‍👧‍👦', rotulo: 'Família' },
];

export default function NavegacaoInferior({ telaAtiva, definirTela }: PropsNavegacaoInferior) {
  return (
    <nav className={styles.nav}>
      {ITENS_NAV.map(({ tela, icone, rotulo }) => (
        <button
          key={tela}
          className={`${styles.navItem} ${telaAtiva === tela ? styles.active : ''}`}
          onClick={() => definirTela(tela)}
        >
          <span className={styles.navIcon}>{icone}</span>
          <span className={styles.navLabel}>{rotulo}</span>
        </button>
      ))}
    </nav>
  );
}
