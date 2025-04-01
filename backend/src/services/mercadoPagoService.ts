import axios from "axios"; // Adiciona axios para diagnóstico
import dotenv from "dotenv";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { MercadoPagoConfig, Payment } from "mercadopago";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
console.log(
  `🌎 Executando em ambiente ${isProduction ? "de PRODUÇÃO" : "de TESTE"}`
);

// Usar o token configurado no arquivo ou no ambiente
const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

// Primeiro teste depois das alterações
if (ACCESS_TOKEN.startsWith("APP_USR")) {
  console.log("⚠️ Usando credenciais de PRODUÇÃO! Pagamentos serão reais!");
} else if (ACCESS_TOKEN.startsWith("TEST-")) {
  console.log("ℹ️ Usando credenciais de TESTE");
} else {
  console.log("⚠️ Token de acesso não configurado corretamente:", ACCESS_TOKEN);
}

// Teste de conectividade com a API
async function testConnectivity() {
  try {
    console.log("Testando conectividade com Mercado Pago...");
    const response = await axios.get(
      "https://api.mercadopago.com/v1/payment_methods",
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        timeout: 10000, // 10 segundos
      }
    );
    console.log("✅ Conectividade com Mercado Pago OK!");
    return true;
  } catch (error) {
    console.error("❌ Falha na conectividade com Mercado Pago:", error);
    return false;
  }
}

// Executa o teste de conectividade na inicialização
testConnectivity();

// Cliente do Mercado Pago com configuração corrigida
const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
});

export interface PaymentData {
  amount: number;
  description: string;
  email: string;
  name?: string;
  identification?: {
    type: string;
    number: string;
  };
}

// Função para verificar status do pagamento
export async function checkPaymentStatus(paymentId: string) {
  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
    });

    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    console.log(
      `✅ Pagamento ${paymentId} verificado com sucesso:`,
      result.status
    );

    // Salvar no Firebase imediatamente
    try {
      const db = getFirestore();
      await setDoc(
        doc(db, "payments", paymentId.toString()),
        {
          id: result.id,
          status: result.status,
          statusDetail: result.status_detail,
          approved: result.status === "approved",
          transaction_amount: result.transaction_amount,
          date_created: result.date_created,
          description: result.description,
          payment_method_id: result.payment_method_id,
          payer: result.payer,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`💾 Pagamento ${paymentId} salvo no Firebase`);
    } catch (dbError) {
      console.error(
        `❌ Erro ao salvar pagamento ${paymentId} no Firebase:`,
        dbError
      );
    }

    return {
      id: result.id,
      status: result.status,
      statusDetail: result.status_detail,
      approved: result.status === "approved",
      transaction_amount: result.transaction_amount,
      date_created: result.date_created,
      description: result.description,
      payment_method_id: result.payment_method_id,
      payer: result.payer,
    };
  } catch (error: any) {
    console.error(`❌ Erro ao verificar pagamento ${paymentId}:`, error);

    return {
      id: paymentId,
      status: "unknown",
      statusDetail: "Erro ao verificar status",
      approved: false,
      error: error.message,
    };
  }
}

