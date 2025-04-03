import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";
import {
  atualizarDadosAgendamentoPorPagamento,
  criarPagamentoPix,
  verificarStatusPagamento,
} from "../services/payment";
import { AppointmentData, NormalizedPayment } from "../types/payment";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface DadosAgendamentoProps {
  data: string;
  horario: string;
  nome: string;
  telefone: string;
  servico: string;
  email?: string;
}

interface QrCodeData {
  qrCode: string;
  qrCodeBase64: string;
  expiresAt: string;
}

interface MercadoPagoBrickProps {
  amount: number;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: Error) => void;
  email?: string;
  description?: string;
  dadosAgendamento: DadosAgendamentoProps;
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
  const [qrCodeData, setQrCodeData] = useState<QrCodeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const paymentStatusInterval = useRef<NodeJS.Timeout | null>(null);

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

          if (dadosAgendamento) {
            try {
              console.log(
                "📝 Criando agendamento após pagamento aprovado:",
                dadosAgendamento
              );

              const response = await api.post("/api/agendamentos", {
                data: dadosAgendamento.data,
                horario: dadosAgendamento.horario,
                servico: dadosAgendamento.servico,
                cliente: {
                  nome: dadosAgendamento.nome,
                  telefone: dadosAgendamento.telefone,
                },
                pagamentoId: paymentId,
                status: "confirmado",
                preco: amount,
              });

              console.log("📋 Agendamento criado com sucesso:", response.data);

              const appointmentData: AppointmentData = {
                date: dadosAgendamento.data,
                time: dadosAgendamento.horario,
                clientName: dadosAgendamento.nome,
                clientPhone: dadosAgendamento.telefone,
                service: dadosAgendamento.servico,
                status: "confirmado",
                price: amount,
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
            }
          }

          toast.success("Pagamento aprovado com sucesso!");
          if (onSuccess) {
            setTimeout(() => {
              onSuccess(paymentId);
            }, 1000);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar status:", err);
      }
    }

    if (paymentId) {
      checkPaymentStatus();
      intervalId = setInterval(checkPaymentStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentId, onSuccess, dadosAgendamento]);

  const checkBackendConnectivity = async (): Promise<boolean> => {
    console.log(
      "[Frontend Check] Verificando conectividade com o backend (via /api/mercadopago/test)"
    );
    try {
      const response = await api.get("/api/mercadopago/test");
      if (response.status === 200 && response.data && response.data.success) {
        console.log("[Frontend Check] Conectividade com backend OK.");
        return true;
      } else {
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
        console.error(
          "[Frontend Check] Status do erro:",
          error.response.status
        );
      } else {
        console.error(
          "[Frontend Check] Erro sem resposta do servidor (pode ser rede/CORS antes da resposta):"
        );
      }
      return false;
    }
  };

  useEffect(() => {
    checkBackendConnectivity().then(setIsConnected);
  }, []);

  const handlePaymentClick = async () => {
    setLoading(true);
    setError(null);
    setQrCodeData(null);

    console.log("Verificando conectividade antes de pagar...");
    const connected = await checkBackendConnectivity();
    setIsConnected(connected);
    if (!connected) {
      const errorMsg =
        "Não foi possível conectar ao servidor de pagamento. Verifique sua conexão.";
      toast.error(errorMsg);
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      setLoading(false);
      return;
    }

    console.log("Conectividade OK. Tentando criar pagamento PIX...");
    try {
      const dadosParaCriar = {
        amount: amount,
        description: description || "Pagamento Agendamento",
        email: dadosAgendamento?.email || "cliente@indefinido.com",
        nome: dadosAgendamento?.nome || "",
        telefone: dadosAgendamento?.telefone || "",
        data: dadosAgendamento?.data || "",
        horario: dadosAgendamento?.horario || "",
        servico: dadosAgendamento?.servico || "",
      };

      console.log("Enviando para criarPagamentoPix:", dadosParaCriar);
      const paymentResponse: NormalizedPayment = await criarPagamentoPix(
        dadosParaCriar
      );
      console.log("Resposta de criarPagamentoPix:", paymentResponse);

      const qrCode = paymentResponse?.qrCode || "";
      const qrCodeBase64 = paymentResponse?.qrCodeBase64 || "";
      const paymentIdReceived = paymentResponse?.id || null;
      const expiresAt = paymentResponse?.expiresAt || "";

      if (paymentIdReceived && qrCode && qrCodeBase64) {
        setPaymentId(paymentIdReceived);
        setQrCodeData({
          qrCode: qrCode,
          qrCodeBase64: qrCodeBase64,
          expiresAt: expiresAt,
        });
        toast.success("QR Code PIX gerado com sucesso! Escaneie para pagar.");
      } else {
        console.error(
          "Resposta do pagamento não contém dados do QR Code ou ID:",
          paymentResponse
        );
        throw new Error(
          "Resposta inválida do Mercado Pago ao criar pagamento (sem QR Code ou ID)."
        );
      }
    } catch (error: any) {
      const errorMessage = String(
        error?.message || "Erro desconhecido ao criar PIX"
      );
      console.error("[handlePaymentClick Catch]", errorMessage);

      toast.error(errorMessage);
      setError(errorMessage);
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigoPix = () => {
    if (qrCodeData?.qrCode) {
      navigator.clipboard
        .writeText(qrCodeData.qrCode)
        .then(() => toast.info("Código PIX copiado!"))
        .catch(() => toast.error("Erro ao copiar código PIX"));
    } else {
      toast.warn("Não há código PIX para copiar.");
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
            onClick={handlePaymentClick}
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
                        qrCodeData.qrCode
                      )}`
                }
                alt="QR Code PIX"
                className="w-64 h-64"
                onError={(e) => {
                  console.error("Erro ao carregar QR Code:", e);
                  e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    qrCodeData.qrCode
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
              {qrCodeData.qrCode}
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
