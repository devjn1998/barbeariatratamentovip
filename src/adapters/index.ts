import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusText,
  NormalizedAppointment,
} from "../types/appointment";
import { NormalizedPayment } from "../types/payment";
import { formatCurrency, formatDate } from "../utils/formatters";
import { createAppointmentFromPayment as originalCreateAppointmentFromPayment } from "./paymentAdapter";

// Arquivo central para exportar todos os adaptadores
export * from "./appointmentAdapter";
export * from "./paymentAdapter";

export function adaptMixedAppointmentData(
  appointment: any
): NormalizedAppointment {
  return {
    id: appointment.id,
    date: appointment.date || appointment.data,
    time: appointment.time || appointment.horario,
    service: appointment.service || appointment.servico,
    price: appointment.price || appointment.preco,
    status: appointment.status,
    formattedDate: formatDate(appointment.date || appointment.data),
    formattedPrice: formatCurrency(appointment.price || appointment.preco),
    statusText:
      AppointmentStatusText[appointment.status as AppointmentStatus] ||
      appointment.status,

    // Dados do cliente
    clientName:
      appointment.clientName ||
      appointment.cliente?.nome ||
      "Cliente não identificado",
    clientPhone:
      appointment.clientPhone ||
      appointment.cliente?.telefone ||
      "Telefone não informado",
    clientEmail: appointment.clientEmail || appointment.cliente?.email,

    // Dados de pagamento
    paymentId: appointment.paymentId || appointment.pagamentoId,

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

export const createAppointmentFromPayment =
  originalCreateAppointmentFromPayment;
