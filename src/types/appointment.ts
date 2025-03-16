/**
 * Interface para dados brutos de agendamento vindos do backend
 */
export interface Appointment {
  id: string;
  data: string;
  horario: string;
  servico: string;
  preco: number;
  status: "agendado" | "concluido" | "cancelado" | string;
  cliente: {
    nome: string;
    telefone: string;
    email?: string;
  };
  pagamentoId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface normalizada para exibição no frontend
 */
export interface NormalizedAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
  price: number;
  status: string;
  formattedDate?: string; // Data formatada (DD/MM/YYYY)
  formattedPrice?: string; // Preço formatado (R$ XX,XX)
  statusText?: string; // Texto amigável do status
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  paymentId?: string;

  // Metadados
  createdAt?: string;
  updatedAt?: string;

  // Dados originais (para referência ou debug)
  originalData?: Appointment;
}

/**
 * Enum para status de agendamento
 */
export enum AppointmentStatus {
  SCHEDULED = "agendado",
  COMPLETED = "concluido",
  CANCELED = "cancelado",
  PENDING = "pendente",
}

/**
 * Mapeamento de status para texto amigável
 */
export const AppointmentStatusText = {
  [AppointmentStatus.SCHEDULED]: "Agendado",
  [AppointmentStatus.COMPLETED]: "Concluído",
  [AppointmentStatus.CANCELED]: "Cancelado",
  [AppointmentStatus.PENDING]: "Pendente",
};
