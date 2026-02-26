import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
import { useTema } from '../../contexts/TemaContexto';
import type { Transacao, MembroFamilia, Conta, TipoStatus } from '../../types';

interface Props {
  idUsuario: string; receita: Transacao | null;
  membros: MembroFamilia[]; contas: Conta[];
  aoFechar: () => void; aoSalvar: () => void;
}

export default function ModalReceita({ idUsuario, receita, membros, contas, aoFechar, aoSalvar }: Props) {
  const { cores } = useTema();
  const [titulo, setTitulo] = useState(receita?.titulo ?? '');
  const [valor, setValor]   = useState<string|number>(receita?.valor ?? '');
  const [categoria, setCategoria] = useState(receita?.categoria ?? 'Salário');
  const [idMembro, setIdMembro]   = useState(receita?.membro_id ?? '');
  const [idConta, setIdConta]     = useState(receita?.conta_id ?? '');
  const [recorrente, setRecorrente] = useState(receita?.recorrente ?? false);
  const [status, setStatus] = useState<TipoStatus>(receita?.status ?? 'recebido');
  const [data, setData]     = useState(receita?.data ?? new Date().toISOString().split('T')[0]);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!titulo || !valor || !idMembro) return;
    setSalvando(true);
    const dados = { user_id: idUsuario, tipo: 'receita', titulo, valor: parseFloat(String(valor)), categoria, membro_id: idMembro, conta_id: idConta || null, recorrente, status, data };
    if (receita) await supabase.from('transactions').update(dados).eq('id', receita.id);
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

  return (
    <Modal titulo={`${receita ? 'Editar' : 'Nova'} Receita`} aoFechar={aoFechar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Grid 2 col no desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Campo label="Título" cores={cores}>
            <input style={inp} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Salário" />
          </Campo>
          <Campo label="Valor (R$)" cores={cores}>
            <input type="number" style={inp} value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" min="0" step="0.01" />
          </Campo>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Campo label="Categoria" cores={cores}>
            <select style={{ ...inp, appearance: 'none' }} value={categoria} onChange={e => setCategoria(e.target.value)}>
              {['Salário','Freelance','Investimentos','Bônus','Outros'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="Status" cores={cores}>
            <select style={{ ...inp, appearance: 'none' }} value={status} onChange={e => setStatus(e.target.value as TipoStatus)}>
              <option value="recebido">✅ Recebido</option>
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

        <Campo label="Conta (opcional)" cores={cores}>
          <select style={{ ...inp, appearance: 'none' }} value={idConta} onChange={e => setIdConta(e.target.value)}>
            <option value="">Nenhuma</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Campo>

        {/* Recorrente */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 14px', background: cores.bgSecundario, borderRadius: 12, border: `1.5px solid ${cores.borda}` }}>
          <input type="checkbox" checked={recorrente} onChange={e => setRecorrente(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#22C55E', cursor: 'pointer' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: cores.textoTitulo, fontFamily: "'DM Sans',sans-serif" }}>🔄 Receita recorrente</div>
            <div style={{ fontSize: 12, color: cores.textoSutil, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>Repete automaticamente todo mês</div>
          </div>
        </label>

        {/* Botão salvar */}
        <button
          onClick={salvar}
          disabled={!titulo || !valor || !idMembro || salvando}
          style={{
            padding: '15px', borderRadius: 14, border: 'none',
            cursor: (!titulo || !valor || !idMembro || salvando) ? 'not-allowed' : 'pointer',
            background: (!titulo || !valor || !idMembro) ? cores.bgTerciario : 'linear-gradient(135deg,#22C55E,#16A34A)',
            color: (!titulo || !valor || !idMembro) ? cores.textoSutil : '#fff',
            fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
            boxShadow: (!titulo || !valor || !idMembro) ? 'none' : '0 4px 14px rgba(34,197,94,.4)',
            transition: 'all .2s',
          }}
        >
          {salvando ? 'Salvando...' : (receita ? '✅ Atualizar Receita' : '✅ Adicionar Receita')}
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
