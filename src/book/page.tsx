import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  verificarDisponibilidade,
  verificarHorarioDisponivel,
} from "../data/appointments";
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
  const navegar = useNavigate();

  // Verificar disponibilidade de horários quando a data é alterada
  useEffect(() => {
    if (!dataSelecionada) return;

    async function verificarHorarios() {
      setLoading(true);
      try {
        const indisponiveis: string[] = [];

        // Usar a constante global TODOS_HORARIOS
        for (const horario of TODOS_HORARIOS) {
          const disponivel = await verificarDisponibilidade(
            dataSelecionada,
            horario
          );
          if (!disponivel) {
            indisponiveis.push(horario);
          }
        }

        setHorariosIndisponiveis(indisponiveis);

        // Atualizar lista de horários disponíveis
        setHorariosDisponiveis(
          TODOS_HORARIOS.filter((horario) => !indisponiveis.includes(horario))
        );
      } catch (error) {
        console.error("Erro ao verificar horários:", error);
        toast.error("Erro ao verificar horários disponíveis");
      } finally {
        setLoading(false);
      }
    }

    verificarHorarios();
  }, [dataSelecionada]);

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

    setLoading(true);

    try {
      // 1. Verificar novamente a disponibilidade do horário
      const horarioDisponivel = await verificarHorarioDisponivel(
        dataSelecionada,
        horarioSelecionado
      );
      if (!horarioDisponivel) {
        toast.error("Este horário já foi reservado. Por favor, escolha outro.");
        setLoading(false);
        // Recarregar horários disponíveis
        await carregarHorariosDisponiveis();
        return;
      }

      // 2. NÃO salvamos o agendamento ainda - apenas redirecionamos para pagamento
      // O agendamento será criado apenas após o pagamento ser confirmado
      console.log("Horário disponível! Redirecionando para pagamento...");

      // 3. Redirecionar para a página de pagamento com os dados do agendamento
      navegar(
        `/payment?date=${dataSelecionada}&hour=${horarioSelecionado}&service=${encodeURIComponent(
          servicoSelecionado
        )}&name=${encodeURIComponent(nome)}&phone=${encodeURIComponent(
          telefone
        )}`
      );
    } catch (error: any) {
      console.error("Erro no processo de agendamento:", error);
      toast.error(
        error.message || "Erro ao processar agendamento. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataSelecionada) {
      // Carregar horários inicialmente
      carregarHorariosDisponiveis();

      // Configurar um intervalo para atualizar a cada 30 segundos
      const intervalo = setInterval(() => {
        carregarHorariosDisponiveis();
      }, 30000);

      return () => clearInterval(intervalo);
    }
  }, [dataSelecionada]);

  // Função para carregar horários disponíveis
  const carregarHorariosDisponiveis = async () => {
    setLoading(true);
    try {
      // Obter horários ocupados com parâmetro anti-cache
      const timestamp = new Date().getTime();

      // Usar a API para obter os horários ocupados
      const response = await fetch(
        `/api/disponibilidade?data=${dataSelecionada}&_t=${timestamp}`
      );
      const data = await response.json();
      const ocupados = data.horariosOcupados || [];

      setHorariosIndisponiveis(ocupados);

      // Filtrar horários disponíveis
      const disponiveis = TODOS_HORARIOS.filter(
        (horario) => !ocupados.includes(horario)
      );

      // Verificar se existe o estado para armazenar horários disponíveis
      if (typeof setHorariosDisponiveis === "function") {
        setHorariosDisponiveis(disponiveis);
      } else {
        // Caso não exista, simplesmente definir quais estão ocupados
        setHorariosIndisponiveis(ocupados);
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8 text-center">
        Agende seu Horário
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Seus Dados</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Digite seu nome completo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={handleTelefoneChange}
                className="w-full p-2 border rounded-lg"
                placeholder="(XX) XXXXX-XXXX"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Data e Horário</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                <span className="ml-2">
                  Verificando horários disponíveis...
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {TODOS_HORARIOS.map((horario) => (
                <button
                  type="button"
                  key={horario}
                  disabled={horariosIndisponiveis.includes(horario) || loading}
                  className={`p-3 rounded-lg transition-all ${
                    horarioSelecionado === horario
                      ? "bg-amber-500 text-white"
                      : !horariosIndisponiveis.includes(horario)
                      ? "bg-gray-100 hover:bg-gray-200"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  onClick={() => setHorarioSelecionado(horario)}
                >
                  {horario}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Escolha o Serviço</h2>
          <div className="space-y-3">
            {servicos.map((servico) => (
              <button
                type="button"
                key={servico.nome}
                className={`w-full p-4 rounded-lg transition-all flex justify-between items-center ${
                  servicoSelecionado === servico.nome
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setServicoSelecionado(servico.nome)}
              >
                <span>{servico.nome}</span>
                <span>R$ {servico.preco.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-4 rounded-lg text-white text-lg font-bold transition-all ${
            !formularioValido || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600"
          }`}
          disabled={!formularioValido || loading}
        >
          {loading ? "Processando..." : "Confirmar Agendamento"}
        </button>
      </form>
    </div>
  );
}
