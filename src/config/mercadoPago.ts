export const MERCADO_PAGO_CONFIG = {
  PUBLIC_KEY: "APP_USR-35672bf0-9786-4774-a8cc-495b4664c294",
  SITE_ID: "MLB", // Brasil
};

// Função para verificar conectividade com Mercado Pago
export async function testMercadoPagoConnectivity() {
  try {
    const response = await fetch("/api/mercadopago/test");
    if (!response.ok) {
      throw new Error("Erro ao conectar com Mercado Pago");
    }
    const data = await response.json();
    console.log("Conectividade com Mercado Pago:", data);
    return data.success;
  } catch (error) {
    console.error("Erro na verificação de conectividade:", error);
    return false;
  }
}

// Função para validar a configuração
(() => {
  if (!MERCADO_PAGO_CONFIG.PUBLIC_KEY) {
    console.error("⚠️ Configuração do Mercado Pago incompleta!");
  }
})();

export default MERCADO_PAGO_CONFIG;
