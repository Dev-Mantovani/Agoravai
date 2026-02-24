import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
import type { Transacao, MembroFamilia, Conta, Cartao, TipoStatus } from '../../types';

interface PropsModalDespesa {
  idUsuario: string;
  despesa: Transacao | null;
  membros: MembroFamilia[];
  contas: Conta[];
  cartoes: Cartao[];
  aoFechar: () => void;
  aoSalvar: () => void;
}

const CATEGORIAS = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Contas', 'Outros'];

export default function ModalDespesa({
  idUsuario,
  despesa,
  membros,
  contas,
  cartoes,
  aoFechar,
  aoSalvar,
}: PropsModalDespesa) {
  const [titulo, setTitulo] = useState(despesa?.titulo ?? '');
  const [valor, setValor] = useState<string | number>(despesa?.valor ?? '');
  const [categoria, setCategoria] = useState(despesa?.categoria ?? 'Alimentação');
  const [idMembro, setIdMembro] = useState(despesa?.membro_id ?? '');
  const [idConta, setIdConta] = useState(despesa?.conta_id ?? '');
  const [idCartao, setIdCartao] = useState(despesa?.cartao_id ?? '');
  const [recorrente, setRecorrente] = useState(despesa?.recorrente ?? false);
  const [status, setStatus] = useState<TipoStatus>(despesa?.status ?? 'pago');
  const [data, setData] = useState(despesa?.data ?? new Date().toISOString().split('T')[0]);

  const salvar = async () => {
    const dados = {
      user_id: idUsuario,
      tipo: 'despesa',
      titulo,
      valor: parseFloat(String(valor)),
      categoria,
      membro_id: idMembro,
      conta_id: idConta || null,
      cartao_id: idCartao || null,
      recorrente,
      status,
      data,
    };

    if (despesa) {
      await supabase.from('transactions').update(dados).eq('id', despesa.id);
    } else {
      await supabase.from('transactions').insert(dados);
    }

    aoSalvar();
  };

  return (
    <Modal titulo={`${despesa ? 'Editar' : 'Nova'} Despesa`} aoFechar={aoFechar}>
      <div className="form-group">
        <label className="form-label">Título</label>
        <input className="form-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Mercado" />
      </div>

      <div className="form-group">
        <label className="form-label">Valor (R$)</label>
        <input className="form-input" type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0.00" />
      </div>

      <div className="form-group">
        <label className="form-label">Categoria</label>
        <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Pessoa</label>
        <select className="form-select" value={idMembro} onChange={(e) => setIdMembro(e.target.value)}>
          <option value="">Selecione</option>
          {membros.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Conta</label>
        <select className="form-select" value={idConta} onChange={(e) => setIdConta(e.target.value)}>
          <option value="">Selecione (opcional)</option>
          {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Cartão</label>
        <select className="form-select" value={idCartao} onChange={(e) => setIdCartao(e.target.value)}>
          <option value="">Selecione (opcional)</option>
          {cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Data</label>
        <input className="form-input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as TipoStatus)}>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
        </select>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
          <span>Despesa recorrente (mensal)</span>
        </label>
      </div>

      <button className="btn-primary" onClick={salvar} disabled={!titulo || !valor || !idMembro}>
        {despesa ? 'Atualizar' : 'Adicionar'} Despesa
      </button>
    </Modal>
  );
}
