const config = {
  API_URL: process.env.REACT_APP_API_URL || "http://localhost:3001",
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  ENDPOINTS: {
    PAYMENTS: "/api/pagamentos",
    APPOINTMENTS: "/api/agendamentos",
    APPOINTMENTS_ALL: "/api/agendamentos",
    APPOINTMENTS_BY_DATE: (date: string) => `/api/agendamentos?data=${date}`,
    HEALTH: "/api/health",
  },
};

// Validação da configuração
if (!config.API_URL) {
  console.error("❌ URL da API não configurada!");
}

export default config;
