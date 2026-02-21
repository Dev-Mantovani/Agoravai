export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

export function getMonthDateRange(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return {
    startDateStr: startDate.toISOString().split('T')[0],
    endDateStr: endDate.toISOString().split('T')[0],
  };
}

export function formatDate(dateStr: string): string {
  return dateStr.split('-').reverse().join('/');
}
