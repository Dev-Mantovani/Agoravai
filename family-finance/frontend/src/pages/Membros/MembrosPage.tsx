import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MemberModal from './MemberModal';
import type { FamilyMember } from '../../types';
import styles from './MembrosPage.module.css';

interface MembrosPageProps {
  userId: string;
}

export default function MembrosPage({ userId }: MembrosPageProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    loadMembers();
  }, [userId]);

  const loadMembers = async () => {
    const { data } = await supabase.from('family_members').select('*').eq('user_id', userId);
    if (data) setMembers(data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir este membro?')) {
      await supabase.from('family_members').delete().eq('id', id);
      loadMembers();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h3 className={styles.pageTitle}><span>👨‍👩‍👧‍👦</span> Membros da Família</h3>
        <button className="btn-add" onClick={() => { setEditingMember(null); setShowModal(true); }}>
          + Adicionar
        </button>
      </div>

      <div className={styles.membersGrid}>
        {members.map((m) => (
          <div key={m.id} className={styles.memberCard}>
            <div className={styles.memberAvatar} style={{ background: m.cor }}>
              {m.nome[0].toUpperCase()}
            </div>
            <div className={styles.memberName}>{m.nome}</div>
            <div className={styles.memberRelation}>{m.relacao}</div>
            <div className={styles.memberActions}>
              <button className={styles.btnIconSmall} onClick={() => { setEditingMember(m); setShowModal(true); }}>✏️</button>
              <button className={styles.btnIconSmall} onClick={() => handleDelete(m.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <MemberModal
          userId={userId}
          member={editingMember}
          onClose={() => { setShowModal(false); setEditingMember(null); }}
          onSave={() => { loadMembers(); setShowModal(false); setEditingMember(null); }}
        />
      )}
    </div>
  );
}
