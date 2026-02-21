import { supabase } from '../lib/supabase';

export async function criarTransacoesRecorrentesMes(
  userId: string,
  year: number,
  month: number,
) {
  try {
    const { data: recorrentes } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('recorrente', true);

    if (!recorrentes || recorrentes.length === 0) return;

    const recorrentesUnicas = recorrentes.reduce((acc: any[], curr) => {
      if (!acc.find((r) => r.titulo === curr.titulo && r.tipo === curr.tipo)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    for (const recorrente of recorrentesUnicas) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: existente } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('titulo', recorrente.titulo)
        .eq('tipo', recorrente.tipo)
        .gte('data', startDate)
        .lte('data', endDate)
        .single();

      if (!existente) {
        const diaOriginal = parseInt(recorrente.data.split('-')[2]);
        const ultimoDiaMes = new Date(year, month, 0).getDate();
        const dia = Math.min(diaOriginal, ultimoDiaMes);
        const novaData = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        await supabase.from('transactions').insert({
          user_id: userId,
          tipo: recorrente.tipo,
          titulo: recorrente.titulo,
          valor: recorrente.valor,
          categoria: recorrente.categoria,
          membro_id: recorrente.membro_id,
          conta_id: recorrente.conta_id,
          cartao_id: recorrente.cartao_id,
          recorrente: true,
          status: 'pendente',
          data: novaData,
        });
      }
    }
  } catch (error) {
    console.error('Erro ao criar recorrentes:', error);
  }
}
