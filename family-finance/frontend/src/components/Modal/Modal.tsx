import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface PropsModal {
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

export default function Modal({ titulo, aoFechar, children }: PropsModal) {
  return (
    <div className={styles.overlay} onClick={aoFechar}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{titulo}</h2>
          <button className={styles.closeBtn} onClick={aoFechar}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
