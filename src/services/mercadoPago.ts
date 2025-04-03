import api from "./api"; // Importar a instância configurada do Axios

export async function testMercadoPagoConnectivity(): Promise<boolean> {
  console.log(
    "[Frontend Check] Verificando conectividade com o backend (via /api/mercadopago/test)"
  );
  try {
    // Usar a instância 'api' com a baseURL correta e chamar o endpoint de teste
    const response = await api.get("/api/mercadopago/test");

    // Verificar se a resposta do backend indica sucesso
    if (response.status === 200 && response.data && response.data.success) {
      console.log("[Frontend Check] Conectividade com backend OK.");
      return true;
    } else {
      // Logar se a resposta não foi a esperada
      console.warn(
        "[Frontend Check] Resposta inesperada do backend:",
        response.data
      );
      throw new Error(`Resposta inesperada do servidor: ${response.status}`);
    }
  } catch (error: any) {
    console.error(
      "[Frontend Check] Erro na verificação de conectividade:",
      error
    );
    if (error.response) {
      console.error(
        "[Frontend Check] Detalhes da resposta do erro:",
        error.response.data
      );
      console.error("[Frontend Check] Status do erro:", error.response.status);
    } else {
      console.error(
        "[Frontend Check] Erro sem resposta do servidor (pode ser rede/CORS antes da resposta):"
      );
    }
    // RETORNAR FALSE EM CASO DE ERRO
    return false;
  }
}
