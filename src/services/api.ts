import axios from "axios";
import { auth } from "../config/firebase"; // <<< Importar auth do Firebase

// Criar instância base do axios com configuração apropriada para CORS
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "https://barbeariatratamentovip.onrender.com",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // importante para CORS com credenciais
});

// --- INTERCEPTOR DE REQUISIÇÃO PARA ADICIONAR TOKEN ---
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken(); // Obtém o token atual (ou atualiza se expirado)
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          "[API Interceptor] Token adicionado ao cabeçalho Authorization."
        );
      } catch (error) {
        console.error("[API Interceptor] Erro ao obter token ID:", error);
        // Lidar com erro de obtenção de token (ex: redirecionar para login?)
        // Dependendo da sua lógica de AuthContext, isso pode já ser tratado lá.
      }
    } else {
      console.log(
        "[API Interceptor] Nenhum usuário logado, requisição sem token."
      );
    }
    return config;
  },
  (error) => {
    console.error(
      "[API Interceptor] Erro na configuração da requisição:",
      error
    );
    return Promise.reject(error);
  }
);
// --- FIM DO INTERCEPTOR ---

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

    // --- TRATAMENTO DE ERRO 401/403 ---
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Se o erro for de autenticação/autorização,
      // pode ser útil deslogar o usuário ou redirecionar para o login.
      // Isso depende da sua implementação do AuthContext.
      console.warn(
        `[API Interceptor] Erro ${error.response.status}. Verifique autenticação/permissões.`
      );
      // Exemplo: Chamar uma função de logout do seu AuthContext
      // authContext.logout(); // (Ajuste conforme sua implementação)
      // Ou redirecionar:
      // window.location.href = '/admin/login';
    }
    // --- FIM DO TRATAMENTO ---

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
