const config = {
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || "localhost",
  },
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
    sandbox: process.env.NODE_ENV !== "production",
  },
  firebase: {
    enabled: process.env.FIREBASE_ENABLED === "true",
  },
  endpoints: {
    health: "/api/health",
    payments: "/api/pagamentos",
    appointments: "/api/agendamentos",
  },
};

export default config;
