import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import type { Transacao, MembroFamilia, Conta, TipoStatus } from '../../types';

interface Props { idUsuario: string; receita: Transacao | null; membros: MembroFamilia[]; contas: Conta[]; aoFechar: () => void; aoSalvar: () => void; }

export default function ModalReceita({ idUsuario, receita, membros, contas, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();
  const [titulo, setTitulo] = useState(receita?.titulo ?? '');
  const [valor, setValor] = useState<string|number>(receita?.valor ?? '');
  const [categoria, setCategoria] = useState(receita?.categoria ?? 'Salário');
  const [idMembro, setIdMembro] = useState(receita?.membro_id ?? '');
  const [idConta, setIdConta] = useState(receita?.conta_id ?? '');
  const [recorrente, setRecorrente] = useState(receita?.recorrente ?? false);
  const [status, setStatus] = useState<TipoStatus>(receita?.status ?? 'recebido');
  const [data, setData] = useState(receita?.data ?? new Date().toISOString().split('T')[0]);

  const salvar = async () => {
    const dados = { user_id: idUsuario, tipo: 'receita', titulo, valor: parseFloat(String(valor)), categoria, membro_id: idMembro, conta_id: idConta || null, recorrente, status, data };
    if (receita) await supabase.from('transactions').update(dados).eq('id', receita.id);
    else await supabase.from('transactions').insert(dados);
    aoSalvar();
  };

  const inp = { width:'100%', padding:'13px 14px', borderRadius:13, border:`1.5px solid ${cores.borda}`, fontSize:15, fontFamily:"'DM Sans',sans-serif", background:cores.bgTerciario, color:cores.textoCorpo, outline:'none', boxSizing:'border-box' as const, marginBottom: 12 };

  return (
    <Modal titulo={`${receita ? 'Editar' : 'Nova'} Receita`} aoFechar={aoFechar}>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {[['Título','text',titulo,setTitulo,'Ex: Salário'],['Valor (R$)','number',valor,setValor,'0.00']].map(([lbl,tp,val,set,ph]) => (
          <div key={String(lbl)}>
            <label style={{ fontSize:13, fontWeight:600, color:cores.textoCorpo, fontFamily:"'DM Sans',sans-serif", display:'block', marginBottom:6 }}>{String(lbl)}</label>
            <input type={String(tp)} style={inp} value={String(val)} onChange={e => (set as any)(e.target.value)} placeholder={String(ph)} />
          </div>
        ))}
        {[['Categoria','select',categoria,setCategoria,['Salário','Freelance','Investimentos','Bônus','Outros']],['Pessoa','select',idMembro,setIdMembro,membros.map(m=>({v:m.id,l:m.nome}))],['Conta','select',idConta,setIdConta,[{v:'',l:'Nenhuma'},...contas.map(c=>({v:c.id,l:c.nome}))]]].map(([lbl,_,val,set,opts]) => (
          <div key={String(lbl)}>
            <label style={{ fontSize:13, fontWeight:600, color:cores.textoCorpo, fontFamily:"'DM Sans',sans-serif", display:'block', marginBottom:6 }}>{String(lbl)}</label>
            <select style={{ ...inp, appearance:'none' }} value={String(val)} onChange={e => (set as any)(e.target.value)}>
              {(opts as any[]).map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label style={{ fontSize:13, fontWeight:600, color:cores.textoCorpo, fontFamily:"'DM Sans',sans-serif", display:'block', marginBottom:6 }}>Data</label>
          <input type="date" style={inp} value={data} onChange={e => setData(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize:13, fontWeight:600, color:cores.textoCorpo, fontFamily:"'DM Sans',sans-serif", display:'block', marginBottom:6 }}>Status</label>
          <select style={{ ...inp, appearance:'none' }} value={status} onChange={e => setStatus(e.target.value as TipoStatus)}>
            <option value="recebido">Recebido</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'4px 0', marginBottom:12 }}>
          <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} style={{ width:18, height:18, accentColor:cores.azulPrimario }} />
          <span style={{ fontSize:14, color:cores.textoCorpo, fontFamily:"'DM Sans',sans-serif" }}>Receita recorrente (mensal)</span>
        </label>
        <button onClick={salvar} disabled={!titulo || !valor || !idMembro} style={{ padding:'15px', borderRadius:14, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#22C55E,#16A34A)', color:'#fff', fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(34,197,94,.4)', transition:'all .2s' }}>
          {receita ? 'Atualizar' : 'Adicionar'} Receita
        </button>
      </div>
    </Modal>
  );
}
