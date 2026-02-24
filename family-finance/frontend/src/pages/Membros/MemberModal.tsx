import { useState } from 'react';
import Modal from '../../components/Modal/Modal';
import { supabase } from '../../lib/supabase';
import type { MembroFamilia, TipoRelacao } from '../../types';

interface PropsModalMembro {
  idUsuario: string;
  membro: MembroFamilia | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}

const CORES = ['#667eea', '#2ed573', '#ffc312', '#ff4757', '#764ba2', '#26de81'];

export default function ModalMembro({ idUsuario, membro, aoFechar, aoSalvar }: PropsModalMembro) {
  const [nome, setNome] = useState(membro?.nome ?? '');
  const [relacao, setRelacao] = useState<TipoRelacao>(membro?.relacao ?? 'conjuge');
  const [cor, setCor] = useState(membro?.cor ?? '#667eea');

  const salvar = async () => {
    const dados = { user_id: idUsuario, nome, relacao, cor };

    if (membro) {
      await supabase.from('family_members').update(dados).eq('id', membro.id);
    } else {
      await supabase.from('family_members').insert(dados);
    }

    aoSalvar();
  };

  return (
    <Modal titulo={`${membro ? 'Editar' : 'Novo'} Membro`} aoFechar={aoFechar}>
      <div className="form-group">
        <label className="form-label">Nome</label>
        <input className="form-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João" />
      </div>

      <div className="form-group">
        <label className="form-label">Relação</label>
        <select className="form-select" value={relacao} onChange={(e) => setRelacao(e.target.value as TipoRelacao)}>
          {[
            { valor: 'conjuge', rotulo: 'Cônjuge' },
            { valor: 'filho',   rotulo: 'Filho(a)' },
            { valor: 'mae',     rotulo: 'Mãe' },
            { valor: 'pai',     rotulo: 'Pai' },
            { valor: 'irmao',   rotulo: 'Irmão(ã)' },
            { valor: 'outro',   rotulo: 'Outro' },
          ].map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Cor</label>
        <div className="color-picker">
          {CORES.map((c) => (
            <div
              key={c}
              className={`color-option ${cor === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setCor(c)}
            />
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={salvar} disabled={!nome}>
        {membro ? 'Atualizar' : 'Adicionar'} Membro
      </button>
    </Modal>
  );
}
