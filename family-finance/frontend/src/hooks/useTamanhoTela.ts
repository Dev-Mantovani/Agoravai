import { useState, useEffect } from 'react';

export function useTamanhoTela() {
  const [largura, setLargura] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setLargura(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    largura,
    ehMobile: largura < 768,
    ehTablet: largura >= 768 && largura < 1024,
    ehDesktop: largura >= 768,
  };
}
