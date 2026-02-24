import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
import type { Transacao, MembroFamilia, Conta, TipoStatus } from '../../types';

interface PropsModalReceita {
  idUsuario: string;
  receita: Transacao | null;
  membros: MembroFamilia[];
  contas: Conta[];
  aoFechar: () => void;
  aoSalvar: () => void;
}

export default function ModalReceita({
  idUsuario,
  receita,
  membros,
  contas,
  aoFechar,
  aoSalvar,
}: PropsModalReceita) {
  const [titulo, setTitulo] = useState(receita?.titulo ?? '');
  const [valor, setValor] = useState<string | number>(receita?.valor ?? '');
  const [categoria, setCategoria] = useState(receita?.categoria ?? 'Salário');
  const [idMembro, setIdMembro] = useState(receita?.membro_id ?? '');
  const [idConta, setIdConta] = useState(receita?.conta_id ?? '');
  const [recorrente, setRecorrente] = useState(receita?.recorrente ?? false);
  const [status, setStatus] = useState<TipoStatus>(receita?.status ?? 'recebido');
  const [data, setData] = useState(receita?.data ?? new Date().toISOString().split('T')[0]);

  const salvar = async () => {
    const dados = {
      user_id: idUsuario,
      tipo: 'receita',
      titulo,
      valor: parseFloat(String(valor)),
      categoria,
      membro_id: idMembro,
      conta_id: idConta || null,
      recorrente,
      status,
      data,
    };

    if (receita) {
      await supabase.from('transactions').update(dados).eq('id', receita.id);
    } else {
      await supabase.from('transactions').insert(dados);
    }

    aoSalvar();
  };

  return (
    <Modal titulo={`${receita ? 'Editar' : 'Nova'} Receita`} aoFechar={aoFechar}>
      <div className="form-group">
        <label className="form-label">Título</label>
        <input className="form-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Salário" />
      </div>

      <div className="form-group">
        <label className="form-label">Valor (R$)</label>
        <input className="form-input" type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0.00" />
      </div>

      <div className="form-group">
        <label className="form-label">Categoria</label>
        <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {['Salário', 'Freelance', 'Investimentos', 'Bônus', 'Outros'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
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
        <label className="form-label">Data</label>
        <input className="form-input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as TipoStatus)}>
          <option value="recebido">Recebido</option>
          <option value="pendente">Pendente</option>
        </select>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
          <span>Receita recorrente (mensal)</span>
        </label>
      </div>

      <button className="btn-primary" onClick={salvar} disabled={!titulo || !valor || !idMembro}>
        {receita ? 'Atualizar' : 'Adicionar'} Receita
      </button>
    </Modal>
  );
}
