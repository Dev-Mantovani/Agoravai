// ==================== UNION TYPES ====================
// Centralizados aqui para reutilizar em todo o projeto.
// Ao usar num select: onChange={(e) => setX(e.target.value as NomeDoTipo)}

/** Tipo de família no onboarding */
export type FamilyType = 'sozinho' | 'casado' | 'morando_junto' | 'familia';

/** Status de uma transação */
export type StatusType = 'pago' | 'pendente' | 'recebido';

/** Tipo de uma transação */
export type TransactionTipo = 'receita' | 'despesa';

/** Tipo de conta bancária */
export type AccountTipo = 'corrente' | 'poupanca' | 'investimento';

/** Relação de um membro da família */
export type RelacaoType = 'conjuge' | 'filho' | 'mae' | 'pai' | 'irmao' | 'outro';

// ==================== INTERFACES ====================

export interface User {
  id: string;
  email: string;
  nome?: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  nome: string;
  relacao: RelacaoType;
  cor: string;
}

export interface Account {
  id: string;
  user_id: string;
  nome: string;
  tipo: AccountTipo;
  saldo: number;
  cor: string;
}

export interface Card {
  id: string;
  user_id: string;
  nome: string;
  limite: number;
  usado: number;
  cor: string;
  fechamento_dia: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  tipo: TransactionTipo;
  titulo: string;
  valor: number;
  categoria: string;
  membro_id: string;
  membro?: FamilyMember;
  conta_id?: string;
  cartao_id?: string;
  recorrente: boolean;
  status: StatusType;
  data: string;
}
