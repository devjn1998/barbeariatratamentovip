import api from "./api";

// Função para verificar se o backend está rodando
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get("/api/health");
    return response.status === 200;
  } catch (error) {
    console.error("Backend não está disponível:", error);
    return false;
  }
};
