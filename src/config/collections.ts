import { collection } from "firebase/firestore";
import { db } from "./firebase";

// Referências das coleções
export const agendamentosRef = collection(db, "agendamentos");
export const servicosRef = collection(db, "servicos");
export const configuracoesRef = collection(db, "configuracoes");

// Tipos
export interface Agendamento {
  id: string;
  data: string;
  horario: string;
  servico: string;
  preco: number;
  status: "agendado" | "concluido" | "cancelado";
  cliente: {
    nome: string;
    telefone: string;
  };
  criadoEm: Date;
}

export interface Servico {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  duracaoMinutos: number;
  ativo: boolean;
  ordem: number;
}

export interface Configuracao {
  id: "horarios";
  horariosDisponiveis: string[];
  diasFuncionamento: {
    [key: string]: boolean;
  };
  intervaloEntreAgendamentos: number;
}
