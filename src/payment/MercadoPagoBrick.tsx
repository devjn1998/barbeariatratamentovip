import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import {
  atualizarDadosAgendamentoPorPagamento,
  criarPagamentoPix,
  testMercadoPagoConnectivity,
  verificarStatusPagamento,
} from "../services/payment";
import { AppointmentData } from "../types/payment";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoBrickProps {
  amount: number;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: Error) => void;
  email?: string;
  description?: string;
  dadosAgendamento?: {
    data: string;
    horario: string;
    nome: string;
    telefone: string;
    servico: string;
  };
}

export default function MercadoPagoBrick({
  amount,
  onSuccess,
  onError,
  email = "cliente@example.com",
  description = "Agendamento de Serviço",
  dadosAgendamento,
}: MercadoPagoBrickProps) {
  const brickContainerRef = useRef<HTMLDivElement>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{
    qrCode: string;
    qrCodeText: string;
    expiresAt: string;
  } | null>(null);

  // Verificação periódica do status do pagamento
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function checkPaymentStatus() {
      try {
        if (!paymentId) return;

        console.log(`⏱️ Verificando status do pagamento: ${paymentId}...`);
        const status = await verificarStatusPagamento(paymentId);
        console.log(`ℹ️ Status atual do pagamento ${paymentId}:`, status);

        if (status.status === "approved") {
          console.log(`✅ Pagamento ${paymentId} aprovado!`);
          clearInterval(intervalId);

          // Só atualizar os dados de agendamento se houver dados
          if (dadosAgendamento) {
            try {
              console.log(
                "📝 Criando agendamento após pagamento aprovado:",
                dadosAgendamento
              );

              // Criar o agendamento utilizando a API
              const response = await api.post("/api/agendamentos", {
                data: dadosAgendamento.data,
                horario: dadosAgendamento.horario,
                servico: dadosAgendamento.servico,
                cliente: {
                  nome: dadosAgendamento.nome,
                  telefone: dadosAgendamento.telefone,
                },
                pagamentoId: paymentId, // Vincular ao pagamento
                status: "confirmado", // Já marcar como confirmado
                preco: amount, // Adicionar o preço do serviço
              });

              console.log("📋 Agendamento criado com sucesso:", response.data);

              // Também atualizar o pagamento com os dados do agendamento
              const appointmentData: AppointmentData = {
                date: dadosAgendamento.data,
                time: dadosAgendamento.horario,
                clientName: dadosAgendamento.nome,
                clientPhone: dadosAgendamento.telefone,
                service: dadosAgendamento.servico,
                status: "confirmado",
                price: amount, // Adicionar o preço do serviço
              };

              await atualizarDadosAgendamentoPorPagamento(
                paymentId,
                appointmentData
              );

              console.log("🔄 Pagamento atualizado com dados do agendamento");
              toast.success("Agendamento confirmado com sucesso!");
            } catch (err) {
              console.error("❌ Erro ao criar agendamento:", err);
              toast.error(
                "Pagamento aprovado, mas houve um erro ao confirmar o agendamento."
              );
              // Não impedir o fluxo de sucesso do pagamento
            }
          }

          toast.success("Pagamento aprovado com sucesso!");
          if (onSuccess) {
            setTimeout(() => {
              onSuccess(paymentId);
            }, 1000); // Pequeno delay para garantir que as mensagens de toast sejam vistas
          }
        }
      } catch (err) {
        console.error("Erro ao verificar status:", err);
        // Não parar a verificação por erros isolados
      }
    }

    if (paymentId) {
      // Verificar imediatamente
      checkPaymentStatus();
      // E depois a cada 3 segundos
      intervalId = setInterval(checkPaymentStatus, 3000);
    }

    // Limpar intervalo quando o componente for desmontado
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentId, onSuccess, dadosAgendamento]);

  const iniciarPagamentoPix = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar conectividade primeiro
      console.log("Verificando conectividade com Mercado Pago...");
      const connectivity = await testMercadoPagoConnectivity();
      console.log("Resultado da verificação de conectividade:", connectivity);

      if (!connectivity) {
        throw new Error(
          "Não foi possível conectar ao Mercado Pago. Verifique sua conexão e tente novamente."
        );
      }

      // Validar dados mínimos para o pagamento
      if (!amount || amount <= 0) {
        throw new Error(`Valor de pagamento inválido: ${amount}`);
      }

      // Converter para número explicitamente
      const valorNumerico = Number(amount);
      if (isNaN(valorNumerico)) {
        throw new Error(`O valor não é um número válido: ${amount}`);
      }

      console.log(`Valor do pagamento (validado): ${valorNumerico}`);

      // Preparar dados do pagamento no formato correto do Mercado Pago
      const paymentData = {
        transaction_amount: valorNumerico, // Campo principal esperado pelo Mercado Pago
        amount: valorNumerico, // Manter para compatibilidade
        payment_method_id: "pix",
        description: description,
        email: email,
        payer: {
          email: email,
          first_name: dadosAgendamento?.nome?.split(" ")[0] || "Cliente",
          last_name:
            dadosAgendamento?.nome?.split(" ").slice(1).join(" ") || "",
          identification: {
            type: "CPF",
            number: "11111111111",
          },
        },
        // Dados adicionais para processamento no backend
        nome: dadosAgendamento?.nome || "Cliente",
        telefone: dadosAgendamento?.telefone || "Não informado",
        data: dadosAgendamento?.data,
        horario: dadosAgendamento?.horario || "A definir",
        servico: dadosAgendamento?.servico,
        // Identificador único para referência (exigido pelo Mercado Pago)
        external_reference: `payment_${Date.now()}`,
      };

      console.log("Dados para pagamento:", paymentData);

      // Criar pagamento PIX
      const resultado = await criarPagamentoPix(paymentData);
      console.log("Pagamento PIX criado:", resultado);

      if (!resultado || !resultado.id) {
        throw new Error(
          "Falha ao gerar o pagamento. Resposta inválida do servidor."
        );
      }

      if (!resultado.qrCode) {
        throw new Error("QR Code PIX não gerado. Tente novamente.");
      }

      // Guardar ID do pagamento e exibir QR Code
      setPaymentId(resultado.id);

      // Verificar e garantir que o QR Code seja uma string válida
      const qrCodeValue = resultado.qrCode || "";
      console.log("Dados do QR Code recebidos:", {
        qrCode: qrCodeValue,
        qrCodeText: resultado.qrCodeText || "",
        tipo: typeof qrCodeValue,
        tamanho: qrCodeValue.length,
      });

      setQrCodeData({
        qrCode: qrCodeValue,
        qrCodeText: resultado.qrCodeText || "",
        expiresAt: resultado.expiresAt || "",
      });

      toast.success("QR Code PIX gerado com sucesso! Escaneie para pagar.");
    } catch (err: any) {
      console.error("Erro ao criar pagamento PIX:", err);

      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage);
      setError(errorMessage);

      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para extrair mensagens de erro apropriadas
  const getErrorMessage = (err: any): string => {
    if (!err) return "Erro desconhecido";

    // Verificar se há resposta da API
    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    // Verificar mensagem genérica
    if (err.message) {
      if (err.message.includes("Network Error")) {
        return "Falha na conexão com o servidor. Verifique sua internet.";
      }

      // Erros HTTP comuns
      if (err.message.includes("400")) {
        return "Dados de pagamento inválidos. Verifique as informações.";
      }
      if (err.message.includes("500")) {
        return "Serviço de pagamento temporariamente indisponível.";
      }

      return err.message;
    }

    return "Erro ao gerar pagamento PIX. Tente novamente.";
  };

  const copiarCodigoPix = () => {
    if (qrCodeData) {
      navigator.clipboard
        .writeText(qrCodeData.qrCodeText)
        .then(() => toast.success("Código PIX copiado!"))
        .catch(() => toast.error("Erro ao copiar código"));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Pagamento via PIX</h2>

      {!qrCodeData && !loading && !error && (
        <div className="text-center">
          <p className="mb-4">
            Valor: <strong>R$ {amount.toFixed(2)}</strong>
          </p>
          <button
            onClick={iniciarPagamentoPix}
            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
          >
            Gerar QR Code PIX
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Gerando código PIX...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          <p className="font-medium">Erro: {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-blue-600 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {qrCodeData && (
        <div className="flex flex-col items-center gap-4 mt-4">
          <p className="text-center text-gray-700 mb-2">
            Escaneie o QR Code ou copie o código PIX para pagar
          </p>

          <div className="p-2 border-2 border-green-500 rounded-lg">
            {qrCodeData.qrCode ? (
              <img
                src={
                  qrCodeData.qrCode.startsWith("data:")
                    ? qrCodeData.qrCode
                    : qrCodeData.qrCode.length > 100
                    ? `data:image/png;base64,${qrCodeData.qrCode}`
                    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        qrCodeData.qrCodeText
                      )}`
                }
                alt="QR Code PIX"
                className="w-64 h-64"
                onError={(e) => {
                  console.error("Erro ao carregar QR Code:", e);
                  e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    qrCodeData.qrCodeText
                  )}`;
                }}
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-red-500">
                QR Code não disponível.
                <br />
                Use o código PIX abaixo.
              </div>
            )}
          </div>

          <div className="w-full">
            <div className="border border-gray-300 rounded-lg p-2 mb-2 bg-gray-50 break-all text-xs">
              {qrCodeData.qrCodeText}
            </div>
            <button
              onClick={copiarCodigoPix}
              className="w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Copiar Código Pix
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              Status:{" "}
              <span className="font-semibold">Aguardando pagamento</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              O status será atualizado automaticamente após o pagamento
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
