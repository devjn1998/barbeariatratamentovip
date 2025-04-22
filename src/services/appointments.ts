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
 * Busca TODOS os agendamentos (agora chama a rota base /api/agendamentos)
 * IMPORTANTE: O backend precisa ser ajustado para retornar todos quando sem filtros.
 */
export async function getAllAppointments(): Promise<NormalizedAppointment[]> {
  const startTime = Date.now();
  console.log("🔄 [getAllAppointments] Iniciando busca...");
  try {
    const response = await api.get<Appointment[]>("/api/agendamentos");
    const endTime = Date.now();
    console.log(
      `✅ [getAllAppointments] Sucesso! ${
        response.data.length
      } agendamentos recebidos em ${endTime - startTime}ms.`
    );
    return response.data.map(adaptMixedAppointmentData);
  } catch (error: any) {
    const endTime = Date.now();
    console.error(
      `❌ [getAllAppointments] Erro após ${endTime - startTime}ms:`,
      error
    );
    toast.error("Erro ao carregar todos os agendamentos.");
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
 * Carrega agendamentos CONFIRMADOS de uma data específica
 */
export async function getConfirmedAppointmentsByDate(
  date: string
): Promise<NormalizedAppointment[]> {
  try {
    // Usa a rota GET /api/agendamentos com o novo parâmetro
    const { data } = await api.get(
      `/api/agendamentos?data=${date}&confirmado=true`
    );

    // Normalizar dados
    return Array.isArray(data)
      ? data.map((appointment) => adaptMixedAppointmentData(appointment)) // Reutiliza o adaptador existente
      : [];
  } catch (error) {
    console.error(
      `Erro ao carregar agendamentos CONFIRMADOS da data ${date}:`,
      error
    );
    throw new Error("Não foi possível carregar os agendamentos confirmados");
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
    // Garante que o objeto cliente está sendo enviado corretamente
    const payload = {
      data: appointment.date,
      horario: appointment.time,
      servico: appointment.service,
      preco: appointment.price,
      cliente: {
        // <<< Garante o objeto aninhado
        nome: appointment.clientName,
        telefone: appointment.clientPhone,
        email: appointment.clientEmail, // Pode ser undefined
      },
      status: appointment.status || "agendado", // Status enviado pelo form
      // 'confirmado' será tratado pelo backend baseado no status
    };

    console.log("[createAppointment Service] Enviando payload:", payload); // Log para depuração

    const { data } = await api.post("/api/agendamentos", payload);
    console.log("[createAppointment Service] Resposta recebida:", data); // Log para depuração

    // Usa o adaptador correto para a resposta do backend
    return adaptMixedAppointmentData(data);
  } catch (error: any) {
    console.error("Erro ao criar agendamento:", error);
    // Tenta extrair a mensagem de erro da resposta da API
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Não foi possível criar o agendamento";
    throw new Error(errorMessage);
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

/**
 * Normaliza um objeto Appointment bruto para NormalizedAppointment.
 * Garante que todos os campos esperados pelo frontend estejam presentes.
 */
export function normalizeAppointment(
  appointment: Appointment
): NormalizedAppointment {
  // Lógica de normalização que existia antes
  // (Baseado no código anterior ou na necessidade atual)
  return {
    id: appointment.id,
    date: appointment.data,
    time: appointment.horario,
    service: appointment.servico,
    price: appointment.preco || 0, // Garante um valor numérico
    status: appointment.status || "Desconhecido", // Garante um status

    // Campos formatados
    formattedDate: formatarData(appointment.data),
    formattedPrice: formatarPreco(appointment.preco),
    statusText: traduzirStatus(appointment.status),

    // Dados do cliente (garantindo que 'cliente' existe)
    clientName: appointment.cliente?.nome || "Não informado",
    clientPhone: appointment.cliente?.telefone || "Não informado",
    clientEmail: appointment.cliente?.email, // Pode ser undefined

    // Outros campos
    paymentId: appointment.pagamentoId,
    confirmado:
      appointment.confirmado !== undefined
        ? appointment.confirmado
        : appointment.status === "confirmado" ||
          appointment.status === "agendado", // Inferir se não explícito

    // Metadados
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,

    // Dados originais para referência
    originalData: appointment,
  };
}
