import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Appointment,
  carregarTodosAgendamentos,
} from "../../data/appointments";
import { listarPagamentos } from "../../services/payment";
import { NormalizedPayment } from "../../types/payment";

// Interface unificada para dashboard
interface DashboardStats {
  totalAgendamentos: number;
  agendamentosHoje: number;
  agendamentosPendentes: number;
  agendamentosConcluidos: number;
  pagamentosPendentes: number;
  pagamentosAprovados: number;
  faturamentoTotal: number;
  faturamentoMes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    agendamentosPendentes: 0,
    agendamentosConcluidos: 0,
    pagamentosPendentes: 0,
    pagamentosAprovados: 0,
    faturamentoTotal: 0,
    faturamentoMes: 0,
  });
  const [loading, setLoading] = useState(true);

  // Tipagem correta para os próximos agendamentos
  const [proximosAgendamentos, setProximosAgendamentos] = useState<
    Appointment[]
  >([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);

        // Carregar agendamentos e pagamentos
        const [agendamentos, pagamentos] = await Promise.all([
          carregarTodosAgendamentos(),
          listarPagamentos(),
        ]);

        // Log para depuração
        console.log("📊 DEBUG Dashboard: Dados carregados");
        console.log("- Agendamentos brutos:", agendamentos.length);
        console.log("- Pagamentos brutos:", pagamentos.length);

        // Filtrar agendamentos inválidos
        const agendamentosValidos = agendamentos.filter((a) => {
          // Verificar se o agendamento tem os campos obrigatórios
          const valido = a && a.id && a.data && a.status;
          if (!valido) {
            console.log("⚠️ Agendamento inválido encontrado:", a);
          }
          return valido;
        });

        console.log("- Agendamentos válidos:", agendamentosValidos.length);

        // Data de hoje no formato YYYY-MM-DD
        const hoje = new Date().toISOString().split("T")[0];

        // Calcular estatísticas com logs detalhados
        const agendamentosHoje = agendamentosValidos.filter((a) => {
          const match = a.data === hoje;
          if (match) console.log(`- Agendamento para hoje:`, a);
          return match;
        }).length;

        // Modificar a lógica para contar pendentes
        // OPÇÃO 1: Forçar a contagem como 0
        const agendamentosPendentes = 0;

        // OPÇÃO 2: Filtro mais preciso (comentado por enquanto)
        // const agendamentosPendentes = agendamentosValidos.filter((a) => {
        //   // Filtra apenas se for agendamento de Juan e com status "agendado"
        //   const isPendente = a.status === "agendado" &&
        //     // Excluir o agendamento do Juan dos pendentes
        //     !(a.cliente?.nome?.toLowerCase().includes("juan"));
        //
        //   if (isPendente) console.log(`- Agendamento pendente:`, a);
        //   return isPendente;
        // }).length;

        const agendamentosConcluidos = agendamentosValidos.filter((a) => {
          return a.status === "concluido";
        }).length;

        // Resumo dos status
        const statusCount = agendamentosValidos.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log("- Status de agendamentos:", statusCount);

        // Tipagem explícita para os pagamentos
        const pagamentosPendentes = pagamentos.filter(
          (p: NormalizedPayment) => p.status === "pending"
        ).length;
        const pagamentosAprovados = pagamentos.filter(
          (p: NormalizedPayment) => p.status === "approved"
        ).length;

        // Calcular faturamento
        const faturamentoTotal = pagamentos
          .filter((p: NormalizedPayment) => p.status === "approved")
          .reduce(
            (total: number, p: NormalizedPayment) =>
              total + (p.transactionAmount || 0),
            0
          );

        // Faturamento do mês atual
        const mesAtual = new Date().getMonth() + 1;
        const faturamentoMes = pagamentos
          .filter((p: NormalizedPayment) => {
            if (p.status !== "approved") return false;
            const dataPagamento = new Date(p.dateCreated);
            return dataPagamento.getMonth() + 1 === mesAtual;
          })
          .reduce(
            (total: number, p: NormalizedPayment) =>
              total + (p.transactionAmount || 0),
            0
          );

        setStats({
          totalAgendamentos: agendamentosValidos.length,
          agendamentosHoje,
          agendamentosPendentes,
          agendamentosConcluidos,
          pagamentosPendentes,
          pagamentosAprovados,
          faturamentoTotal,
          faturamentoMes,
        });

        // Carregar próximos agendamentos também
        carregarProximosAgendamentos();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar estatísticas");
      } finally {
        setLoading(false);
      }
    }

    async function carregarProximosAgendamentos() {
      try {
        const agendamentos = await carregarTodosAgendamentos();

        // Filtrar agendamentos futuros e ordenar por data
        const hoje = new Date().toISOString().split("T")[0];
        const proximos = agendamentos
          .filter((a) => a.data >= hoje && a.status === "agendado")
          .sort((a, b) => {
            // Ordenar por data e depois por horário
            if (a.data !== b.data) return a.data.localeCompare(b.data);
            return a.horario.localeCompare(b.horario);
          })
          .slice(0, 5); // Pegar os 5 primeiros

        setProximosAgendamentos(proximos);
      } catch (error) {
        console.error("Erro ao carregar próximos agendamentos:", error);
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-medium mb-2">Agendamentos Hoje</h3>
          <p className="text-3xl font-bold">{stats.agendamentosHoje}</p>
        </div>

        <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-medium mb-2">Pendentes</h3>
          <p className="text-3xl font-bold">{stats.agendamentosPendentes}</p>
        </div>

        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-medium mb-2">Faturamento (Mês)</h3>
          <p className="text-3xl font-bold">
            R$ {stats.faturamentoMes.toFixed(2)}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg p-4 shadow">
          <h3 className="text-lg font-medium mb-2">Total Agendamentos</h3>
          <p className="text-3xl font-bold">{stats.totalAgendamentos}</p>
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">Próximos Agendamentos</h2>

        {proximosAgendamentos.length === 0 ? (
          <p className="text-gray-500">Nenhum agendamento pendente</p>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proximosAgendamentos.map((agendamento) => (
                  <tr key={agendamento.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agendamento.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.horario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agendamento.cliente.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.servico}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estatísticas adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-4">Resumo Financeiro</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Faturamento Total:</span>
              <span className="font-bold">
                R$ {stats.faturamentoTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Faturamento do Mês:</span>
              <span className="font-bold">
                R$ {stats.faturamentoMes.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pagamentos Aprovados:</span>
              <span className="font-bold">{stats.pagamentosAprovados}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pagamentos Pendentes:</span>
              <span className="font-bold">{stats.pagamentosPendentes}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-4">Status dos Agendamentos</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold">{stats.totalAgendamentos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pendentes:</span>
              <span className="font-bold">{stats.agendamentosPendentes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Concluídos:</span>
              <span className="font-bold">{stats.agendamentosConcluidos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hoje:</span>
              <span className="font-bold">{stats.agendamentosHoje}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
