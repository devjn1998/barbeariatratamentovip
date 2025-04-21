import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api"; // Ajuste o caminho se necessário
import { servicos, Service } from "../data/services"; // Ajuste o caminho se necessário

// Interface para os dados do PIX retornados pela API
interface PixData {
  id: number | string; // ID do pagamento Mercado Pago
  qrCodeBase64: string;
  qrCode: string; // Chave Copia e Cola
}

// Interface para o status do pagamento retornado pela API
interface PaymentStatus {
  success: boolean;
  status?: string; // 'approved', 'pending', 'rejected', etc.
  approved?: boolean;
  message?: string;
  // Adicione outros campos se necessário
}

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Estados para dados do agendamento (vindos da URL)
  const [dataAgendamento, setDataAgendamento] = useState<string | null>(null);
  const [horarioAgendamento, setHorarioAgendamento] = useState<string | null>(
    null
  );
  const [servicoNome, setServicoNome] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState<string | null>(null);
  const [telefoneCliente, setTelefoneCliente] = useState<string | null>(null);
  const [precoServico, setPrecoServico] = useState<number>(0);

  // Estados para o processo de pagamento
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading inicial para buscar PIX
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null); // 'pending', 'approved', 'rejected', etc.
  const [isPolling, setIsPolling] = useState(false); // Controla se o polling está ativo
  const [pollingIntervalId, setPollingIntervalId] =
    useState<NodeJS.Timeout | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Número do WhatsApp do Barbeiro (substitua pelo número real)
  const WHATSAPP_NUMBER =
    process.env.REACT_APP_WHATSAPP_NUMBER || "5522992535077"; // Exemplo

  // Função para buscar o serviço e preço
  const findServicePrice = useCallback((serviceName: string | null): number => {
    if (!serviceName) return 0;
    const service = servicos.find((s: Service) => s.nome === serviceName);
    return service?.preco || 0;
  }, []); // Dependência vazia, pois 'servicos' é constante

  // Efeito para extrair dados da URL e buscar o preço
  useEffect(() => {
    const date = searchParams.get("date");
    const hour = searchParams.get("hour");
    const service = searchParams.get("service");
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");

    if (!date || !hour || !service || !name || !phone) {
      toast.error("Dados do agendamento incompletos. Voltando...");
      navigate("/book"); // Volta para a página de agendamento
      return;
    }

    setDataAgendamento(date);
    setHorarioAgendamento(hour);
    setServicoNome(service);
    setNomeCliente(name);
    setTelefoneCliente(phone);
    setPrecoServico(findServicePrice(service));
  }, [searchParams, navigate, findServicePrice]);

  // Função para criar o pagamento PIX no backend
  const createPixPayment = useCallback(async () => {
    if (
      !dataAgendamento ||
      !horarioAgendamento ||
      !servicoNome ||
      !nomeCliente ||
      !telefoneCliente ||
      precoServico <= 0
    ) {
      console.error("Dados incompletos para criar PIX");
      setErrorMessage(
        "Não foi possível iniciar o pagamento. Dados incompletos."
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log("Criando pagamento PIX com os dados:", {
        transaction_amount: precoServico,
        description: `Agendamento: ${servicoNome} - ${dataAgendamento} ${horarioAgendamento}`,
        email: "cliente@example.com", // Usar um email padrão ou obter do cliente se disponível
        nome: nomeCliente,
        telefone: telefoneCliente,
        // Passar dados originais para referência no backend, se necessário
        original_data: {
          data: dataAgendamento,
          horario: horarioAgendamento,
          servico: servicoNome,
          nome: nomeCliente,
          telefone: telefoneCliente,
        },
      });

      const response = await api.post("/api/pagamentos", {
        // Enviar os dados esperados pela API /api/pagamentos
        transaction_amount: precoServico,
        description: `Agendamento: ${servicoNome} - ${dataAgendamento} ${horarioAgendamento}`,
        email: "cliente@example.com", // Ou um email real se tiver
        nome: nomeCliente,
        telefone: telefoneCliente,
        // Incluir outros campos se a API /api/pagamentos esperar
        data: dataAgendamento,
        horario: horarioAgendamento,
        servico: servicoNome,
      });

      // --- ADICIONAR ESTE LOG ---
      console.log("--- INSPECIONANDO RESPONSE ANTES DO IF ---");
      console.log("Response Status:", response?.status);
      console.log("Response Data:", response?.data);
      // Logar especificamente a parte que está falhando na condição
      try {
        console.log(
          "Response Data PIX Interaction:",
          response?.data?.point_of_interaction
        );
        console.log(
          "Response Data PIX Transaction Data:",
          response?.data?.point_of_interaction?.transaction_data
        );
      } catch (e) {
        console.error("Erro ao logar dados aninhados do PIX");
      }
      console.log("--- FIM INSPEÇÃO RESPONSE ---");
      // --- FIM DO LOG ADICIONADO ---

      if (
        response.status === 201 &&
        response.data?.point_of_interaction?.transaction_data
      ) {
        console.log("QR Code recebido:", response.data);
        setPixData(response.data.point_of_interaction.transaction_data);
        setPaymentStatus("pending"); // Define o status inicial como pendente
        setIsPolling(true); // Inicia o polling após receber os dados do PIX
        console.log(
          "Dados do PIX recebidos:",
          response.data.point_of_interaction.transaction_data
        );
      } else {
        console.error(
          "Resposta inesperada do servidor (após inspeção):",
          response
        ); // Log adicional aqui
        throw new Error(
          response.data?.message || "Formato de resposta inválido ao gerar PIX."
        );
      }
    } catch (error: any) {
      console.error("--- DETALHES DO ERRO NO CATCH ---");
      console.error("Timestamp:", new Date().toISOString());
      console.error("Objeto error completo:", error);
      // Tentar logar propriedades específicas com segurança
      try {
        console.error("error.message:", error?.message);
        console.error("error.response:", error?.response);
        console.error("error.response?.status:", error?.response?.status);
        console.error("error.response?.data:", error?.response?.data);
        console.error("error.request:", error?.request);
        console.error("error.config:", error?.config); // Configuração da requisição Axios
        console.error("error.stack:", error?.stack); // Stack trace, se disponível
      } catch (logError) {
        console.error("Erro ao tentar logar propriedades do erro:", logError);
      }
      console.error("--- FIM DETALHES DO ERRO ---");

      let errorMessage =
        "Não foi possível gerar o QR Code PIX. Tente novamente.";

      if (error.response) {
        // Erro vindo do backend (status 4xx ou 5xx)
        errorMessage =
          error.response.data?.message || // Tenta pegar a mensagem específica
          error.response.data?.error ||
          errorMessage; // Usa a padrão se não encontrar
        // Não precisa logar de novo aqui, já fizemos acima
      } else if (error.request) {
        // A requisição foi feita mas não houve resposta
        errorMessage = "Sem resposta do servidor. Verifique sua conexão.";
      } else {
        // Erro ao configurar a requisição ou outro erro JS
        // Usar a mensagem do objeto Error, se existir
        errorMessage = error.message || errorMessage;
      }

      setErrorMessage(errorMessage); // Atualiza o estado de erro
      toast.error(errorMessage); // Exibe a mensagem de erro para o usuário
    } finally {
      setIsLoading(false); // Garante que o loading seja desativado
    }
  }, [
    dataAgendamento,
    horarioAgendamento,
    servicoNome,
    nomeCliente,
    telefoneCliente,
    precoServico,
  ]);

  // Efeito para chamar a criação do PIX quando os dados estiverem prontos
  useEffect(() => {
    // Só executa se todos os dados da URL foram carregados e o preço calculado
    if (
      dataAgendamento &&
      horarioAgendamento &&
      servicoNome &&
      nomeCliente &&
      telefoneCliente &&
      precoServico > 0
    ) {
      createPixPayment();
    }
  }, [
    dataAgendamento,
    horarioAgendamento,
    servicoNome,
    nomeCliente,
    telefoneCliente,
    precoServico,
    createPixPayment,
  ]);

  // Função para verificar o status do pagamento (usada no polling)
  const checkPaymentStatus = useCallback(async () => {
    if (!pixData?.id) return; // Não faz nada se não tiver ID

    console.log(`Polling: Verificando status do pagamento ${pixData.id}...`);
    try {
      const response = await api.get<PaymentStatus>(
        `/api/pagamentos/${pixData.id}/status`
      );
      const currentStatus = response.data.status;
      console.log(`Polling: Status recebido: ${currentStatus}`);

      if (response.data.success && currentStatus) {
        setPaymentStatus(currentStatus); // Atualiza o estado local

        // Se aprovado, para o polling e mostra sucesso
        if (currentStatus === "approved") {
          console.log("Pagamento APROVADO! Parando polling.");
          toast.success("Pagamento confirmado!");
          setIsPolling(false); // Para o polling
        }
        // Se falhar ou cancelar, para o polling e mostra erro
        else if (
          currentStatus === "rejected" ||
          currentStatus === "cancelled" ||
          currentStatus === "error"
        ) {
          console.log(`Pagamento ${currentStatus}. Parando polling.`);
          setErrorMessage(
            `O pagamento foi ${currentStatus}. Por favor, tente novamente ou contate o suporte.`
          );
          setIsPolling(false); // Para o polling
        }
        // Se ainda pendente, continua... (não faz nada aqui, o intervalo continua)
      } else {
        // Se a API retornar success: false ou status indefinido, continua tentando por um tempo
        console.warn(
          "Polling: Resposta da API de status não foi conclusiva.",
          response.data
        );
      }
    } catch (error: any) {
      console.error("Polling: Erro ao verificar status do pagamento:", error);
      // Poderia parar o polling após muitos erros, mas por enquanto continua
    }
  }, [pixData?.id]); // Depende do ID do PIX

  // Efeito para controlar o polling (iniciar/parar intervalo)
  useEffect(() => {
    if (isPolling && pixData?.id) {
      // Inicia o intervalo para verificar a cada 5 segundos
      const intervalId = setInterval(checkPaymentStatus, 5000);
      setPollingIntervalId(intervalId);
      console.log(
        `Polling iniciado para pagamento ${pixData.id}. Interval ID: ${intervalId}`
      );

      // Função de limpeza para parar o intervalo
      return () => {
        console.log(`Limpando intervalo de polling ${intervalId}`);
        clearInterval(intervalId);
        setPollingIntervalId(null);
      };
    } else if (!isPolling && pollingIntervalId) {
      // Garante que o intervalo seja limpo se isPolling for setado para false
      console.log(
        `Parando polling manualmente. Limpando intervalo ${pollingIntervalId}`
      );
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  }, [isPolling, pixData?.id, checkPaymentStatus]); // Dependências do efeito

  // Função para copiar a chave PIX
  const handleCopyPixKey = () => {
    if (pixData?.qrCode) {
      navigator.clipboard
        .writeText(pixData.qrCode)
        .then(() => toast.success("Chave PIX copiada!"))
        .catch((err) => toast.error("Erro ao copiar chave PIX."));
    }
  };

  // Função para redirecionar para o WhatsApp
  const handleWhatsAppRedirect = () => {
    if (!nomeCliente || !servicoNome || !dataAgendamento || !horarioAgendamento)
      return;

    const message = encodeURIComponent(
      `Olá! Confirmei meu agendamento:\n` +
        `Nome: ${nomeCliente}\n` +
        `Serviço: ${servicoNome}\n` +
        `Data: ${new Date(dataAgendamento + "T00:00:00").toLocaleDateString(
          "pt-BR",
          { timeZone: "UTC" }
        )}\n` +
        `Horário: ${horarioAgendamento}\n` +
        `Status: Pagamento PIX Confirmado`
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank"); // Abre em nova aba
  };

  // --- Renderização ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">
            Gerando informações de pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-md mx-auto text-center py-10 px-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Erro no Pagamento
        </h2>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
        <button
          onClick={() => navigate("/book")}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Voltar ao Agendamento
        </button>
      </div>
    );
  }

  // Se o pagamento foi aprovado, mostra a confirmação
  if (paymentStatus === "approved") {
    return (
      <div className="max-w-md mx-auto text-center py-10 px-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-green-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Pagamento Confirmado!
        </h2>
        <p className="text-gray-700 mb-2">Seu agendamento está confirmado:</p>
        <div className="text-left bg-gray-100 p-4 rounded-lg mb-6 inline-block">
          <p>
            <strong>Serviço:</strong> {servicoNome}
          </p>
          <p>
            <strong>Data:</strong>{" "}
            {dataAgendamento
              ? new Date(dataAgendamento + "T00:00:00").toLocaleDateString(
                  "pt-BR",
                  { timeZone: "UTC" }
                )
              : "N/A"}
          </p>
          <p>
            <strong>Horário:</strong> {horarioAgendamento}
          </p>
          <p>
            <strong>Nome:</strong> {nomeCliente}
          </p>
        </div>
        <p className="text-gray-600 mb-6">
          Clique no botão abaixo para nos enviar uma mensagem no WhatsApp e
          finalizar.
        </p>
        <button
          onClick={handleWhatsAppRedirect}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
          </svg>
          Confirmar no WhatsApp
        </button>
      </div>
    );
  }

  // Se ainda não foi aprovado e temos dados do PIX, mostra o QR Code/Chave
  if (pixData) {
    return (
      <div className="max-w-md mx-auto text-center py-10 px-4">
        <h2 className="text-2xl font-bold mb-4">Pague com PIX</h2>
        <p className="text-gray-600 mb-6">
          Escaneie o QR Code abaixo com o app do seu banco ou copie a chave PIX.
        </p>

        {/* QR Code */}
        <div className="mb-6 bg-white p-4 inline-block shadow-lg rounded-lg">
          <img
            src={`data:image/png;base64,${pixData.qrCodeBase64}`}
            alt="PIX QR Code"
            className="w-64 h-64 mx-auto"
          />
        </div>

        {/* Chave PIX Copia e Cola */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ou copie a chave PIX:
          </label>
          <div className="flex items-center justify-center border rounded-lg p-2 bg-gray-50">
            <input
              type="text"
              readOnly
              value={pixData.qrCode}
              className="flex-grow bg-transparent outline-none text-sm text-gray-700 mr-2"
            />
            <button
              onClick={handleCopyPixKey}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-1 px-3 rounded transition-colors"
              title="Copiar Chave PIX"
            >
              Copiar
            </button>
          </div>
        </div>

        {/* Indicador de Status */}
        <div className="mt-8">
          {isPolling && paymentStatus === "pending" && (
            <div className="flex justify-center items-center text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
              Aguardando confirmação do pagamento...
            </div>
          )}
          {paymentStatus &&
            paymentStatus !== "pending" &&
            paymentStatus !== "approved" && (
              <p className="text-red-600 font-semibold">
                Status do Pagamento: {paymentStatus}
              </p>
            )}
        </div>

        <button
          onClick={() => navigate("/book")} // Permite voltar se desistir
          className="w-full text-gray-600 hover:text-black py-2 mt-8"
        >
          Cancelar e voltar
        </button>
      </div>
    );
  }

  // Estado padrão se algo der errado antes de carregar o PIX (já tratado acima, mas como fallback)
  return (
    <div className="max-w-md mx-auto text-center py-10 px-4">
      <p className="text-gray-700">Carregando informações de pagamento...</p>
    </div>
  );
}