// Função para criar um pagamento PIX
export async function createPixPayment(paymentData: any) {
  try {
    console.log(
      "💳 [createPixPayment INÍCIO] Payload recebido no serviço:",
      JSON.stringify(paymentData, null, 2)
    );

    // Garantir que temos um token de acesso
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
    if (!accessToken) {
      console.error(
        "❌ [createPixPayment ERRO] Token de acesso não configurado"
      );
      throw new Error("Token de acesso do Mercado Pago não configurado");
    }

    console.log(
      "🔑 [createPixPayment Token] Usando token de acesso:",
      accessToken.substring(0, 10) + "..."
    );

    const client = new MercadoPagoConfig({
      accessToken: accessToken,
    });

    const payment = new Payment(client);

    console.log(
      "💳 Recebido payload para pagamento:",
      JSON.stringify(paymentData, null, 2)
    );

    // CORREÇÃO CRÍTICA: Verificar e converter todos os campos possíveis relacionados a valor
    let valorFinal = null;

    // Verificar campos em inglês e português para maior compatibilidade
    if (
      paymentData.transaction_amount !== undefined &&
      paymentData.transaction_amount !== null
    ) {
      valorFinal = Number(paymentData.transaction_amount);
      console.log(`🔄 Usando transaction_amount existente: ${valorFinal}`);
    } else if (
      paymentData.amount !== undefined &&
      paymentData.amount !== null
    ) {
      valorFinal = Number(paymentData.amount);
      console.log(
        `🔄 Convertendo campo 'amount' para 'transaction_amount': ${valorFinal}`
      );
    } else if (paymentData.valor !== undefined && paymentData.valor !== null) {
      valorFinal = Number(paymentData.valor);
      console.log(
        `🔄 Convertendo campo 'valor' para 'transaction_amount': ${valorFinal}`
      );
    }

    console.log(
      `💰 [createPixPayment Valor] Valor final determinado: ${valorFinal}`
    );

    // Validação final antes de continuar
    if (valorFinal === null || isNaN(valorFinal) || valorFinal <= 0) {
      const errorMsg = `Valor inválido ou não especificado para pagamento: ${valorFinal}`;
      console.error(`❌ [createPixPayment ERRO Validação] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Remover propriedades extras que podem estar causando problemas
    const {
      amount,
      valor,
      nome,
      telefone,
      data,
      horario,
      servico,
      ...restPayload
    } = paymentData;

    // Criar um novo payload no formato específico que o Mercado Pago espera
    const mercadoPagoPayload = {
      body: {
        transaction_amount: valorFinal,
        description: paymentData.description || "Pagamento",
        payment_method_id: "pix",
        payer: {
          email: paymentData.email || "cliente@example.com",
          first_name:
            paymentData.payer?.first_name || nome?.split(" ")[0] || "Cliente",
          last_name:
            paymentData.payer?.last_name ||
            nome?.split(" ").slice(1).join(" ") ||
            "",
          identification: {
            type: "CPF",
            number: paymentData.identification?.number || "12345678909",
          },
        },
        // ID externo para correlação (obrigatório segundo as pendências)
        external_reference: `payment_${Date.now()}`,
      },
    };

    console.log(
      `💰 Valor final para pagamento: ${valorFinal} (${typeof valorFinal})`
    );
    console.log(
      "📝 [createPixPayment Payload MP] Payload final para API MP:",
      JSON.stringify(mercadoPagoPayload.body, null, 2)
    );

    try {
      console.log(
        "📡 [createPixPayment Chamando MP] Enviando requisição para Mercado Pago..."
      );
      const result = await payment.create(mercadoPagoPayload);
      console.log(
        "✅ [createPixPayment MP OK] Resposta do Mercado Pago:",
        JSON.stringify(result, null, 2)
      );

      if (result.point_of_interaction?.transaction_data) {
        console.log("📱 [createPixPayment QR Code] QR Code gerado com sucesso");
      } else {
        console.warn(
          "⚠️ [createPixPayment QR Code] QR Code não foi gerado na resposta"
        );
      }

      return result;
    } catch (paymentError: any) {
      console.error(
        "❌ [createPixPayment MP ERRO] Falha na chamada para API MP:",
        paymentError
      );
      if (paymentError.cause) {
        console.error(
          "❌ [createPixPayment MP ERRO Detalhes]:",
          JSON.stringify(paymentError.cause, null, 2)
        );
      }
      throw paymentError; // Re-lançar o erro
    }
  } catch (error) {
    console.error("❌ [createPixPayment ERRO GERAL]:", error);
    throw error; // Re-lançar o erro
  }
}

// Exportar todas as funções em um único objeto
export const mercadoPagoService = {
  checkPaymentStatus,
  createPixPayment,
  // Adicione outras funções aqui conforme necessário
};
