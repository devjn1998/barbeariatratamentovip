import { NormalizedPayment, Payment } from "../types/payment";
import { NormalizedAppointment } from "../types/appointment";

/**
 * Traduz o status do pagamento para português
 */
export function translatePaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    in_process: "Em processamento",
    rejected: "Rejeitado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    charged_back: "Estornado",
  };

  return statusMap[status] || status;
}

/**
 * Formata o valor monetário para exibição (R$ XX,XX)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata a data para exibição (DD/MM/YYYY)
 */
export function formatDate(dateString: string): string {
  // Verificar se a string tem o formato YYYY-MM-DD
  if (
    typeof dateString === "string" &&
    dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    try {
      const [year, month, day] = dateString.split("-");
      // Retornar no formato DD/MM/YYYY
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Erro ao formatar data manualmente:", dateString, error);
      return dateString; // Retorna a string original em caso de erro
    }
  }
  // Se não for o formato esperado ou não for string, tentar Intl (ou retornar original)
  try {
    const date = new Date(dateString);
    // Tentar formatar com Intl como fallback, mas CUIDADO com fuso horário
    return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
  } catch (error) {
    console.error("Erro ao formatar data com Intl:", dateString, error);
    return dateString; // Retorna a string original se tudo falhar
  }
}

/**
 * Adapta os dados de pagamento da API do Mercado Pago para o formato normalizado
 */
export function adaptPaymentToNormalized(payment: Payment): NormalizedPayment {
  return {
    id: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    statusText: translatePaymentStatus(payment.status),
    dateCreated: payment.date_created,
    formattedDate: formatDate(payment.date_created),
    transactionAmount: payment.transaction_amount,
    formattedAmount: formatCurrency(payment.transaction_amount),
    description: payment.description,
    paymentMethodId: payment.payment_method_id,

    // Dados do cliente normalizados
    clientName: payment.payer.first_name
      ? `${payment.payer.first_name} ${payment.payer.last_name || ""}`
      : "Cliente não identificado",
    clientEmail: payment.payer.email || "",
    clientPhone: payment.payer.phone?.number || "Telefone não informado",

    // Dados do QR Code para pagamento PIX
    qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
    qrCodeText: payment.point_of_interaction?.transaction_data?.qr_code || "",
    qrCodeBase64:
      payment.point_of_interaction?.transaction_data?.qr_code_base64,
    ticketUrl: payment.point_of_interaction?.transaction_data?.ticket_url,

    // Dados originais (para referência ou debug)
    originalData: payment,
  };
}

/**
 * Adapta dados de pagamento como recebidos do frontend/banco de dados
 * Esta função lida com as diferentes estruturas que podem chegar
 */
export function adaptMixedPaymentData(data: any): NormalizedPayment {
  // Se é um objeto formatado no padrão do Mercado Pago
  if (data.date_created && data.transaction_amount && data.payment_method_id) {
    return {
      id: data.id,
      status: data.status,
      statusDetail: data.status_detail,
      statusText: translatePaymentStatus(data.status),
      dateCreated: data.date_created,
      formattedDate: formatDate(data.date_created),
      transactionAmount: data.transaction_amount,
      formattedAmount: formatCurrency(data.transaction_amount),
      description: data.description,
      paymentMethodId: data.payment_method_id,

      // Dados do cliente
      clientName:
        data.cliente_nome ||
        data.clientName ||
        data.cliente?.nome ||
        (data.payer?.first_name
          ? `${data.payer.first_name} ${data.payer.last_name || ""}`
          : "Cliente não identificado"),
      clientEmail:
        data.cliente_email ||
        data.clientEmail ||
        data.cliente?.email ||
        data.payer?.email ||
        "",
      clientPhone:
        data.cliente_telefone ||
        data.clientPhone ||
        data.cliente?.telefone ||
        data.payer?.phone?.number ||
        "Telefone não informado",

      // Dados do agendamento
      appointmentDate: data.data_agendamento || data.appointmentDate,
      appointmentTime: data.horario_agendamento || data.appointmentTime,
      service: data.servico || data.service,

      // Dados do QR Code para pagamento PIX
      qrCode:
        data.qr_code ||
        data.qrCode ||
        data.point_of_interaction?.transaction_data?.qr_code,
      qrCodeText:
        data.qr_code_text ||
        data.qrCodeText ||
        data.point_of_interaction?.transaction_data?.qr_code ||
        "",
      qrCodeBase64:
        data.qr_code_base64 ||
        data.qrCodeBase64 ||
        data.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl:
        data.ticket_url ||
        data.ticketUrl ||
        data.point_of_interaction?.transaction_data?.ticket_url,
      expiresAt: data.expires_at || data.expiresAt || data.date_of_expiration,
    };
  }

  // Formato já normalizado (provavelmente de outro adaptador)
  if (data.dateCreated && data.transactionAmount && data.paymentMethodId) {
    return data as NormalizedPayment;
  }

  // Formato simplificado (possíveis dados do Firebase)
  return {
    id: data.id || "sem-id",
    status: data.status || "unknown",
    statusDetail: data.status_detail || data.statusDetail || "",
    statusText: translatePaymentStatus(data.status || "unknown"),
    dateCreated:
      data.date_created || data.dateCreated || new Date().toISOString(),
    formattedDate: formatDate(
      data.date_created || data.dateCreated || new Date().toISOString()
    ),
    transactionAmount: data.transaction_amount || data.transactionAmount || 0,
    formattedAmount: formatCurrency(
      data.transaction_amount || data.transactionAmount || 0
    ),
    description: data.description || "Sem descrição",
    paymentMethodId:
      data.payment_method_id || data.paymentMethodId || "unknown",

    // Dados do cliente
    clientName:
      data.cliente_nome ||
      data.clientName ||
      data.cliente?.nome ||
      (data.payer?.first_name
        ? `${data.payer.first_name} ${data.payer.last_name || ""}`
        : "Cliente não identificado"),
    clientEmail:
      data.cliente_email ||
      data.clientEmail ||
      data.cliente?.email ||
      data.payer?.email ||
      "",
    clientPhone:
      data.cliente_telefone ||
      data.clientPhone ||
      data.cliente?.telefone ||
      data.payer?.phone?.number ||
      "Telefone não informado",

    // Dados do QR Code para pagamento PIX
    qrCode: data.qr_code || data.qrCode,
    qrCodeText: data.qr_code_text || data.qrCodeText,
    qrCodeBase64: data.qr_code_base64 || data.qrCodeBase64,
    ticketUrl: data.ticket_url || data.ticketUrl,
    expiresAt: data.expires_at || data.expiresAt,
  };
}

export function createAppointmentFromPayment(
  payment: NormalizedPayment
): NormalizedAppointment {
  return {
    id: "", // Será gerado pelo backend
    date: payment.appointmentDate || "",
    time: payment.appointmentTime || "",
    service: payment.description || "",
    price: payment.transactionAmount || 0,
    status: payment.status === "approved" ? "confirmado" : "pendente",

    formattedDate: formatDate(payment.appointmentDate || ""),
    formattedPrice: formatCurrency(payment.transactionAmount || 0),
    statusText: payment.status === "approved" ? "Confirmado" : "Pendente",

    clientName: payment.clientName || "",
    clientPhone: payment.clientPhone || "",
    clientEmail: payment.clientEmail || "",

    paymentId: payment.id,

    confirmado: payment.status === "approved",

    originalData: undefined,
  };
}
