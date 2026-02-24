import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ModalMembro from './MemberModal';
import type { MembroFamilia } from '../../types';
import styles from './MembrosPage.module.css';

interface PropsMembrosPage {
  idUsuario: string;
}

export default function PaginaMembros({ idUsuario }: PropsMembrosPage) {
  const [membros, setMembros] = useState<MembroFamilia[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoMembro, setEditandoMembro] = useState<MembroFamilia | null>(null);

  useEffect(() => {
    carregarMembros();
  }, [idUsuario]);

  const carregarMembros = async () => {
    const { data } = await supabase.from('family_members').select('*').eq('user_id', idUsuario);
    if (data) setMembros(data);
  };

  const excluir = async (id: string) => {
    if (window.confirm('Deseja excluir este membro?')) {
      await supabase.from('family_members').delete().eq('id', id);
      carregarMembros();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h3 className={styles.pageTitle}><span>👨‍👩‍👧‍👦</span> Membros da Família</h3>
        <button className="btn-add" onClick={() => { setEditandoMembro(null); setMostrarModal(true); }}>
          + Adicionar
        </button>
      </div>

      <div className={styles.membersGrid}>
        {membros.map((m) => (
          <div key={m.id} className={styles.memberCard}>
            <div className={styles.memberAvatar} style={{ background: m.cor }}>
              {m.nome[0].toUpperCase()}
            </div>
            <div className={styles.memberName}>{m.nome}</div>
            <div className={styles.memberRelation}>{m.relacao}</div>
            <div className={styles.memberActions}>
              <button className={styles.btnIconSmall} onClick={() => { setEditandoMembro(m); setMostrarModal(true); }}>✏️</button>
              <button className={styles.btnIconSmall} onClick={() => excluir(m.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <ModalMembro
          idUsuario={idUsuario}
          membro={editandoMembro}
          aoFechar={() => { setMostrarModal(false); setEditandoMembro(null); }}
          aoSalvar={() => { carregarMembros(); setMostrarModal(false); setEditandoMembro(null); }}
        />
      )}
    </div>
  );
}
