import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import type { Transacao, MembroFamilia, Conta, Cartao, TipoStatus } from '../../types';

interface Props { idUsuario: string; despesa: Transacao | null; membros: MembroFamilia[]; contas: Conta[]; cartoes: Cartao[]; aoFechar: () => void; aoSalvar: () => void; }
const CATS = ['Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Assinaturas','Contas','Aluguel','Supermercado','Internet','Combustível','Roupas','Streamings','Outros'];

export default function ModalDespesa({ idUsuario, despesa, membros, contas, cartoes, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();
  const [titulo, setTitulo] = useState(despesa?.titulo ?? '');
  const [valor, setValor] = useState<string|number>(despesa?.valor ?? '');
  const [categoria, setCategoria] = useState(despesa?.categoria ?? 'Alimentação');
  const [idMembro, setIdMembro] = useState(despesa?.membro_id ?? '');
  const [idConta, setIdConta] = useState(despesa?.conta_id ?? '');
  const [idCartao, setIdCartao] = useState(despesa?.cartao_id ?? '');
  const [recorrente, setRecorrente] = useState(despesa?.recorrente ?? false);
  const [status, setStatus] = useState<TipoStatus>(despesa?.status ?? 'pago');
  const [data, setData] = useState(despesa?.data ?? new Date().toISOString().split('T')[0]);

  const salvar = async () => {
    const dados = { user_id: idUsuario, tipo: 'despesa', titulo, valor: parseFloat(String(valor)), categoria, membro_id: idMembro, conta_id: idConta || null, cartao_id: idCartao || null, recorrente, status, data };
    if (despesa) await supabase.from('transactions').update(dados).eq('id', despesa.id);
    else await supabase.from('transactions').insert(dados);
    aoSalvar();
  };

  const inp = { width:'100%', padding:'13px 14px', borderRadius:13, border:`1.5px solid ${cores.borda}`, fontSize:15, fontFamily:"'DM Sans',sans-serif", background:cores.bgTerciario, color:cores.textoCorpo, outline:'none', boxSizing:'border-box' as const, marginBottom:12 };

  return (
    <Modal titulo={`${despesa ? 'Editar' : 'Nova'} Despesa`} aoFechar={aoFechar}>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <Label c={cores}>Título</Label>
        <input style={inp} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Mercado" />
        <Label c={cores}>Valor (R$)</Label>
        <input type="number" style={inp} value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" />
        <Label c={cores}>Categoria</Label>
        <select style={{ ...inp, appearance:'none' }} value={categoria} onChange={e => setCategoria(e.target.value)}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Label c={cores}>Pessoa</Label>
        <select style={{ ...inp, appearance:'none' }} value={idMembro} onChange={e => setIdMembro(e.target.value)}>
          <option value="">Selecione</option>
          {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        <Label c={cores}>Conta</Label>
        <select style={{ ...inp, appearance:'none' }} value={idConta} onChange={e => setIdConta(e.target.value)}>
          <option value="">Nenhuma</option>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <Label c={cores}>Cartão</Label>
        <select style={{ ...inp, appearance:'none' }} value={idCartao} onChange={e => setIdCartao(e.target.value)}>
          <option value="">Nenhum</option>
          {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <Label c={cores}>Data</Label>
        <input type="date" style={inp} value={data} onChange={e => setData(e.target.value)} />
        <Label c={cores}>Status</Label>
        <select style={{ ...inp, appearance:'none' }} value={status} onChange={e => setStatus(e.target.value as TipoStatus)}>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'4px 0', marginBottom:12 }}>
          <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} style={{ width:18, height:18, accentColor:cores.azulPrimario }} />
          <span style={{ fontSize:14, color:cores.textoCorpo, fontFamily:"'DM Sans',sans-serif" }}>Despesa recorrente (mensal)</span>
        </label>
        <button onClick={salvar} disabled={!titulo || !valor || !idMembro} style={{ padding:'15px', borderRadius:14, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#EF4444,#DC2626)', color:'#fff', fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(239,68,68,.4)' }}>
          {despesa ? 'Atualizar' : 'Adicionar'} Despesa
        </button>
      </div>
    </Modal>
  );
}
function Label({ c, children }: { c: any; children: React.ReactNode }) {
  return <label style={{ fontSize:13, fontWeight:600, color:c.textoCorpo, fontFamily:"'DM Sans',sans-serif", display:'block', marginBottom:6 }}>{children}</label>;
}
