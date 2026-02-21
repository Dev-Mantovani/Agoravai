import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
// ↓ RelacaoType importado de types/index.ts — 'conjuge' | 'filho' | 'mae' | 'pai' | 'irmao' | 'outro'
import type { FamilyMember, RelacaoType } from '../../types';

interface MemberModalProps {
  userId: string;
  member: FamilyMember | null;
  onClose: () => void;
  onSave: () => void;
}

const COLORS = ['#667eea', '#2ed573', '#ffc312', '#ff4757', '#764ba2', '#26de81'];

export default function MemberModal({ userId, member, onClose, onSave }: MemberModalProps) {
  const [nome, setNome] = useState(member?.nome ?? '');

  // useState<RelacaoType> → estado restrito aos 6 valores válidos.
  // member.relacao já é RelacaoType (definido na interface FamilyMember),
  // então o TypeScript garante que o valor inicial está correto.
  const [relacao, setRelacao] = useState<RelacaoType>(member?.relacao ?? 'conjuge');

  const [cor, setCor] = useState(member?.cor ?? '#667eea');

  const handleSave = async () => {
    const payload = { user_id: userId, nome, relacao, cor };

    if (member) {
      await supabase.from('family_members').update(payload).eq('id', member.id);
    } else {
      await supabase.from('family_members').insert(payload);
    }

    onSave();
  };

  return (
    <Modal title={`${member ? 'Editar' : 'Novo'} Membro`} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Nome</label>
        <input className="form-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João" />
      </div>

      <div className="form-group">
        <label className="form-label">Relação</label>
        {/* "as RelacaoType" → cast seguro, os <option> values batem exatamente
            com os valores do RelacaoType definido em types/index.ts */}
        <select className="form-select" value={relacao} onChange={(e) => setRelacao(e.target.value as RelacaoType)}>
          {[
            { value: 'conjuge', label: 'Cônjuge' },
            { value: 'filho',   label: 'Filho(a)' },
            { value: 'mae',     label: 'Mãe' },
            { value: 'pai',     label: 'Pai' },
            { value: 'irmao',   label: 'Irmão(ã)' },
            { value: 'outro',   label: 'Outro' },
          ].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Cor</label>
        <div className="color-picker">
          {COLORS.map((c) => (
            <div
              key={c}
              className={`color-option ${cor === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setCor(c)}
            />
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={!nome}>
        {member ? 'Atualizar' : 'Adicionar'} Membro
      </button>
    </Modal>
  );
}
