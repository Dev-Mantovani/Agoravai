import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
// ↓ StatusType importado de types/index.ts — centralizado para reuso em todo o projeto
import type { Transaction, FamilyMember, Account, StatusType } from '../../types';

interface ReceitaModalProps {
  userId: string;
  receita: Transaction | null;
  members: FamilyMember[];
  accounts: Account[];
  onClose: () => void;
  onSave: () => void;
}

export default function ReceitaModal({
  userId,
  receita,
  members,
  accounts,
  onClose,
  onSave,
}: ReceitaModalProps) {
  const [titulo, setTitulo] = useState(receita?.titulo ?? '');
  const [valor, setValor] = useState<string | number>(receita?.valor ?? '');
  const [categoria, setCategoria] = useState(receita?.categoria ?? 'Salário');
  const [membroId, setMembroId] = useState(receita?.membro_id ?? '');
  const [contaId, setContaId] = useState(receita?.conta_id ?? '');
  const [recorrente, setRecorrente] = useState(receita?.recorrente ?? false);

  // useState<StatusType> → tipar explicitamente restringe o estado a apenas
  // 'pago' | 'pendente' | 'recebido'. Se tentar setar qualquer outra string,
  // o TypeScript avisa em tempo de compilação (antes de rodar o app).
  const [status, setStatus] = useState<StatusType>(receita?.status ?? 'recebido');

  const [data, setData] = useState(receita?.data ?? new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    const payload = {
      user_id: userId,
      tipo: 'receita',
      titulo,
      valor: parseFloat(String(valor)),
      categoria,
      membro_id: membroId,
      conta_id: contaId || null,
      recorrente,
      status,
      data,
    };

    if (receita) {
      await supabase.from('transactions').update(payload).eq('id', receita.id);
    } else {
      await supabase.from('transactions').insert(payload);
    }

    onSave();
  };

  return (
    <Modal title={`${receita ? 'Editar' : 'Nova'} Receita`} onClose={onClose}>
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
        <select className="form-select" value={membroId} onChange={(e) => setMembroId(e.target.value)}>
          <option value="">Selecione</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Conta</label>
        <select className="form-select" value={contaId} onChange={(e) => setContaId(e.target.value)}>
          <option value="">Selecione (opcional)</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Data</label>
        <input className="form-input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        {/* "as StatusType" → cast seguro porque você controla os <option> values.
            Diferente de "as any", mantém a segurança de tipos no restante do código. */}
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as StatusType)}>
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

      <button className="btn-primary" onClick={handleSave} disabled={!titulo || !valor || !membroId}>
        {receita ? 'Atualizar' : 'Adicionar'} Receita
      </button>
    </Modal>
  );
}
