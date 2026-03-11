import { useRef, useState, useCallback } from 'react';

interface Props {
  nome: string;
  cor: string;
  fotoAtual?: string | null;
  aoSelecionarArquivo: (arquivo: File, preview: string) => void;
  aoRemoverFoto?: () => void;
  tamanho?: number;
  coresUI: {
    bgCard: string;
    bgSecundario: string;
    bgTerciario: string;
    borda: string;
    textoCorpo: string;
    textoSutil: string;
    textoTitulo: string;
    vermelhFundo: string;
    vermelhoTexto: string;
  };
}

export default function AvatarPicker({
  nome,
  cor,
  fotoAtual,
  aoSelecionarArquivo,
  aoRemoverFoto,
  tamanho = 120,
  coresUI,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const [hover, setHover] = useState(false);

  const processarArquivo = useCallback((arquivo: File) => {
    if (!arquivo.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => aoSelecionarArquivo(arquivo, e.target?.result as string);
    reader.readAsDataURL(arquivo);
  }, [aoSelecionarArquivo]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const arquivo = e.dataTransfer.files[0];
    if (arquivo) processarArquivo(arquivo);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) processarArquivo(arquivo);
    e.target.value = '';
  };

  const temFoto = !!fotoAtual;
  const ativo = hover || arrastando;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

      {/* Zona de clique / drag */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Escolher foto"
        style={{ position: 'relative', cursor: 'pointer', outline: 'none' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        {/* Anel giratório quando hover */}
        {ativo && (
          <div style={{
            position: 'absolute', inset: -5, borderRadius: '50%',
            background: `conic-gradient(${cor} 0deg, transparent 120deg, ${cor} 240deg, transparent 360deg)`,
            animation: 'girarAnel 1.4s linear infinite',
            zIndex: 0,
          }} />
        )}

        {/* Círculo do avatar */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: tamanho, height: tamanho,
          borderRadius: '50%',
          overflow: 'hidden',
          background: temFoto ? '#000' : cor,
          boxShadow: ativo
            ? `0 0 0 3px ${coresUI.bgCard}, 0 0 0 5px ${cor}, 0 12px 32px ${cor}55`
            : `0 0 0 3px ${coresUI.bgCard}, 0 0 0 4px ${cor}44, 0 8px 24px ${cor}33`,
          transition: 'box-shadow .3s, transform .25s',
          transform: ativo ? 'scale(1.04)' : 'scale(1)',
        }}>
          {/* Foto ou inicial */}
          {temFoto ? (
            <img
              src={fotoAtual!}
              alt={nome}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity .3s', opacity: ativo ? 0.55 : 1 }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: tamanho * 0.38, fontWeight: 900,
              color: '#fff', letterSpacing: '-1px',
              fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
              userSelect: 'none',
              opacity: ativo ? 0.35 : 1,
              transition: 'opacity .25s',
            }}>
              {(nome?.[0] ?? '?').toUpperCase()}
            </div>
          )}

          {/* Overlay com ícone */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6,
            opacity: ativo ? 1 : 0,
            transition: 'opacity .22s',
          }}>
            {arrastando ? (
              <>
                <svg width="30" height="30" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, fontFamily: "'DM Sans',sans-serif" }}>SOLTAR!</span>
              </>
            ) : (
              <>
                <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, fontFamily: "'DM Sans',sans-serif" }}>
                  {temFoto ? 'TROCAR' : 'FOTO'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Badge câmera (visível quando não está em hover) */}
        <div style={{
          position: 'absolute', bottom: 2, right: 2, zIndex: 2,
          width: 30, height: 30, borderRadius: '50%',
          background: cor,
          border: `2.5px solid ${coresUI.bgCard}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${cor}77`,
          opacity: ativo ? 0 : 1,
          transform: ativo ? 'scale(0.7)' : 'scale(1)',
          transition: 'opacity .2s, transform .2s',
        }}>
          <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </div>

      {/* Rótulo */}
      <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: coresUI.textoCorpo, fontFamily: "'DM Sans',sans-serif" }}>
          {temFoto ? (nome || 'Foto adicionada') : 'Adicionar foto'}
        </div>
        <div style={{ fontSize: 11, color: coresUI.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 3 }}>
          {temFoto ? 'Clique ou arraste para trocar' : 'Clique ou arraste a imagem aqui'}
        </div>
      </div>

      {/* Botão remover */}
      {temFoto && aoRemoverFoto && (
        <button
          onClick={(e) => { e.stopPropagation(); aoRemoverFoto(); }}
          style={{
            padding: '6px 16px', borderRadius: 99,
            border: `1.5px solid ${coresUI.vermelhFundo}`,
            background: 'transparent',
            color: coresUI.vermelhoTexto,
            fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans',sans-serif",
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'background .18s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = coresUI.vermelhFundo}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Remover foto
        </button>
      )}

      {/* Input oculto */}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onInputChange} />

      <style>{`
        @keyframes girarAnel {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
