import { supabase } from "./supabase";

export interface Carro {
  id: string;
  nome: string;
  placa?: string | null;
  ativo: boolean;
}

// Compromisso minimal pra checagem de conflito (string "HH:mm" ou Date pra data)
interface CompromissoConflito {
  id: string;
  carroId?: string | null;
  data: Date | string;
  horaInicio: string;
  horaFim: string;
}

const sameDay = (a: Date | string, b: Date | string): boolean => {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

// "HH:mm" comparison funciona como string lexicograficamente
const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && aEnd > bStart;
};

/**
 * Retorna o compromisso conflitante (se houver) pra um carro num intervalo.
 * excludeId: pra editar compromisso existente sem conflitar consigo mesmo.
 */
export const findCarroConflito = (
  carroId: string,
  data: Date,
  horaInicio: string,
  horaFim: string,
  todos: CompromissoConflito[],
  excludeId?: string
): CompromissoConflito | null => {
  if (!carroId || !horaInicio || !horaFim) return null;
  return todos.find(c =>
    c.id !== excludeId &&
    c.carroId === carroId &&
    sameDay(c.data, data) &&
    overlaps(c.horaInicio, c.horaFim, horaInicio, horaFim)
  ) || null;
};

export const fetchCarrosAtivos = async (): Promise<Carro[]> => {
  const { data, error } = await supabase
    .from("medwork_carros")
    .select("*")
    .eq("ativo", true)
    .order("nome");
  if (error) {
    console.error("[carros] fetch error:", error);
    return [];
  }
  return (data || []) as Carro[];
};

export const fetchCarrosTodos = async (): Promise<Carro[]> => {
  const { data, error } = await supabase
    .from("medwork_carros")
    .select("*")
    .order("ativo", { ascending: false })
    .order("nome");
  if (error) return [];
  return (data || []) as Carro[];
};

export const createCarro = async (nome: string, placa?: string): Promise<Carro | null> => {
  const { data, error } = await supabase
    .from("medwork_carros")
    .insert({ nome, placa: placa || null, ativo: true })
    .select()
    .single();
  if (error) {
    console.error("[carros] create error:", error);
    return null;
  }
  return data as Carro;
};

export const updateCarro = async (id: string, patch: Partial<Carro>): Promise<boolean> => {
  const { error } = await supabase.from("medwork_carros").update(patch).eq("id", id);
  return !error;
};

export const deleteCarro = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from("medwork_carros").delete().eq("id", id);
  return !error;
};
