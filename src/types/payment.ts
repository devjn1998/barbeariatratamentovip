export interface Payment {
  id: string;
  status: string;
  status_detail?: string;
  date_created: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
    phone?: {
      number?: string;
    };
  };
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

/**
 * Interface normalizada para exibição no frontend
 * Esta interface inclui os campos transformados para um formato mais amigável
 */
export interface NormalizedPayment {
  id: string;
  status: string;
  statusDetail?: string;
  statusText?: string; // Texto traduzido do status (para exibição)
  dateCreated: string;
  formattedDate?: string; // Data formatada para exibição (DD/MM/YYYY)
  transactionAmount: number;
  formattedAmount?: string; // Valor formatado para exibição (R$ XX,XX)
  description: string;
  paymentMethodId: string;

  // Dados do cliente normalizados
  clientName: string;
  clientEmail: string;
  clientPhone: string;

  // Dados do agendamento vinculado
  appointmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  service?: string;

  // Dados do QR Code para pagamento PIX
  qrCode?: string;
  qrCodeText?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  ticketUrl?: string;

  // Dados originais (para referência ou debug)
  originalData?: Payment;
}

/**
 * Interface para dados específicos de agendamento
 */
export interface AppointmentData {
  date?: string;
  time?: string;
  service?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  status?: string;
  price?: number;
}
