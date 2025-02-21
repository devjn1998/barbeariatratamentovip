import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface Appointment {
  id: string;
  data: string;
  horario: string;
  servico: string;
  cliente: {
    nome: string;
    telefone: string;
  };
  status: "agendado" | "concluido" | "cancelado";
  preco: number;
}

export const horariosDisponiveis = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export async function verificarHorarioDisponivel(
  data: string,
  horario: string
): Promise<boolean> {
  const agendamentosRef = collection(db, "agendamentos");
  const q = query(
    agendamentosRef,
    where("data", "==", data),
    where("horario", "==", horario),
    where("status", "==", "agendado")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

export async function adicionarAgendamento(
  appointment: Omit<Appointment, "id">
) {
  try {
    const docRef = await addDoc(collection(db, "agendamentos"), appointment);
    return { ...appointment, id: docRef.id };
  } catch (error) {
    console.error("Erro ao adicionar agendamento:", error);
    throw error;
  }
}

export async function getAgendamentosPorData(
  data: string
): Promise<Appointment[]> {
  const agendamentosRef = collection(db, "agendamentos");
  const q = query(agendamentosRef, where("data", "==", data));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...doc.data(),
  })) as Appointment[];
}
