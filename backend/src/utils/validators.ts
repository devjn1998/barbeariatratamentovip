/**
 * Utilitários para validação de dados
 */

/**
 * Valida dados de agendamento
 * @param data Dados a serem validados
 * @returns Objeto com resultado da validação
 */
export function validarDadosAgendamento(data: any) {
  const errors = [];

  if (!data) {
    return { valid: false, errors: ["Dados não fornecidos"] };
  }

  // Validar campos básicos
  if (!data.data) errors.push("Data não fornecida");
  if (!data.horario) errors.push("Horário não fornecido");
  if (!data.servico) errors.push("Serviço não fornecido");

  // Validar cliente
  if (!data.cliente) {
    errors.push("Dados do cliente não fornecidos");
  } else {
    if (!data.cliente.nome) errors.push("Nome do cliente não fornecido");
    if (!data.cliente.telefone)
      errors.push("Telefone do cliente não fornecido");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida dados de pagamento
 * @param data Dados a serem validados
 * @returns Objeto com resultado da validação
 */
export function validarDadosPagamento(data: any) {
  const errors = [];

  if (!data) {
    return { valid: false, errors: ["Dados não fornecidos"] };
  }

  // Verificar campos obrigatórios para pagamento
  const amount = data.amount || data.valor;
  if (!amount || amount <= 0) {
    errors.push("Valor do pagamento não fornecido ou inválido");
  }

  // Email é opcional mas deve ser válido se fornecido
  if (data.email && !isValidEmail(data.email)) {
    errors.push("Email inválido");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida se uma string é um email válido
 * @param email String a ser validada
 * @returns boolean indicando se é válido
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de data (YYYY-MM-DD)
 * @param date String de data a ser validada
 * @returns boolean indicando se é válido
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Valida formato de horário (HH:MM)
 * @param time String de horário a ser validada
 * @returns boolean indicando se é válido
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}
