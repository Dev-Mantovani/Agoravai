import { useState } from 'react';
import { supabase } from '../../lib/supabase';
// ↓ FamilyType e RelacaoType importados de types/index.ts
import type { FamilyType, RelacaoType } from '../../types';
import styles from './OnboardingPage.module.css';

interface OnboardingPageProps {
  userId: string;
  onComplete: () => void;
}

const COLORS = ['#667eea', '#2ed573', '#ffc312', '#ff4757', '#764ba2', '#26de81'];

const RELACOES: { value: RelacaoType; label: string }[] = [
  // Tipando o array como RelacaoType[] garante que nenhum value inválido
  // seja adicionado por engano no futuro.
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'filho',   label: 'Filho(a)' },
  { value: 'mae',     label: 'Mãe' },
  { value: 'pai',     label: 'Pai' },
  { value: 'irmao',   label: 'Irmão(ã)' },
  { value: 'outro',   label: 'Outro' },
];

const FAMILY_TYPES: { value: FamilyType; label: string; icon: string }[] = [
  // Mesmo padrão: array tipado com FamilyType evita valores fora do union.
  { value: 'sozinho',       label: 'Moro sozinho(a)', icon: '👤' },
  { value: 'casado',        label: 'Casado(a)',        icon: '💑' },
  { value: 'morando_junto', label: 'Morando junto',   icon: '👫' },
  { value: 'familia',       label: 'Família',          icon: '👨‍👩‍👧‍👦' },
];

// Interface local para os membros sendo montados no onboarding
interface NewMember {
  nome: string;
  relacao: RelacaoType; // tipado corretamente em vez de string genérica
  cor: string;
}

export default function OnboardingPage({ userId, onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState('');

  // useState<FamilyType> → só aceita os 4 tipos de família válidos
  const [familyType, setFamilyType] = useState<FamilyType>('familia');

  const [members, setMembers] = useState<NewMember[]>([]);
  const [currentMemberName, setCurrentMemberName] = useState('');

  // useState<RelacaoType> → só aceita os 6 tipos de relação válidos
  const [currentMemberRelacao, setCurrentMemberRelacao] = useState<RelacaoType>('conjuge');

  const [selectedColor, setSelectedColor] = useState('');

  const handleAddMember = () => {
    if (currentMemberName && selectedColor) {
      setMembers([...members, { nome: currentMemberName, relacao: currentMemberRelacao, cor: selectedColor }]);
      setCurrentMemberName('');
      setSelectedColor('');
    }
  };

  const handleComplete = async () => {
    try {
      const { error: profileError } = await supabase
        .from('users_profile')
        .update({ nome, family_type: familyType, onboarding_completed: true })
        .eq('id', userId);

      if (profileError) { console.error(profileError); return; }

      for (const member of members) {
        await supabase.from('family_members').insert({ user_id: userId, ...member });
      }

      onComplete();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        {/* Step 1 - Nome */}
        {step === 1 && (
          <>
            <h1 className={styles.title}>Qual é o seu nome?</h1>
            <div className="form-group">
              <input type="text" className="form-input" placeholder="Digite seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={() => setStep(2)} disabled={!nome.trim()}>Continuar</button>
          </>
        )}

        {/* Step 2 - Tipo de família */}
        {step === 2 && (
          <>
            <h1 className={styles.title}>Como é sua família?</h1>
            <div className={styles.familyTypeGrid}>
              {FAMILY_TYPES.map((opt) => (
                <div
                  key={opt.value}
                  className={`${styles.familyTypeCard} ${familyType === opt.value ? styles.selected : ''}`}
                  // Como FAMILY_TYPES já é tipado como FamilyType[], opt.value já é FamilyType.
                  // Não precisa de cast aqui — o TypeScript sabe o tipo automaticamente!
                  onClick={() => setFamilyType(opt.value)}
                >
                  <span className={styles.familyTypeIcon}>{opt.icon}</span>
                  <div className={styles.familyTypeLabel}>{opt.label}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setStep(3)}>Continuar</button>
          </>
        )}

        {/* Step 3 - Membros */}
        {step === 3 && (
          <>
            <h1 className={styles.title}>Adicione os membros</h1>
            <p className={styles.subtitle}>Cadastre as pessoas que dividem as finanças com você</p>

            {members.length > 0 && (
              <div className={styles.addedMembersList}>
                {members.map((m, i) => (
                  <div key={i} className={styles.addedMemberItem}>
                    <div className={styles.addedMemberAvatar} style={{ background: m.cor }}>
                      {m.nome[0].toUpperCase()}
                    </div>
                    <div className={styles.addedMemberInfo}>
                      <div className={styles.addedMemberName}>{m.nome}</div>
                      <div className={styles.addedMemberRelation}>{m.relacao}</div>
                    </div>
                    <button className={styles.removeMemberBtn} onClick={() => setMembers(members.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nome</label>
              <input type="text" className="form-input" placeholder="Ex: João" value={currentMemberName} onChange={(e) => setCurrentMemberName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Relação</label>
              {/* Como RELACOES é tipado como RelacaoType[], opt.value já é RelacaoType.
                  Mas e.target.value num onChange ainda é string, então precisamos do cast. */}
              <select className="form-select" value={currentMemberRelacao} onChange={(e) => setCurrentMemberRelacao(e.target.value as RelacaoType)}>
                {RELACOES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cor</label>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <div key={c} className={`color-option ${selectedColor === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setSelectedColor(c)} />
                ))}
              </div>
            </div>

            <button className="btn-secondary" onClick={handleAddMember} disabled={!currentMemberName.trim() || !selectedColor}>
              Adicionar Membro
            </button>

            <button className="btn-primary" onClick={handleComplete} disabled={members.length === 0} style={{ marginTop: '12px' }}>
              Finalizar Configuração
            </button>

            {members.length === 0 && <p className={styles.hintText}>Adicione pelo menos um membro para continuar</p>}
          </>
        )}

      </div>
    </div>
  );
}
