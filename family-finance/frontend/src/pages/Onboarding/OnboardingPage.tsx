import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { TipoFamilia, TipoRelacao } from '../../types';
import styles from './OnboardingPage.module.css';

interface PropsOnboarding {
  idUsuario: string;
  aoConcluir: () => void;
}

const CORES = ['#667eea', '#2ed573', '#ffc312', '#ff4757', '#764ba2', '#26de81'];

const RELACOES: { valor: TipoRelacao; rotulo: string }[] = [
  { valor: 'conjuge', rotulo: 'Cônjuge' },
  { valor: 'filho',   rotulo: 'Filho(a)' },
  { valor: 'mae',     rotulo: 'Mãe' },
  { valor: 'pai',     rotulo: 'Pai' },
  { valor: 'irmao',   rotulo: 'Irmão(ã)' },
  { valor: 'outro',   rotulo: 'Outro' },
];

const TIPOS_FAMILIA: { valor: TipoFamilia; rotulo: string; icone: string }[] = [
  { valor: 'sozinho',       rotulo: 'Moro sozinho(a)', icone: '👤' },
  { valor: 'casado',        rotulo: 'Casado(a)',        icone: '💑' },
  { valor: 'morando_junto', rotulo: 'Morando junto',   icone: '👫' },
  { valor: 'familia',       rotulo: 'Família',          icone: '👨‍👩‍👧‍👦' },
];

interface NovoMembro {
  nome: string;
  relacao: TipoRelacao;
  cor: string;
}

export default function PaginaOnboarding({ idUsuario, aoConcluir }: PropsOnboarding) {
  const [passo, setPasso] = useState(1);
  const [nome, setNome] = useState('');
  const [tipoFamilia, setTipoFamilia] = useState<TipoFamilia>('familia');
  const [membros, setMembros] = useState<NovoMembro[]>([]);
  const [nomeMembro, setNomeMembro] = useState('');
  const [relacaoMembro, setRelacaoMembro] = useState<TipoRelacao>('conjuge');
  const [corSelecionada, setCorSelecionada] = useState('');

  const adicionarMembro = () => {
    if (nomeMembro && corSelecionada) {
      setMembros([...membros, { nome: nomeMembro, relacao: relacaoMembro, cor: corSelecionada }]);
      setNomeMembro('');
      setCorSelecionada('');
    }
  };

  const finalizar = async () => {
    try {
      const { error: erroPerfil } = await supabase
        .from('users_profile')
        .update({ nome, family_type: tipoFamilia, onboarding_completed: true })
        .eq('id', idUsuario);

      if (erroPerfil) { console.error(erroPerfil); return; }

      for (const membro of membros) {
        await supabase.from('family_members').insert({ user_id: idUsuario, ...membro });
      }

      aoConcluir();
    } catch (erro) {
      console.error(erro);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        {/* Step progress dots */}
        <div className={styles.stepIndicator}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={`${styles.stepDot} ${passo === n ? styles.active : ''}`} />
          ))}
        </div>

        {/* Passo 1 - Nome */}
        {passo === 1 && (
          <>
            <h1 className={styles.title}>Qual é o seu nome? 👋</h1>
            <p className={styles.subtitle}>Vamos personalizar sua experiência</p>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Laura"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={() => setPasso(2)} disabled={!nome.trim()}>
              Continuar
            </button>
          </>
        )}

        {/* Passo 2 - Tipo de família */}
        {passo === 2 && (
          <>
            <h1 className={styles.title}>Como é a sua família?</h1>
            <p className={styles.subtitle}>Selecione a opção que melhor descreve você</p>
            <div className={styles.familyTypeGrid}>
              {TIPOS_FAMILIA.map((opcao) => (
                <div
                  key={opcao.valor}
                  className={`${styles.familyTypeCard} ${tipoFamilia === opcao.valor ? styles.selected : ''}`}
                  onClick={() => setTipoFamilia(opcao.valor)}
                >
                  <span className={styles.familyTypeIcon}>{opcao.icone}</span>
                  <div className={styles.familyTypeLabel}>{opcao.rotulo}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setPasso(3)}>Continuar</button>
          </>
        )}

        {/* Passo 3 - Membros */}
        {passo === 3 && (
          <>
            <h1 className={styles.title}>Adicione os membros</h1>
            <p className={styles.subtitle}>Cadastre quem divide as finanças com você</p>

            {membros.length > 0 && (
              <div className={styles.addedMembersList}>
                {membros.map((m, indice) => (
                  <div key={indice} className={styles.addedMemberItem}>
                    <div className={styles.addedMemberAvatar} style={{ background: m.cor }}>
                      {m.nome[0].toUpperCase()}
                    </div>
                    <div className={styles.addedMemberInfo}>
                      <div className={styles.addedMemberName}>{m.nome}</div>
                      <div className={styles.addedMemberRelation}>{m.relacao}</div>
                    </div>
                    <button
                      className={styles.removeMemberBtn}
                      onClick={() => setMembros(membros.filter((_, i) => i !== indice))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: João"
                value={nomeMembro}
                onChange={(e) => setNomeMembro(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relação</label>
              <select
                className="form-select"
                value={relacaoMembro}
                onChange={(e) => setRelacaoMembro(e.target.value as TipoRelacao)}
              >
                {RELACOES.map((r) => (
                  <option key={r.valor} value={r.valor}>{r.rotulo}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cor</label>
              <div className="color-picker">
                {CORES.map((cor) => (
                  <div
                    key={cor}
                    className={`color-option ${corSelecionada === cor ? 'selected' : ''}`}
                    style={{ background: cor }}
                    onClick={() => setCorSelecionada(cor)}
                  />
                ))}
              </div>
            </div>

            <button
              className="btn-secondary"
              onClick={adicionarMembro}
              disabled={!nomeMembro.trim() || !corSelecionada}
            >
              + Adicionar Membro
            </button>

            <button
              className="btn-primary"
              onClick={finalizar}
              disabled={membros.length === 0}
              style={{ marginTop: '12px' }}
            >
              Finalizar Configuração 🎉
            </button>

            {membros.length === 0 && (
              <p className={styles.hintText}>Adicione pelo menos um membro para continuar</p>
            )}
          </>
        )}

      </div>
    </div>
  );
}
