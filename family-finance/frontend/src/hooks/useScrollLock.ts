import { useEffect } from 'react';

/**
 * Trava o scroll da página enquanto um modal está aberto.
 * Fundamental para evitar o "pulo" no mobile (iOS/Android).
 */
export function useScrollLock(ativo = true) {
  useEffect(() => {
    if (!ativo) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    // Salva o scroll atual e trava
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      // Restaura o scroll na posição exata
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      html.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [ativo]);
}
