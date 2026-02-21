import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
// ↓ StatusType importado de types/index.ts — 'pago' | 'pendente' | 'recebido'
import type { Transaction, FamilyMember, Account, Card, StatusType } from '../../types';

interface DespesaModalProps {
  userId: string;
  despesa: Transaction | null;
  members: FamilyMember[];
  accounts: Account[];
  cards: Card[];
  onClose: () => void;
  onSave: () => void;
}

const CATEGORIAS = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Contas', 'Outros'];

export default function DespesaModal({
  userId,
  despesa,
  members,
  accounts,
  cards,
  onClose,
  onSave,
}: DespesaModalProps) {
  const [titulo, setTitulo] = useState(despesa?.titulo ?? '');
  const [valor, setValor] = useState<string | number>(despesa?.valor ?? '');
  const [categoria, setCategoria] = useState(despesa?.categoria ?? 'Alimentação');
  const [membroId, setMembroId] = useState(despesa?.membro_id ?? '');
  const [contaId, setContaId] = useState(despesa?.conta_id ?? '');
  const [cartaoId, setCartaoId] = useState(despesa?.cartao_id ?? '');
  const [recorrente, setRecorrente] = useState(despesa?.recorrente ?? false);

  // useState<StatusType> → o estado só aceita 'pago' | 'pendente' | 'recebido'.
  // Sem essa tipagem explícita, o TypeScript inferiria como string genérica
  // e você precisaria de "as any" no onChange.
  const [status, setStatus] = useState<StatusType>(despesa?.status ?? 'pago');

  const [data, setData] = useState(despesa?.data ?? new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    const payload = {
      user_id: userId,
      tipo: 'despesa',
      titulo,
      valor: parseFloat(String(valor)),
      categoria,
      membro_id: membroId,
      conta_id: contaId || null,
      cartao_id: cartaoId || null,
      recorrente,
      status,
      data,
    };

    if (despesa) {
      await supabase.from('transactions').update(payload).eq('id', despesa.id);
    } else {
      await supabase.from('transactions').insert(payload);
    }

    onSave();
  };

  return (
    <Modal title={`${despesa ? 'Editar' : 'Nova'} Despesa`} onClose={onClose}>
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
        <label className="form-label">Cartão</label>
        <select className="form-select" value={cartaoId} onChange={(e) => setCartaoId(e.target.value)}>
          <option value="">Selecione (opcional)</option>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Data</label>
        <input className="form-input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        {/* "as StatusType" → cast seguro, você controla os <option> values. */}
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as StatusType)}>
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

      <button className="btn-primary" onClick={handleSave} disabled={!titulo || !valor || !membroId}>
        {despesa ? 'Atualizar' : 'Adicionar'} Despesa
      </button>
    </Modal>
  );
}
