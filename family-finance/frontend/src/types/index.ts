// ==================== TIPOS UNION ====================

/** Tipo de família no onboarding */
export type TipoFamilia = 'sozinho' | 'casado' | 'morando_junto' | 'familia';

/** Status de uma transação */
export type TipoStatus = 'pago' | 'pendente' | 'recebido';

/** Tipo de uma transação */
export type TipoTransacao = 'receita' | 'despesa';

/** Tipo de conta bancária */
export type TipoConta = 'corrente' | 'poupanca' | 'investimento';

/** Relação de um membro da família */
export type TipoRelacao = 'conjuge' | 'filho' | 'mae' | 'pai' | 'irmao' | 'outro';

// ==================== INTERFACES ====================

export interface Usuario {
  id: string;
  email: string;
  nome?: string;
}

export interface MembroFamilia {
  id: string;
  user_id: string;
  nome: string;
  relacao: TipoRelacao;
  cor: string;
}

export interface Conta {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoConta;
  saldo: number;
  cor: string;
}

export interface Cartao {
  id: string;
  user_id: string;
  nome: string;
  limite: number;
  usado: number;
  cor: string;
  fechamento_dia: number;
}

export interface Transacao {
  id: string;
  user_id: string;
  tipo: TipoTransacao;
  titulo: string;
  valor: number;
  categoria: string;
  membro_id: string;
  membro?: MembroFamilia;
  conta_id?: string;
  cartao_id?: string;
  recorrente: boolean;
  status: TipoStatus;
  data: string;
}
