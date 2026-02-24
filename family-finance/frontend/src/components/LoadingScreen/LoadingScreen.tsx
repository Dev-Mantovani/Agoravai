import styles from './LoadingScreen.module.css';

export default function TelaDeCarga() {
  return (
    <div className={styles.screen}>
      <div className={styles.spinner} />
      <div className={styles.text}>Carregando...</div>
    </div>
  );
}
