import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllAppointments } from "../../services/appointments";
import { NormalizedAppointment } from "../../types/appointment";
import {
  formatarData,
  formatarPreco,
  traduzirStatus,
} from "../../utils/formatters";

// Interface atualizada para as novas métricas
interface DashboardStats {
  totalAgendamentos: number;
  agendamentosHoje: number;
  agendamentosAguardandoPagamento: number;
  agendamentosConfirmados: number;
  faturamentoTotal: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [proximosAgendamentos, setProximosAgendamentos] = useState<
    NormalizedAppointment[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);

        // Carregar apenas agendamentos
        const agendamentos = await getAllAppointments();

        console.log(
          "📊 DEBUG Dashboard: Agendamentos carregados",
          agendamentos.length
        );

        // Data de hoje no formato YYYY-MM-DD
        const hoje = new Date().toISOString().split("T")[0];

        // Calcular novas estatísticas
        let totalAgendamentos = agendamentos.length;
        let agendamentosHoje = 0;
        let agendamentosAguardandoPagamento = 0;
        let agendamentosConfirmados = 0;
        let faturamentoTotal = 0;

        agendamentos.forEach((agendamento) => {
          // Verificar se é de hoje
          if (agendamento.date === hoje) {
            agendamentosHoje++;
          }

          // Contar por status
          if (agendamento.status === "aguardando pagamento") {
            agendamentosAguardandoPagamento++;
          } else if (agendamento.status === "confirmado") {
            agendamentosConfirmados++;
            // Somar faturamento apenas dos confirmados
            faturamentoTotal += agendamento.price || 0; // Usa o campo price do NormalizedAppointment
          }
        });

        console.log("📊 DEBUG Dashboard: Estatísticas calculadas:", {
          totalAgendamentos,
          agendamentosHoje,
          agendamentosAguardandoPagamento,
          agendamentosConfirmados,
          faturamentoTotal,
        });

        setStats({
          totalAgendamentos,
          agendamentosHoje,
          agendamentosAguardandoPagamento,
          agendamentosConfirmados,
          faturamentoTotal,
        });

        // Carregar próximos agendamentos
        carregarProximosAgendamentos(agendamentos); // Passar agendamentos já carregados
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast.error("Erro ao carregar estatísticas do dashboard");
      } finally {
        setLoading(false);
      }
    }

    // Modificar para receber os agendamentos como argumento
    async function carregarProximosAgendamentos(
      todosAgendamentos: NormalizedAppointment[]
    ) {
      try {
        const hoje = new Date().toISOString().split("T")[0];
        const agora = new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const proximos = todosAgendamentos
          .filter(
            (a) =>
              // Filtrar por hoje ou data futura E status relevante
              a.date >= hoje &&
              (a.status === "confirmado" || a.status === "aguardando pagamento")
          )
          .sort((a, b) => {
            // Ordenar por data e depois por horário
            const dateComparison = a.date.localeCompare(b.date);
            if (dateComparison !== 0) return dateComparison;
            return a.time.localeCompare(b.time);
          })
          // Filtrar para pegar apenas os de hoje que ainda não passaram, ou os de dias futuros
          .filter((a) => a.date > hoje || (a.date === hoje && a.time >= agora))
          .slice(0, 5); // Pegar os 5 primeiros

        setProximosAgendamentos(proximos);
      } catch (error) {
        console.error("Erro ao carregar próximos agendamentos:", error);
        // Não mostrar toast aqui para não ser repetitivo
      }
    }

    carregarDados();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Carregando...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
        Painel Administrativo
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Total Agendamentos
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {stats?.totalAgendamentos ?? 0}
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Agendamentos Hoje
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {stats?.agendamentosHoje ?? 0}
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Aguardando Pagamento
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {stats?.agendamentosAguardandoPagamento ?? 0}
          </p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Receita Estimada (Mês)
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {formatarPreco(stats?.receitaEstimadaMes ?? 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-800 p-4 md:p-6 border-b">
          Próximos Agendamentos
        </h2>
        <div className="overflow-x-auto">
          {proximosAgendamentos.length === 0 ? (
            <p className="text-gray-500 p-4 md:p-6">
              Nenhum agendamento futuro encontrado.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Data / Hora
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cliente
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Serviço
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Valor
                  </th>
                  <th
                    scope="col"
                    className="hidden lg:table-cell px-4 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Telefone
                  </th>
                  <th scope="col" className="relative px-4 py-3 sm:px-6">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proximosAgendamentos.map((agendamento) => (
                  <tr key={agendamento.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatarData(agendamento.data)}{" "}
                      <span className="text-gray-500">
                        {agendamento.horario}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-700">
                      {agendamento.cliente.nome}
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.servico.nome}
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          agendamento.status === "confirmado" ||
                          agendamento.status === "agendado"
                            ? "bg-green-100 text-green-800"
                            : agendamento.status === "pendente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {traduzirStatus(agendamento.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-500">
                      {formatarPreco(agendamento.servico.preco)}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.cliente.telefone}
                    </td>
                    <td className="px-4 py-4 sm:px-6 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                        Editar
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
