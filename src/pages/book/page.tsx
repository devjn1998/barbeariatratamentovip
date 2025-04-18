import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { servicos, Service } from "../../data/services";
import api from "../../services/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/pt-br";

dayjs.extend(utc);
dayjs.locale("pt-br");

// Horários de funcionamento padrão
const TODOS_HORARIOS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

// Interface para os dados de agendamento (ajustada)
interface DadosAgendamento {
  data: string;
  horario: string;
  servico: string;
  preco?: number; // Adicionado para envio
  cliente: {
    nome: string;
    telefone: string;
    email?: string; // Opcional
  };
  status?: string; // Adicionado para envio
  metodoPagamento?: string; // Adicionado para envio
}

export default function PaginaAgendamento() {
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [horariosIndisponiveis, setHorariosIndisponiveis] = useState<string[]>(
    []
  );
  const [horariosDisponiveis, setHorariosDisponiveis] =
    useState<string[]>(TODOS_HORARIOS); // Inicia com todos
  const [escolhendoPagamento, setEscolhendoPagamento] = useState(false);
  const [email, setEmail] = useState("");
  const navegar = useNavigate();

  // --- REATIVADO: buscarHorariosOcupados que usa a API ---
  const buscarHorariosOcupados = useCallback(async (data: string) => {
    setLoadingHorarios(true);
    setHorariosIndisponiveis([]); // Limpa antes de buscar
    try {
      console.log(`[API] Buscando horários ocupados para ${data}...`);
      // Chama o endpoint do backend
      const response = await api.get(`/api/disponibilidade?data=${data}`);
      const ocupados = response.data.horariosOcupados || [];
      console.log(`[API] Horários ocupados recebidos para ${data}:`, ocupados);
      setHorariosIndisponiveis(ocupados);
    } catch (error: any) {
      console.error("[API] Erro ao buscar disponibilidade:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Erro ao buscar horários.";
      toast.error(`Erro ao buscar horários: ${errorMsg}`);
      setHorariosIndisponiveis([]); // Limpa em caso de erro
    } finally {
      setLoadingHorarios(false);
    }
  }, []); // useCallback sem dependências extras

  // Efeito para buscar horários via API quando a data muda
  useEffect(() => {
    if (dataSelecionada) {
      // Validação simples da data antes de chamar a API
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dataSelecionada) ||
        !dayjs(dataSelecionada).isValid()
      ) {
        console.error("Formato de data inválido para API:", dataSelecionada);
        setHorariosIndisponiveis([]);
        return;
      }
      buscarHorariosOcupados(dataSelecionada); // Chama a função que usa a API
    } else {
      // Limpa os horários se a data for desmarcada
      setHorariosIndisponiveis([]);
    }
  }, [dataSelecionada, buscarHorariosOcupados]); // Adiciona buscarHorariosOcupados como dependência

  // Calcular horários disponíveis sempre que os indisponíveis mudarem
  useEffect(() => {
    const disponiveis = TODOS_HORARIOS.filter(
      (h) => !horariosIndisponiveis.includes(h)
    );
    setHorariosDisponiveis(disponiveis);
    // Se o horário que estava selecionado ficou indisponível, limpa a seleção
    if (horarioSelecionado && !disponiveis.includes(horarioSelecionado)) {
      console.log(
        `Horário selecionado ${horarioSelecionado} tornou-se indisponível. Limpando seleção.`
      );
      setHorarioSelecionado("");
    }
  }, [horariosIndisponiveis]);

  // Validar formulário
  const formularioValido =
    nome.trim() !== "" &&
    telefone.trim().length >= 14 && // Verifica um tamanho mínimo razoável
    dataSelecionada &&
    horarioSelecionado &&
    servicoSelecionado &&
    !loadingHorarios && // Garante que a busca inicial terminou
    !processingPayment;

  // Função para formatar telefone
  const formatarTelefone = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    let formatado = apenasNumeros;
    if (apenasNumeros.length > 0) {
      formatado = `(${apenasNumeros.substring(0, 2)}`;
    }
    if (apenasNumeros.length > 2) {
      formatado = `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(
        2,
        7
      )}`;
    }
    if (apenasNumeros.length > 7) {
      formatado = `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(
        2,
        7
      )}-${apenasNumeros.substring(7, 11)}`;
    }
    // Limita ao tamanho máximo formatado
    return formatado.substring(0, 15);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatarTelefone(e.target.value));
  };

  // Função de submissão do formulário
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validações básicas
    if (!nome.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }
    if (!telefone.trim() || telefone.length < 14) {
      toast.error("Por favor, informe um telefone válido (XX) XXXXX-XXXX");
      return;
    }
    if (!dataSelecionada) {
      toast.error("Por favor, selecione uma data");
      return;
    }
    if (!horarioSelecionado) {
      toast.error("Por favor, selecione um horário");
      return;
    }
    if (!servicoSelecionado) {
      toast.error("Por favor, selecione um serviço");
      return;
    }

    // A verificação se o horário está disponível é feita implicitamente
    // pelo estado `horariosDisponiveis` e pelo `useEffect` que limpa
    // `horarioSelecionado` se ele ficar indisponível.
    // O botão do horário já estará desabilitado se não estiver em `horariosDisponiveis`.
    // Podemos adicionar uma checagem extra por segurança, mas não deveria ser necessária.
    if (!horariosDisponiveis.includes(horarioSelecionado)) {
      toast.error(
        "O horário selecionado não está disponível. Por favor, escolha outro."
      );
      // O estado horarioSelecionado já deve ter sido limpo pelo useEffect,
      // mas podemos garantir aqui se necessário:
      // setHorarioSelecionado("");
      return;
    }

    console.log("Horário selecionado é válido, mostrando opções de pagamento.");
    setEscolhendoPagamento(true);
  };

  // Função para lidar com a escolha de pagamento PIX
  const handlePagarComPix = () => {
    setProcessingPayment(true);
    console.log("Opção PIX selecionada. Redirecionando...");
    const params = new URLSearchParams({
      date: dataSelecionada,
      hour: horarioSelecionado,
      service: servicoSelecionado,
      name: nome,
      phone: telefone,
    });
    navegar(`/payment?${params.toString()}`);
    // O estado processingPayment será resetado se o usuário voltar ou a navegação falhar
    // Considere resetar em um useEffect de limpeza ou ao carregar a página
    // setProcessingPayment(false); // Não resetar aqui, pois a navegação ocorre
  };

  // Função para lidar com a escolha de pagamento presencial
  const handlePagarPresencialmente = async () => {
    setProcessingPayment(true);
    console.log("Opção Pagar Presencialmente selecionada.");

    // Adicionado tipo 'any' temporariamente, idealmente importar a interface Servico
    const servicoInfo = servicos.find(
      (s: Service) => s.nome === servicoSelecionado
    );
    const precoDoServico = servicoInfo?.preco || 0;

    if (!servicoInfo) {
      toast.error(
        "Serviço selecionado não encontrado. Por favor, selecione novamente."
      );
      setProcessingPayment(false);
      setEscolhendoPagamento(false);
      return;
    }

    try {
      // Formatado com os nomes em português que o backend espera
      const dadosAgendamento = {
        data: dataSelecionada,
        horario: horarioSelecionado,
        servico: servicoSelecionado,
        preco: precoDoServico,
        cliente: {
          nome: nome,
          telefone: telefone,
          email: email || undefined,
        },
        metodoPagamento: "dinheiro",
        status: "aguardando pagamento",
      };

      console.log("Enviando dados para criação:", dadosAgendamento);

      // Usar axios para a chamada API (assumindo que 'api' é sua instância do axios)
      const response = await api.post(
        "/api/agendamentos/criar-pendente",
        dadosAgendamento
      );
      console.log("Resposta da API:", response.data);

      if (response.data && response.data.id) {
        console.log("Agendamento pendente criado via API:", response.data);
        toast.success("Agendamento realizado! Pague no dia do serviço.");

        // Navegar para página de confirmação
        const params = new URLSearchParams({
          service: servicoSelecionado,
          date: dataSelecionada,
          time: horarioSelecionado,
          name: nome,
          status: "pending",
          id: response.data.id,
        });

        navegar(`/confirm?${params.toString()}`);
      } else {
        const errorMsg =
          response.data?.message || "Falha ao criar agendamento pendente.";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Erro ao criar agendamento pendente via API:", error);
      toast.error(
        "Não foi possível criar seu agendamento. Por favor, tente novamente."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Modificando apenas a parte da função que cria o agendamento pendente
  const handleAgendamentoPendente = async () => {
    if (!validarDadosAgendamento()) {
      return;
    }

    setProcessingPayment(true);

    try {
      // Formatado com os nomes em português que o backend espera
      const dadosAgendamento = {
        data: dataSelecionada,
        horario: horarioSelecionado,
        servico: servicoSelecionado,
        preco: precoDoServico,
        cliente: {
          nome: nome,
          telefone: telefone,
        },
      };

      console.log("Enviando dados para criação:", dadosAgendamento);
      const response = await api.post(
        "/api/agendamentos/criar-pendente",
        dadosAgendamento
      );

      if (response.data && response.data.id) {
        console.log("Agendamento pendente criado via API:", response.data);
        toast.success("Agendamento realizado! Pague no dia do serviço.");

        const params = new URLSearchParams({
          service: servicoSelecionado,
          date: dataSelecionada,
          time: horarioSelecionado,
          name: nome,
          status: "pending",
          id: response.data.id,
        });

        navegar(`/confirm?${params.toString()}`);
      } else {
        throw new Error(
          "Falha ao criar agendamento pendente. Resposta inesperada da API."
        );
      }
    } catch (error) {
      console.error("Erro ao criar agendamento pendente via API:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast.error(`Não foi possível criar seu agendamento: ${errorMsg}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  // 1. Adicionar a função de validação que está faltando
  const validarDadosAgendamento = () => {
    // Validar campos obrigatórios
    if (!dataSelecionada) {
      toast.error("Por favor, selecione uma data para o agendamento");
      return false;
    }

    if (!horarioSelecionado) {
      toast.error("Por favor, selecione um horário para o agendamento");
      return false;
    }

    if (!servicoSelecionado) {
      toast.error("Por favor, selecione um serviço");
      return false;
    }

    if (!nome || nome.trim() === "") {
      toast.error("Por favor, informe seu nome");
      return false;
    }

    if (!telefone || telefone.trim() === "") {
      toast.error("Por favor, informe seu telefone para contato");
      return false;
    }

    return true;
  };

  // 2. Definir a variável precoDoServico que está faltando
  // Esta variável deve ser definida com base no serviço selecionado
  // Por exemplo:

  const getPrecoServico = (servico: string): number => {
    // Mapeamento de serviços para preços
    const precos: Record<string, number> = {
      "Corte Disfarçado com Máquina": 30,
      "Corte Disfarçado com Tesoura": 35,
      "Combo Cabelo+Barba": 40,
      "Combo Cabelo+Barba+Sobrancelha": 50,
      "Combo Cabelo+Barba+Pintura+Sobrancelha": 65,
      // Adicione outros serviços conforme necessário
    };

    return precos[servico] || 0; // Retorna o preço ou 0 se não encontrado
  };

  // Usar a função para definir o preço do serviço selecionado
  const precoDoServico = getPrecoServico(servicoSelecionado);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8 text-center">
        Agende seu Horário
      </h1>

      {!escolhendoPagamento ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Seus Dados</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome Completo
                </label>
                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Digite seu nome completo"
                  required
                  disabled={processingPayment} // Desabilitar durante processamento final
                />
              </div>
              <div>
                <label
                  htmlFor="telefone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Telefone
                </label>
                <input
                  id="telefone"
                  type="tel"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  className="w-full p-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="(XX) XXXXX-XXXX"
                  required
                  maxLength={15}
                  disabled={processingPayment}
                />
              </div>
            </div>
          </div>

          {/* Seção Data e Horário */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Data e Horário</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="data"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Data
                </label>
                <input
                  id="data"
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => {
                    setDataSelecionada(e.target.value);
                    setHorarioSelecionado(""); // Limpa horário ao mudar data
                  }}
                  min={new Date().toISOString().split("T")[0]} // Não permite datas passadas
                  className="w-full p-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  required
                  disabled={processingPayment}
                />
              </div>

              {/* Indicador de Loading para horários */}
              {dataSelecionada && loadingHorarios && (
                <div className="flex justify-center items-center py-4 text-gray-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 mr-2"></div>
                  Carregando horários...
                </div>
              )}

              {/* Grid de Horários - MODIFICADO */}
              {dataSelecionada && !loadingHorarios && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {/* Mapeia TODOS os horários padrão */}
                  {TODOS_HORARIOS.map((horario) => {
                    // Verifica se o horário está na lista de indisponíveis
                    const isUnavailable =
                      horariosIndisponiveis.includes(horario);
                    // Verifica se é o horário selecionado atualmente
                    const isSelected = horarioSelecionado === horario;

                    return (
                      <button
                        type="button"
                        key={horario}
                        className={`
                          p-3 rounded-lg transition-all text-center border
                          ${
                            isUnavailable
                              ? "line-through text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed" // Estilo para indisponível
                              : isSelected
                              ? "bg-amber-500 text-white font-semibold ring-2 ring-amber-600 ring-offset-1 border-amber-500" // Estilo para selecionado
                              : "bg-white hover:bg-gray-100 text-gray-800 border-gray-300" // Estilo padrão para disponível
                          }
                        `}
                        // Desabilita se estiver indisponível OU se um pagamento estiver em processamento
                        disabled={isUnavailable || processingPayment}
                        // Só atualiza o estado se o horário não estiver indisponível
                        onClick={() =>
                          !isUnavailable && setHorarioSelecionado(horario)
                        }
                      >
                        {horario}
                      </button>
                    );
                  })}
                  {/* Mensagem se TODOS os horários estiverem ocupados */}
                  {horariosDisponiveis.length === 0 &&
                    horariosIndisponiveis.length > 0 && (
                      <p className="col-span-3 text-center text-red-500 mt-2">
                        Todos os horários para esta data estão ocupados.
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Seção Escolha o Serviço */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Escolha o Serviço</h2>
            <div className="space-y-3">
              {/* Adicionado tipo explícito para 'servico' */}
              {servicos.map((servico: Service) => (
                <button
                  type="button"
                  key={servico.nome}
                  disabled={processingPayment}
                  className={`w-full p-4 rounded-lg transition-all flex justify-between items-center text-left ${
                    servicoSelecionado === servico.nome
                      ? "bg-amber-500 text-white font-semibold ring-2 ring-amber-600 ring-offset-1"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50"
                  }`}
                  onClick={() => setServicoSelecionado(servico.nome)}
                >
                  <span>{servico.nome}</span>
                  <span className="font-medium">
                    R$ {servico.preco.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Submissão */}
          <button
            type="submit"
            className={`w-full py-4 rounded-lg text-white text-lg font-bold transition-all flex justify-center items-center ${
              !formularioValido
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
            disabled={!formularioValido} // Apenas a validação do formulário controla aqui
          >
            {/* Não mostra mais loading aqui, pois a verificação é local */}
            Escolher Pagamento
          </button>
        </form>
      ) : (
        // Seção Escolha de Pagamento (mantida como estava, mas ajustada para desabilitar botões)
        <div className="bg-white rounded-lg shadow-lg p-6 text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">Como deseja pagar?</h2>
          <p className="mb-6 text-gray-600">
            Você selecionou: {servicoSelecionado} em{" "}
            {/* Adicionado T00:00:00 para evitar problemas de fuso ao formatar data */}
            {new Date(dataSelecionada + "T00:00:00").toLocaleDateString(
              "pt-BR",
              { timeZone: "UTC" }
            )}{" "}
            às {horarioSelecionado}.
          </p>
          <div className="space-y-4">
            <button
              onClick={handlePagarComPix}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-6 rounded-lg transition-colors text-lg font-semibold flex items-center justify-center disabled:opacity-70"
              disabled={processingPayment} // Desabilita durante o processamento
            >
              {processingPayment ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                // Ícone PIX (exemplo)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              )}
              Pagar com PIX Agora
            </button>
            <button
              onClick={handlePagarPresencialmente}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors text-lg font-semibold flex items-center justify-center disabled:opacity-70"
              disabled={processingPayment} // Desabilita durante o processamento
            >
              {processingPayment ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                // Ícone Dinheiro (exemplo)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              )}
              Pagar Presencialmente (Dinheiro)
            </button>
            <button
              onClick={() => setEscolhendoPagamento(false)} // Volta para o formulário
              className="w-full text-gray-600 hover:text-black py-2 mt-4 disabled:opacity-50"
              disabled={processingPayment} // Desabilita durante o processamento
            >
              Voltar e alterar dados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
