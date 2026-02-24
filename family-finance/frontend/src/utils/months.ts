export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function obterNomeMes(mes: number): string {
  return NOMES_MESES[mes - 1];
}

export function obterPeriodoMes(ano: number, mes: number) {
  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0);
  return {
    dataInicioStr: dataInicio.toISOString().split('T')[0],
    dataFimStr: dataFim.toISOString().split('T')[0],
  };
}

export function formatarData(dataStr: string): string {
  return dataStr.split('-').reverse().join('/');
}
