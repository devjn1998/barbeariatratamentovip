// Transformar arquivo em módulo e adicionar tipos apropriados
export const MAX_RETRIES = 3;

// Adicionamos tipos genéricos para dar flexibilidade de retorno
export async function retryRequest<T>(
  fn: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Se atingiu o limite máximo de tentativas, desiste
    if (retryCount >= MAX_RETRIES) {
      console.error(`Máximo de ${MAX_RETRIES} tentativas atingido:`, error);
      throw error;
    }

    console.log(`Tentativa ${retryCount + 1} falhou, tentando novamente...`);
    // Espera um tempo crescente antes de tentar novamente (backoff exponencial)
    await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
    return retryRequest(fn, retryCount + 1);
  }
}
