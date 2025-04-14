import axios from "axios";

// Criar instância base do axios com configuração apropriada para CORS
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://barbeariatratamentovip.onrender.com",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // importante para CORS com credenciais
});

// Interceptor de resposta simplificado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

// Função para verificar se o servidor está online
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await api.get("/api/health");
    return true;
  } catch (error) {
    console.error("Erro ao verificar saúde do servidor:", error);
    return false;
  }
};

// Adicionar um novo endpoint para disponibilidade
export const checkHorarioDisponibilidade = async (
  data: string,
  horario: string
): Promise<boolean> => {
  try {
    const response = await api.get(
      `/api/disponibilidade?data=${data}&horario=${horario}`
    );
    return response.data.disponivel;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    return false; // Em caso de erro, considerar indisponível por precaução
  }
};

// Adicionar função para obter todos os horários ocupados
export const getHorariosOcupados = async (data: string): Promise<string[]> => {
  try {
    const response = await api.get(`/api/disponibilidade?data=${data}`);
    return response.data.horariosOcupados || [];
  } catch (error) {
    console.error("Erro ao obter horários ocupados:", error);
    return [];
  }
};

// Verificar status de conectividade
export const checkConnectivity = () => {
  return navigator.onLine;
};

export default api;
