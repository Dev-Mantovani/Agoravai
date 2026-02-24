import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Tema = 'claro' | 'escuro';

interface CoresTema {
  // Fundos
  bgPrimario: string;
  bgSecundario: string;
  bgTerciario: string;
  bgCard: string;
  bgCardHover: string;
  // Bordas
  borda: string;
  // Textos
  textoTitulo: string;
  textoCorpo: string;
  textoSutil: string;
  // Ações
  azulPrimario: string;
  azulFundo: string;
  // Verde
  verdeFundo: string;
  verdeTexto: string;
  // Vermelho
  vermelhFundo: string;
  vermelhoTexto: string;
  // Amarelo
  amareloFundo: string;
  amareloTexto: string;
  // Sombra
  sombra: string;
}

interface TemaContextoTipo {
  tema: Tema;
  alternarTema: () => void;
  cores: CoresTema;
}

const CORES_CLARO: CoresTema = {
  bgPrimario:    '#ffffff',
  bgSecundario:  '#F9FAFB',
  bgTerciario:   '#F3F4F6',
  bgCard:        '#ffffff',
  bgCardHover:   '#F9FAFB',
  borda:         '#F3F4F6',
  textoTitulo:   '#111827',
  textoCorpo:    '#374151',
  textoSutil:    '#9CA3AF',
  azulPrimario:  '#3B82F6',
  azulFundo:     '#EFF6FF',
  verdeFundo:    '#F0FDF4',
  verdeTexto:    '#15803D',
  vermelhFundo:  '#FFF1F2',
  vermelhoTexto: '#B91C1C',
  amareloFundo:  '#FFFBEB',
  amareloTexto:  '#B45309',
  sombra:        '0 2px 12px rgba(0,0,0,.06)',
};

const CORES_ESCURO: CoresTema = {
  bgPrimario:    '#0F172A',
  bgSecundario:  '#1E293B',
  bgTerciario:   '#334155',
  bgCard:        '#1E293B',
  bgCardHover:   '#253349',
  borda:         '#334155',
  textoTitulo:   '#F1F5F9',
  textoCorpo:    '#CBD5E1',
  textoSutil:    '#64748B',
  azulPrimario:  '#3B82F6',
  azulFundo:     '#1E3A5F',
  verdeFundo:    '#052E16',
  verdeTexto:    '#4ADE80',
  vermelhFundo:  '#2D0A0A',
  vermelhoTexto: '#F87171',
  amareloFundo:  '#2D1B00',
  amareloTexto:  '#FCD34D',
  sombra:        '0 2px 12px rgba(0,0,0,.3)',
};

const TemaContexto = createContext<TemaContextoTipo>({
  tema: 'claro',
  alternarTema: () => {},
  cores: CORES_CLARO,
});

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    const salvo = localStorage.getItem('tema-app');
    return (salvo === 'escuro' ? 'escuro' : 'claro');
  });

  const cores = tema === 'claro' ? CORES_CLARO : CORES_ESCURO;

  const alternarTema = () => {
    setTema(t => {
      const novo = t === 'claro' ? 'escuro' : 'claro';
      localStorage.setItem('tema-app', novo);
      return novo;
    });
  };

  useEffect(() => {
    document.body.style.background = cores.bgPrimario;
    document.body.style.transition = 'background .3s ease';
  }, [tema]);

  return (
    <TemaContexto.Provider value={{ tema, alternarTema, cores }}>
      {children}
    </TemaContexto.Provider>
  );
}

export function useTema() {
  return useContext(TemaContexto);
}
