import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { servicos } from "../data/services";
import api from "../services/api";

// Mover a constante para fora do componente
const TODOS_HORARIOS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

// Interface para os dados de agendamento
interface DadosAgendamento {
  data: string;
  horario: string;
  servico: string;
  cliente: {
    nome: string;
    telefone: string;
  };
}

export default function PaginaAgendamento() {
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [horariosIndisponiveis, setHorariosIndisponiveis] = useState<string[]>(
    []
  );
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [escolhendoPagamento, setEscolhendoPagamento] = useState(false);
  const navegar = useNavigate();

  // Verificar disponibilidade de horários quando a data é alterada
  useEffect(() => {
    if (!dataSelecionada) {
      setHorariosIndisponiveis([]);
      setHorariosDisponiveis(TODOS_HORARIOS);
      return; // Limpa os horários se a data for desmarcada
    }

    async function verificarHorariosOcupados(data: string) {
      setLoading(true);
      try {
        console.log(`Buscando horários ocupados para ${data}...`);
        // FAZ APENAS UMA CHAMADA PARA A API
        const response = await api.get(`/api/disponibilidade?data=${data}`);
        const resultado = response.data;
        const ocupados = resultado.horariosOcupados || [];

        console.log(`Horários ocupados recebidos para ${data}:`, ocupados);
        setHorariosIndisponiveis(ocupados); // Atualiza o estado com os ocupados

        // Calcula disponíveis baseado nos ocupados
        const disponiveis = TODOS_HORARIOS.filter((h) => !ocupados.includes(h));
        setHorariosDisponiveis(disponiveis); // Atualiza o estado de disponíveis
      } catch (error) {
        console.error("Erro ao carregar horários ocupados:", error);
        toast.error("Erro ao carregar horários disponíveis");
        setHorariosIndisponiveis([]); // Limpa em caso de erro
        setHorariosDisponiveis(TODOS_HORARIOS); // Ou mostrar um estado de erro
      } finally {
        setLoading(false);
      }
    }

    verificarHorariosOcupados(dataSelecionada);

    // Configurar um intervalo para atualizar a cada 30 segundos
    // (Opcional, considerar o impacto no backend gratuito)
    // const intervalo = setInterval(() => {
    //   verificarHorariosOcupados(dataSelecionada);
    // }, 30000);
    // return () => clearInterval(intervalo);
  }, [dataSelecionada]); // A dependência agora é só dataSelecionada

  // Validar formulário
  const formularioValido =
    nome.trim() !== "" &&
    telefone.trim() !== "" &&
    dataSelecionada &&
    horarioSelecionado &&
    servicoSelecionado;

  // Função para formatar telefone
  const formatarTelefone = (valor: string) => {
    // Remove tudo exceto números
    const apenasNumeros = valor.replace(/\D/g, "");

    // Formata como (XX) XXXXX-XXXX
    if (apenasNumeros.length <= 11) {
      let formatado = apenasNumeros;
      if (apenasNumeros.length > 2) {
        formatado = `(${apenasNumeros.substring(
          0,
          2
        )}) ${apenasNumeros.substring(2)}`;
      }
      if (apenasNumeros.length > 7) {
        formatado = `(${apenasNumeros.substring(
          0,
          2
        )}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7)}`;
      }
      return formatado;
    }
    return valor;
  };

  // Função para lidar com a mudança no telefone
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setTelefone(formatarTelefone(valor));
  };

  // Função para enviar dados de agendamento diretamente
  const enviarAgendamento = async (dadosAgendamento: DadosAgendamento) => {
    try {
      console.log("Enviando dados de agendamento:", dadosAgendamento);

      // Validar dados antes de enviar
      if (
        !dadosAgendamento.data ||
        !dadosAgendamento.horario ||
        !dadosAgendamento.servico
      ) {
        throw new Error("Dados de agendamento incompletos");
      }

      // Validar cliente
      if (
        !dadosAgendamento.cliente.nome ||
        !dadosAgendamento.cliente.telefone
      ) {
        throw new Error("Dados do cliente incompletos");
      }

      const response = await api.post("/api/agendamentos", dadosAgendamento);
      console.log("Resposta do agendamento:", response.data);

      if (!response.data || !response.data.id) {
        throw new Error("Resposta inválida do servidor");
      }

      return response.data;
    } catch (error: any) {
      console.error("Erro ao salvar agendamento:", error);

      // Mensagem de erro mais específica baseada no tipo de erro
      if (error.response) {
        // Erro de resposta do servidor
        const statusCode = error.response.status;
        const errorMessage =
          error.response.data?.message || "Erro desconhecido";

        if (statusCode === 400) {
          throw new Error(`Dados inválidos: ${errorMessage}`);
        } else if (statusCode === 409) {
          throw new Error(
            "Este horário já está reservado. Por favor, escolha outro."
          );
        } else if (statusCode === 500) {
          throw new Error(
            "Erro no servidor. Por favor, tente novamente mais tarde."
          );
        }
      }

      // Erro genérico se não for específico
      throw new Error(
        "Não foi possível realizar o agendamento. Tente novamente mais tarde."
      );
    }
  };

  // No evento de submissão do formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validações
    if (!nome.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }

    if (!telefone.trim() || telefone.length < 14) {
      toast.error("Por favor, informe um telefone válido");
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

    setLoading(true); // <- Mostra "Verificando..."

    try {
      // Verificação final de disponibilidade ANTES de mostrar opções
      console.log(
        `Verificando disponibilidade final para ${dataSelecionada} às ${horarioSelecionado}...`
      );
      const response = await api.get(
        `/api/disponibilidade?data=${dataSelecionada}&horario=${horarioSelecionado}`
      );
      const horarioAindaDisponivel = response.data.disponivel;

      if (!horarioAindaDisponivel) {
        toast.error(
          "Ops! Este horário foi reservado enquanto você preenchia. Por favor, escolha outro."
        );
        // Atualizar a lista de horários para refletir a mudança
        const atualizarHorarios = async () => {
          const respOcupados = await api.get(
            `/api/disponibilidade?data=${dataSelecionada}`
          );
          const ocupados = respOcupados.data.horariosOcupados || [];
          setHorariosIndisponiveis(ocupados);
          const disponiveis = TODOS_HORARIOS.filter(
            (h) => !ocupados.includes(h)
          );
          setHorariosDisponiveis(disponiveis);
        };
        await atualizarHorarios();
        setHorarioSelecionado(""); // Limpa a seleção de horário inválida
        setLoading(false); // Termina o loading aqui
        return; // Interrompe o fluxo
      }

      // Se chegou aqui, o horário está disponível
      console.log(
        "Horário confirmado como disponível, mostrando opções de pagamento."
      );
      setEscolhendoPagamento(true); // Mostra os botões PIX/Dinheiro
      console.log("DEBUG: Estado escolhendoPagamento definido como true.");
    } catch (error: any) {
      console.error("Erro na verificação final de horário:", error);
      toast.error(
        error.response?.data?.message ||
          "Erro ao verificar disponibilidade. Tente novamente."
      );
      setLoading(false); // Termina o loading em caso de erro na verificação
    }
  };

  // Função para lidar com a escolha de pagamento PIX
  const handlePagarComPix = () => {
    setLoading(true); // Mantém (ou reativa) o loading para o redirecionamento
    console.log("Opção PIX selecionada. Redirecionando...");
    navegar(
      `/payment?date=${dataSelecionada}&hour=${horarioSelecionado}&service=${encodeURIComponent(
        servicoSelecionado
      )}&name=${encodeURIComponent(nome)}&phone=${encodeURIComponent(telefone)}`
    );
    // setLoading(false); // Não precisa desativar aqui, a página vai mudar
  };

  // Função para lidar com a escolha de pagamento presencial
  const handlePagarPresencialmente = async () => {
    setLoading(true);
    console.log("Opção Pagar Presencialmente selecionada.");

    // Buscar o preço do serviço selecionado
    const servicoInfo = servicos.find((s) => s.nome === servicoSelecionado);
    const precoDoServico = servicoInfo?.preco || 0;

    if (!servicoInfo) {
      toast.error(
        "Serviço selecionado não encontrado. Por favor, selecione novamente."
      );
      setLoading(false);
      setEscolhendoPagamento(false);
      return;
    }

    try {
      // Preparar dados do agendamento, incluindo o preço
      const dadosAgendamento = {
        data: dataSelecionada,
        horario: horarioSelecionado,
        servico: servicoSelecionado,
        preco: precoDoServico, // Adicionar o preço aqui
        cliente: {
          nome: nome,
          telefone: telefone,
        },
        // Status inicial para pagamento presencial
        status: "aguardando pagamento",
        metodoPagamento: "dinheiro", // Adicionar informação do método
      };

      // Chamar o novo endpoint no backend (será criado depois)
      const response = await api.post(
        "/api/agendamentos/criar-pendente",
        dadosAgendamento
      );

      if (response.status === 201 && response.data && response.data.id) {
        console.log("Agendamento pendente criado:", response.data);
        toast.success("Agendamento realizado! Pague no dia do serviço.");
        // Redirecionar para confirmação, indicando pagamento pendente
        navegar(
          `/confirm?hour=${horarioSelecionado}&service=${encodeURIComponent(
            servicoSelecionado
          )}&name=${encodeURIComponent(nome)}&status=pending`
        );
      } else {
        // Tratar erro específico da resposta da API, se houver
        const errorMsg =
          response.data?.message || "Falha ao criar agendamento pendente.";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Erro ao criar agendamento pendente:", error);
      toast.error(
        error.message || "Erro ao criar agendamento. Tente novamente."
      );
      setEscolhendoPagamento(false); // Voltar para o formulário se der erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8 text-center">
        Agende seu Horário
      </h1>

      {/* REMOVER TEMPORARIAMENTE a condição e o formulário */}
      {/* {!escolhendoPagamento ? (
         <form onSubmit={handleSubmit} className="space-y-8"> ... </form>
      ) : ( */}

      {/* MOSTRAR SEMPRE A SEÇÃO DE ESCOLHA DE PAGAMENTO (PARA TESTE) */}
      <div className="bg-white rounded-lg shadow-lg p-6 text-center animate-fade-in">
        {/* ... conteúdo da seção de escolha de pagamento ... */}
      </div>
      {/* )} */}
    </div>
  );
}
