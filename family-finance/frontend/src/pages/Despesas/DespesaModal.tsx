import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import type { Transacao, MembroFamilia, Conta, Cartao, TipoStatus } from '../../types';

interface Props {
  idUsuario: string; despesa: Transacao | null;
  membros: MembroFamilia[]; contas: Conta[]; cartoes: Cartao[];
  aoFechar: () => void; aoSalvar: () => void;
}

const CATS = ['Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Assinaturas','Contas','Aluguel','Supermercado','Internet','Combustível','Roupas','Streamings','Outros'];

export default function ModalDespesa({ idUsuario, despesa, membros, contas, cartoes, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();
  const [titulo, setTitulo]     = useState(despesa?.titulo ?? '');
  const [valor, setValor]       = useState<string|number>(despesa?.valor ?? '');
  const [categoria, setCategoria] = useState(despesa?.categoria ?? 'Alimentação');
  const [idMembro, setIdMembro] = useState(despesa?.membro_id ?? '');
  const [idConta, setIdConta]   = useState(despesa?.conta_id ?? '');
  const [idCartao, setIdCartao] = useState(despesa?.cartao_id ?? '');
  const [recorrente, setRecorrente] = useState(despesa?.recorrente ?? false);
  const [status, setStatus]     = useState<TipoStatus>(despesa?.status ?? 'pago');
  const [data, setData]         = useState(despesa?.data ?? new Date().toISOString().split('T')[0]);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!titulo || !valor || !idMembro) return;
    setSalvando(true);
    const dados = { user_id: idUsuario, tipo: 'despesa', titulo, valor: parseFloat(String(valor)), categoria, membro_id: idMembro, conta_id: idConta || null, cartao_id: idCartao || null, recorrente, status, data };
    if (despesa) await supabase.from('transactions').update(dados).eq('id', despesa.id);
    else await supabase.from('transactions').insert(dados);
    setSalvando(false);
    aoSalvar();
  };

  const inp = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: `1.5px solid ${cores.borda}`, fontSize: 15,
    fontFamily: "'DM Sans',sans-serif", background: cores.bgSecundario,
    color: cores.textoCorpo, outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color .2s',
  };

  const desabilitado = !titulo || !valor || !idMembro || salvando;

  return (
    <Modal titulo={`${despesa ? 'Editar' : 'Nova'} Despesa`} aoFechar={aoFechar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Campo label="Título" cores={cores}>
            <input style={inp} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Aluguel" />
          </Campo>
          <Campo label="Valor (R$)" cores={cores}>
            <input type="number" style={inp} value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" min="0" step="0.01" />
          </Campo>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Campo label="Categoria" cores={cores}>
            <select style={{ ...inp, appearance: 'none' }} value={categoria} onChange={e => setCategoria(e.target.value)}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="Status" cores={cores}>
            <select style={{ ...inp, appearance: 'none' }} value={status} onChange={e => setStatus(e.target.value as TipoStatus)}>
              <option value="pago">✅ Pago</option>
              <option value="pendente">⏳ Pendente</option>
            </select>
          </Campo>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Campo label="Pessoa" cores={cores}>
            <select style={{ ...inp, appearance: 'none' }} value={idMembro} onChange={e => setIdMembro(e.target.value)}>
              <option value="">Selecione</option>
              {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </Campo>
          <Campo label="Data" cores={cores}>
            <input type="date" style={inp} value={data} onChange={e => setData(e.target.value)} />
          </Campo>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Campo label="Conta (opcional)" cores={cores}>
            <select style={{ ...inp, appearance: 'none' }} value={idConta} onChange={e => setIdConta(e.target.value)}>
              <option value="">Nenhuma</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Campo>
          <Campo label="Cartão (opcional)" cores={cores}>
            <select style={{ ...inp, appearance: 'none' }} value={idCartao} onChange={e => setIdCartao(e.target.value)}>
              <option value="">Nenhum</option>
              {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Campo>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 14px', background: cores.bgSecundario, borderRadius: 12, border: `1.5px solid ${cores.borda}` }}>
          <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#EF4444', cursor: 'pointer' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>🔄 Despesa recorrente</div>
            <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>Repete automaticamente todo mês</div>
          </div>
        </label>

        <button
          onClick={salvar}
          disabled={desabilitado}
          style={{
            padding: '15px', borderRadius: 14, border: 'none',
            cursor: desabilitado ? 'not-allowed' : 'pointer',
            background: desabilitado ? cores.bgTerciario : 'linear-gradient(135deg,#EF4444,#DC2626)',
            color: desabilitado ? cores.textoSutil : '#fff',
            fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
            boxShadow: desabilitado ? 'none' : '0 4px 14px rgba(239,68,68,.4)',
            transition: 'all .2s',
          }}
        >
          {salvando ? 'Salvando...' : (despesa ? '💸 Atualizar Despesa' : '💸 Adicionar Despesa')}
        </button>
      </div>
    </Modal>
  );
}

function Campo({ label, cores, children }: { label: string; cores: any; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</label>
      {children}
    </div>
  );
}
