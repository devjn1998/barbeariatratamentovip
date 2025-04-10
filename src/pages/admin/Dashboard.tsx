import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllAppointments } from "../../services/appointments";
import { NormalizedAppointment } from "../../types/appointment";

// Interface atualizada para as novas métricas
interface DashboardStats {
  totalAgendamentos: number;
  agendamentosHoje: number;
  agendamentosAguardandoPagamento: number;
  agendamentosConfirmados: number;
  faturamentoTotal: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    agendamentosAguardandoPagamento: 0,
    agendamentosConfirmados: 0,
    faturamentoTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [proximosAgendamentos, setProximosAgendamentos] = useState<
    NormalizedAppointment[]
  >([]);

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Painel de Controle</h1>

      {/* Estatísticas e outros componentes existentes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Dashboard</h2>

        {/* Cards de estatísticas ATUALIZADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Agendamentos Hoje */}
          <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-medium mb-2">Agendamentos Hoje</h3>
            <p className="text-3xl font-bold">{stats.agendamentosHoje}</p>
          </div>

          {/* Aguardando Pagamento */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-medium mb-2">Aguardando Pagamento</h3>
            <p className="text-3xl font-bold">
              {stats.agendamentosAguardandoPagamento}
            </p>
          </div>

          {/* Confirmados */}
          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-medium mb-2">Confirmados</h3>
            <p className="text-3xl font-bold">
              {stats.agendamentosConfirmados}
            </p>
          </div>

          {/* Faturamento Total (baseado nos confirmados) */}
          <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-medium mb-2">
              Faturamento (Confirmado)
            </h3>
            <p className="text-3xl font-bold">
              R$ {stats.faturamentoTotal.toFixed(2).replace(".", ",")}
            </p>
          </div>
          {/* Total Agendamentos */}
          <div className="bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-lg p-4 shadow col-span-1 md:col-span-2 lg:col-span-4">
            <h3 className="text-lg font-medium mb-2">
              Total Geral de Agendamentos
            </h3>
            <p className="text-3xl font-bold">{stats.totalAgendamentos}</p>
          </div>
        </div>

        {/* Próximos agendamentos ATUALIZADO */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Próximos Agendamentos</h2>

          {proximosAgendamentos.length === 0 ? (
            <p className="text-gray-500">
              Nenhum próximo agendamento encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proximosAgendamentos.map((agendamento) => (
                    <tr key={agendamento.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agendamento.formattedDate || agendamento.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agendamento.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agendamento.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agendamento.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            agendamento.status === "confirmado"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {agendamento.statusText || agendamento.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
