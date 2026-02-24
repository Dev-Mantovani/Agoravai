import { supabase } from '../lib/supabase';

export async function criarTransacoesRecorrentesMes(
  idUsuario: string,
  ano: number,
  mes: number,
) {
  try {
    const { data: recorrentes } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', idUsuario)
      .eq('recorrente', true);

    if (!recorrentes || recorrentes.length === 0) return;

    const recorrentesUnicas = recorrentes.reduce((acumulador: any[], atual) => {
      if (!acumulador.find((r) => r.titulo === atual.titulo && r.tipo === atual.tipo)) {
        acumulador.push(atual);
      }
      return acumulador;
    }, []);

    for (const recorrente of recorrentesUnicas) {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const dataFim = new Date(ano, mes, 0).toISOString().split('T')[0];

      const { data: jaExiste } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', idUsuario)
        .eq('titulo', recorrente.titulo)
        .eq('tipo', recorrente.tipo)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .single();

      if (!jaExiste) {
        const diaOriginal = parseInt(recorrente.data.split('-')[2]);
        const ultimoDiaMes = new Date(ano, mes, 0).getDate();
        const dia = Math.min(diaOriginal, ultimoDiaMes);
        const novaData = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        await supabase.from('transactions').insert({
          user_id: idUsuario,
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
  } catch (erro) {
    console.error('Erro ao criar recorrentes:', erro);
  }
}
