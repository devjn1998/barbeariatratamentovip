import {
  adaptMixedAppointmentData,
  createAppointmentFromPayment,
} from "../adapters";
import { Appointment, NormalizedAppointment } from "../types/appointment";
import { NormalizedPayment } from "../types/payment";
import {
  formatarData,
  formatarPreco,
  traduzirStatus,
} from "../utils/formatters";
import api from "./api";
import { toast } from "react-toastify";

/**
 * Carrega todos os agendamentos
 */
export async function getAllAppointments(): Promise<NormalizedAppointment[]> {
  try {
    const { data } = await api.get("/api/agendamentos/all");

    // Normalizar dados
    return Array.isArray(data)
      ? data.map((appointment) => adaptMixedAppointmentData(appointment))
      : [];
  } catch (error) {
    console.error("Erro ao carregar agendamentos:", error);
    throw new Error("Não foi possível carregar os agendamentos");
  }
}

/**
 * Carrega agendamentos de uma data específica
 */
export async function getAppointmentsByDate(
  date: string
): Promise<NormalizedAppointment[]> {
  try {
    const { data } = await api.get(`/api/agendamentos?data=${date}`);

    // Normalizar dados
    return Array.isArray(data)
      ? data.map((appointment) => adaptMixedAppointmentData(appointment))
      : [];
  } catch (error) {
    console.error(`Erro ao carregar agendamentos da data ${date}:`, error);
    throw new Error("Não foi possível carregar os agendamentos");
  }
}

/**
 * Cria um novo agendamento
 */
export async function createAppointment(
  appointment: Partial<NormalizedAppointment>
): Promise<NormalizedAppointment> {
  try {
    // Preparar os dados para envio (formato esperado pelo backend)
    const payload = {
      data: appointment.date,
      horario: appointment.time,
      servico: appointment.service,
      preco: appointment.price,
      cliente: {
        nome: appointment.clientName,
        telefone: appointment.clientPhone,
        email: appointment.clientEmail,
      },
      status: appointment.status || "agendado",
    };

    const { data } = await api.post("/api/agendamentos", payload);
    return adaptMixedAppointmentData(data);
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    throw new Error("Não foi possível criar o agendamento");
  }
}

/**
 * Atualiza um agendamento existente
 */
export async function updateAppointment(
  id: string,
  appointment: Partial<NormalizedAppointment>
): Promise<NormalizedAppointment> {
  try {
    // Preparar os dados para envio (formato esperado pelo backend)
    const payload = {
      data: appointment.date,
      horario: appointment.time,
      servico: appointment.service,
      cliente: {
        nome: appointment.clientName,
        telefone: appointment.clientPhone,
        email: appointment.clientEmail,
      },
      status: appointment.status,
    };

    const { data } = await api.put(`/api/agendamentos/${id}`, payload);
    return adaptMixedAppointmentData(data);
  } catch (error) {
    console.error(`Erro ao atualizar agendamento ${id}:`, error);
    throw new Error("Não foi possível atualizar o agendamento");
  }
}

/**
 * Exclui um agendamento
 */
export async function deleteAppointment(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete(`/api/agendamentos/${id}`);
    return data.success;
  } catch (error) {
    console.error(`Erro ao excluir agendamento ${id}:`, error);
    throw new Error("Não foi possível excluir o agendamento");
  }
}

/**
 * Cria um agendamento a partir de um pagamento
 */
export async function createAppointmentFromPaymentData(
  payment: NormalizedPayment
): Promise<NormalizedAppointment> {
  try {
    // Converter o pagamento para um agendamento
    const appointmentData = createAppointmentFromPayment(payment);

    // Criar o agendamento
    return await createAppointment(appointmentData);
  } catch (error) {
    console.error("Erro ao criar agendamento a partir do pagamento:", error);
    throw new Error("Não foi possível criar o agendamento");
  }
}

/**
 * Verifica se um horário está disponível
 */
export async function verificarHorarioDisponivel(
  data: string,
  horario: string
): Promise<boolean> {
  try {
    const { data: response } = await api.get(
      `/api/disponibilidade?data=${data}&horario=${horario}`
    );

    if (!response.disponivel) {
      if (response.message) {
        toast.info(response.message);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    toast.error("Erro ao verificar disponibilidade do horário");
    return false; // Por segurança, considerar indisponível em caso de erro
  }
}

/**
 * Obtém horários ocupados para uma data
 */
export async function getOccupiedTimes(date: string): Promise<string[]> {
  try {
    const { data } = await api.get(`/api/disponibilidade?data=${date}`);
    return data.horariosOcupados || [];
  } catch (error) {
    console.error("Erro ao obter horários ocupados:", error);
    return []; // Retorna array vazio em caso de erro
  }
}

// Corrigir a função de normalização para incluir o campo 'confirmado'
export function normalizeAppointment(
  appointment: Appointment
): NormalizedAppointment {
  return {
    id: appointment.id,
    date: appointment.data,
    time: appointment.horario,
    service: appointment.servico,
    price: appointment.preco,
    status: appointment.status,

    formattedDate: formatarData(appointment.data),
    formattedPrice: formatarPreco(appointment.preco),
    statusText: traduzirStatus(appointment.status),

    clientName: appointment.cliente.nome,
    clientPhone: appointment.cliente.telefone,
    clientEmail: appointment.cliente.email,
    paymentId: appointment.pagamentoId,

    // Usar a propriedade confirmado existente ou inferir do status
    confirmado:
      appointment.confirmado !== undefined
        ? appointment.confirmado
        : appointment.status === "confirmado",

    // Metadados
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,

    // Dados originais
    originalData: appointment,
  };
}
