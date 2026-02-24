import { useTema } from '../../contexts/TemaContexto';

type Tela = 'dashboard' | 'transacoes' | 'relatorios' | 'membros';
interface Props { telaAtiva: Tela; definirTela: (t: Tela) => void; }

const IconHome = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconList = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconChart = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconUsers = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const ABAS: { id: Tela; icone: React.ReactNode; rotulo: string }[] = [
  { id:'dashboard',  icone:<IconHome />,  rotulo:'Início' },
  { id:'transacoes', icone:<IconList />,  rotulo:'Transações' },
  { id:'relatorios', icone:<IconChart />, rotulo:'Relatórios' },
  { id:'membros',    icone:<IconUsers />, rotulo:'Família' },
];

export default function NavegacaoInferior({ telaAtiva, definirTela }: Props) {
  const { cores } = useTema();
  return (
    <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, display:'flex', background:cores.bgCard, borderTop:`1px solid ${cores.borda}`, padding:'8px 0 20px', zIndex:100, transition:'background .3s, border-color .3s' }}>
      {ABAS.map(aba => (
        <button key={aba.id} onClick={() => definirTela(aba.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, border:'none', background:'transparent', cursor:'pointer', color: telaAtiva === aba.id ? cores.azulPrimario : cores.textoSutil, padding:'6px 0', transition:'color .2s' }}>
          <div style={{ transform: telaAtiva === aba.id ? 'scale(1.1)' : 'scale(1)', transition:'transform .2s' }}>{aba.icone}</div>
          <span style={{ fontSize:10, fontWeight: telaAtiva === aba.id ? 700 : 400, fontFamily:"'DM Sans',sans-serif" }}>{aba.rotulo}</span>
        </button>
      ))}
    </nav>
  );
}
