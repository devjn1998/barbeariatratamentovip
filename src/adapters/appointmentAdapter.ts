import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusText,
  NormalizedAppointment,
} from "../types/appointment";
import { formatCurrency, formatDate } from "../utils/formatters";

/**
 * Adapta os dados de agendamento para o formato normalizado
 */
export function adaptAppointmentToNormalized(
  appointment: Appointment
): NormalizedAppointment {
  return {
    id: appointment.id,
    date: appointment.data,
    time: appointment.horario,
    service: appointment.servico,
    price: appointment.preco,
    status: appointment.status,
    formattedDate: formatDate(appointment.data),
    formattedPrice: formatCurrency(appointment.preco),
    statusText:
      AppointmentStatusText[appointment.status as AppointmentStatus] ||
      appointment.status,

    // Dados do cliente
    clientName: appointment.cliente?.nome || "Cliente não identificado",
    clientPhone: appointment.cliente?.telefone || "Telefone não informado",
    clientEmail: appointment.cliente?.email,

    // Dados de pagamento
    paymentId: appointment.pagamentoId,

    // Metadados
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,

    // Dados originais
    originalData: appointment,
  };
}

/**
 * Adapta dados mistos de agendamento (dados que podem vir de diferentes fontes)
 */
export function adaptMixedAppointmentData(data: any): NormalizedAppointment {
  // Definir valores padrão para garantir que sempre teremos dados válidos
  const normalized: NormalizedAppointment = {
    id: data.id,
    date: data.data || data.date || "",
    time: data.horario || data.time || "",
    service: data.servico || data.service || "",
    price:
      typeof data.preco === "number"
        ? data.preco
        : typeof data.price === "number"
        ? data.price
        : 0,
    status: data.status || AppointmentStatus.PENDING,

    // Formatar valores para exibição
    formattedDate: formatDate(data.data || data.date || ""),
    formattedPrice: formatCurrency(data.preco || data.price || 0),
    statusText: data.status
      ? AppointmentStatusText[data.status as AppointmentStatus] || data.status
      : "Pendente",

    // Dados do cliente
    clientName:
      data.cliente_nome ||
      data.clientName ||
      (data.cliente && data.cliente.nome) ||
      "Cliente não identificado",

    clientPhone:
      data.cliente_telefone ||
      data.clientPhone ||
      (data.cliente && data.cliente.telefone) ||
      "Telefone não informado",

    clientEmail:
      data.cliente_email ||
      data.clientEmail ||
      (data.cliente && data.cliente.email),

    // Dados de pagamento
    paymentId: data.pagamentoId || data.paymentId,

    confirmado:
      data.confirmado !== undefined
        ? data.confirmado
        : data.status === "confirmado",
  };

  return normalized;
}

/**
 * Adapta dados de um pagamento para criar um objeto de agendamento
 */
export function createAppointmentFromPayment(
  paymentData: any
): NormalizedAppointment {
  // Extrair dados relevantes
  const appointmentDate =
    paymentData.data_agendamento ||
    paymentData.appointmentDate ||
    paymentData.data;

  const appointmentTime =
    paymentData.horario_agendamento ||
    paymentData.appointmentTime ||
    paymentData.horario;

  const service =
    paymentData.servico ||
    paymentData.service ||
    paymentData.description ||
    "Serviço não especificado";

  const price =
    paymentData.transaction_amount ||
    paymentData.transactionAmount ||
    paymentData.preco ||
    paymentData.price ||
    0;

  // Extrair dados do cliente de diferentes formatos possíveis
  const clientName =
    paymentData.cliente_nome ||
    paymentData.clientName ||
    (paymentData.cliente && paymentData.cliente.nome) ||
    (paymentData.payer &&
      `${paymentData.payer.first_name || ""} ${
        paymentData.payer.last_name || ""
      }`.trim()) ||
    "Cliente não identificado";

  const clientPhone =
    paymentData.cliente_telefone ||
    paymentData.clientPhone ||
    (paymentData.cliente && paymentData.cliente.telefone) ||
    (paymentData.payer &&
      paymentData.payer.phone &&
      paymentData.payer.phone.number) ||
    "Telefone não informado";

  const clientEmail =
    paymentData.cliente_email ||
    paymentData.clientEmail ||
    (paymentData.cliente && paymentData.cliente.email) ||
    (paymentData.payer && paymentData.payer.email);

  // Criar o agendamento normalizado
  const normalized: NormalizedAppointment = {
    id: `appointment_${paymentData.id || new Date().getTime()}`,
    date: appointmentDate || new Date().toISOString().split("T")[0],
    time: appointmentTime || "12:00",
    service,
    price,
    status: AppointmentStatus.SCHEDULED,
    formattedDate: formatDate(appointmentDate || new Date().toISOString()),
    formattedPrice: formatCurrency(price),
    statusText: AppointmentStatusText[AppointmentStatus.SCHEDULED],
    clientName,
    clientPhone,
    clientEmail,
    paymentId: paymentData.id,
    confirmado:
      paymentData.confirmado !== undefined
        ? paymentData.confirmado
        : paymentData.status === "confirmado",
  };

  return normalized;
}
