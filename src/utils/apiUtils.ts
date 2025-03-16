import { AxiosError } from "axios";
import { toast } from "react-toastify";

/**
 * Interface para tratar os erros da API padronizados
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: string[];
  status?: number;
}

/**
 * Trata os erros da API de forma unificada
 * @param error Erro capturado
 * @param defaultMessage Mensagem padrão caso o erro não tenha mensagem específica
 * @returns Objeto de erro formatado
 */
export function handleApiError(
  error: unknown,
  defaultMessage = "Ocorreu um erro inesperado"
): ApiErrorResponse {
  // Se já for um erro da API formatado, retorna ele
  if (isApiErrorResponse(error)) {
    return error;
  }

  // Se for um erro do Axios
  if (error instanceof AxiosError) {
    const status = error.response?.status || 500;
    const data = error.response?.data;

    if (data && typeof data === "object" && "message" in data) {
      return {
        error: data.error || "Erro na requisição",
        message: data.message as string,
        details: data.details as string[],
        status,
      };
    }

    return {
      error: "Erro na requisição",
      message: error.message || defaultMessage,
      status,
    };
  }

  // Para outros tipos de erro
  if (error instanceof Error) {
    return {
      error: "Erro inesperado",
      message: error.message || defaultMessage,
    };
  }

  // Fallback para erros desconhecidos
  return {
    error: "Erro desconhecido",
    message: defaultMessage,
  };
}

/**
 * Verifica se um objeto é uma resposta de erro da API
 */
function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "error" in obj &&
    "message" in obj
  );
}

/**
 * Exibe uma mensagem de erro com base na resposta da API
 * @param error Erro capturado
 * @param defaultMessage Mensagem padrão caso o erro não tenha mensagem específica
 */
export function showApiError(
  error: unknown,
  defaultMessage = "Ocorreu um erro inesperado"
): void {
  const formattedError = handleApiError(error, defaultMessage);
  toast.error(formattedError.message);
}

/**
 * Tenta executar uma função com tratamento de erro padronizado
 * @param fn Função a ser executada
 * @param errorHandler Manipulador de erro (opcional)
 * @returns Resultado da função ou erro formatado
 */
export async function trySafe<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: ApiErrorResponse) => void
): Promise<T | ApiErrorResponse> {
  try {
    return await fn();
  } catch (error) {
    const formattedError = handleApiError(error);

    if (errorHandler) {
      errorHandler(formattedError);
    } else {
      showApiError(error);
    }

    return formattedError;
  }
}
