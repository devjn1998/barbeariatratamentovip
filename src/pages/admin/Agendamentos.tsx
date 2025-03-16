import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import EditarAgendamentoModal from "../../components/EditarAgendamentoModal";
import {
  deleteAppointment,
  getAllAppointments,
  getAppointmentsByDate,
} from "../../services/appointments";
import { NormalizedAppointment } from "../../types/appointment";

// Interface para dados do agendamento
interface Agendamento {
  id: string;
  data: string;
  horario: string;
  cliente: {
    nome: string;
    telefone: string;
  };
  servico: string;
  status: string;
  preco: number;
  pagamentoId?: string;
}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<NormalizedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<NormalizedAppointment | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [confirmExclusao, setConfirmExclusao] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  // Função para carregar dados de agendamentos
  const carregarDados = async (data?: string) => {
    try {
      setLoading(true);
      let dadosAgendamentos: NormalizedAppointment[];

      if (data) {
        dadosAgendamentos = await getAppointmentsByDate(data);
      } else {
        dadosAgendamentos = await getAllAppointments();
      }

      setAgendamentos(dadosAgendamentos);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Não foi possível carregar os agendamentos");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados(filtroData);
  }, [filtroData]);

  // Filtrar agendamentos baseado nos critérios selecionados
  const agendamentosFiltrados = agendamentos.filter((agendamento) => {
    // Filtro por status
    if (filtroStatus !== "todos" && agendamento.status !== filtroStatus) {
      return false;
    }

    // Filtro por texto (nome, telefone ou serviço)
    if (filtroTexto) {
      const termo = filtroTexto.toLowerCase();
      return (
        agendamento.clientName.toLowerCase().includes(termo) ||
        agendamento.clientPhone.toLowerCase().includes(termo) ||
        agendamento.service.toLowerCase().includes(termo)
      );
    }

    return true;
  });

  // Abrir modal de edição
  const handleOpenEditModal = (agendamento: NormalizedAppointment) => {
    setAgendamentoSelecionado(agendamento);
    setModalEditarAberto(true);
  };

  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setModalEditarAberto(false);
    setAgendamentoSelecionado(null);
  };

  // Confirmação para excluir agendamento
  const confirmarExclusao = (id: string, nome: string) => {
    setConfirmExclusao({ id, nome });
  };

  // Cancelar exclusão
  const cancelarExclusao = () => {
    setConfirmExclusao(null);
  };

  // Executar exclusão
  const executarExclusao = async () => {
    if (!confirmExclusao) return;

    try {
      await deleteAppointment(confirmExclusao.id);
      toast.success("Agendamento excluído com sucesso!");
      carregarDados(filtroData);
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento");
    } finally {
      setConfirmExclusao(null);
    }
  };

  // Função para formatar data
  const formatarData = (dataString: string) => {
    try {
      const [ano, mes, dia] = dataString.split("-");
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      return dataString;
    }
  };

  // Função para formatar preço
  const formatarPreco = (valor: number | undefined | null) => {
    try {
      if (valor === undefined || valor === null || isNaN(Number(valor))) {
        return "R$ 0,00";
      }
      return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (error) {
      console.error("Erro ao formatar preço:", valor, error);
      return "R$ 0,00";
    }
  };

  // Função para obter classe CSS baseada no status
  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "agendado":
        return "bg-blue-100 text-blue-800";
      case "concluido":
        return "bg-green-100 text-green-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroStatus("todos");
    setFiltroTexto("");
    // Manter a data selecionada
  };

  // Buscar todos os agendamentos
  const buscarTodosAgendamentos = () => {
    setFiltroData("");
    carregarDados();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Agendamentos</h1>
        <div className="flex space-x-2">
          <button
            onClick={limparFiltros}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
          >
            Limpar Filtros
          </button>
          <button
            onClick={buscarTodosAgendamentos}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Ver Todos
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="todos">Todos</option>
            <option value="agendado">Agendado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Nome, telefone ou serviço"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Tabela de agendamentos */}
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : agendamentosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum agendamento encontrado.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data/Hora
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cliente
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Serviço
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Valor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agendamentosFiltrados.map((agendamento) => (
                <tr key={agendamento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{agendamento.formattedDate}</div>
                    <div>{agendamento.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{agendamento.clientName}</div>
                    <div className="text-xs text-gray-400">
                      {agendamento.clientPhone}
                    </div>
                    {agendamento.clientEmail && (
                      <div className="text-xs text-gray-400">
                        {agendamento.clientEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agendamento.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agendamento.formattedPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        agendamento.status === "agendado"
                          ? "bg-blue-100 text-blue-800"
                          : agendamento.status === "concluido"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {agendamento.statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(agendamento)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() =>
                          confirmarExclusao(
                            agendamento.id,
                            agendamento.clientName
                          )
                        }
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de edição */}
      {agendamentoSelecionado && (
        <EditarAgendamentoModal
          agendamento={agendamentoSelecionado}
          isOpen={modalEditarAberto}
          onClose={handleCloseEditModal}
          onSave={() => {
            handleCloseEditModal();
            carregarDados(filtroData);
          }}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmExclusao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-4">Confirmar exclusão</h3>
            <p className="mb-4">
              Tem certeza que deseja excluir o agendamento de{" "}
              <span className="font-semibold">{confirmExclusao.nome}</span>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelarExclusao}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={executarExclusao}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
