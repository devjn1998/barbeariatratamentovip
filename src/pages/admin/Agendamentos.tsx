import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import EditarAgendamentoModal from "../../components/EditarAgendamentoModal";
import {
  deleteAppointment,
  getAllAppointments,
  getAppointmentsByDate,
} from "../../services/appointments";
import {
  AppointmentStatus,
  NormalizedAppointment,
} from "../../types/appointment";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  formatarData,
  formatarPreco,
  traduzirStatus,
} from "../../utils/formatters";

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
  const fetchAgendamentos = async (data?: string) => {
    try {
      setLoading(true);
      console.log(`Buscando agendamentos para data: ${data || "todos"}`);

      let resultado;
      if (data) {
        // Garantir que a data está no formato correto (YYYY-MM-DD)
        resultado = await getAppointmentsByDate(data);
      } else {
        resultado = await getAllAppointments();
      }

      console.log(`Agendamentos encontrados: ${resultado.length}`);
      setAgendamentos(resultado);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao buscar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais ou quando filtroData mudar
  useEffect(() => {
    const fetchAgendamentos = async () => {
      setLoading(true);
      try {
        console.log(
          `[Agendamentos] Iniciando busca para data: ${
            filtroData || "todas as datas"
          }`
        );

        let q;
        const agendamentosCollection = collection(db, "agendamentos");

        if (filtroData) {
          // Não podemos fazer OR na mesma consulta no Firestore, então fazemos duas consultas
          const qDate = query(
            agendamentosCollection,
            where("date", "==", filtroData)
          );

          const qData = query(
            agendamentosCollection,
            where("data", "==", filtroData)
          );

          // Executar ambas as consultas
          const [snapshotDate, snapshotData] = await Promise.all([
            getDocs(qDate),
            getDocs(qData),
          ]);

          // Combinar os resultados
          const docs = [...snapshotDate.docs, ...snapshotData.docs];

          // Remover duplicatas (se um documento aparecer nas duas consultas)
          const uniqueDocs = docs.filter(
            (doc, index, self) =>
              index === self.findIndex((d) => d.id === doc.id)
          );

          // Processar os documentos
          const agendamentosArr = uniqueDocs.map((doc) => {
            const data = doc.data();

            // Determinamos o status baseado no campo 'confirmado'
            const statusFromConfirmado =
              data.confirmado === true ? "confirmado" : "aguardando pagamento";

            return {
              id: doc.id,
              date: data.date || data.data,
              time: data.time || data.horario,
              service: data.service || data.servico,
              price: data.price || data.preco,
              status: data.status || statusFromConfirmado, // Usa 'confirmado' como fallback

              // Campos formatados
              formattedDate: formatarData(data.date || data.data),
              formattedPrice: formatarPreco(data.price || data.preco),
              statusText:
                data.confirmado === true
                  ? "Confirmado"
                  : "Aguardando Pagamento",

              // Campos do cliente
              clientName: data.clientName || data.cliente?.nome || "",
              clientPhone: data.clientPhone || data.cliente?.telefone || "",

              // Novo campo booleano
              confirmado: data.confirmado === true,
            };
          });

          setAgendamentos(agendamentosArr);
        } else {
          // Caso para quando filtroData está vazio (buscar todos)
          const q = query(agendamentosCollection);
          const querySnapshot = await getDocs(q);

          const agendamentosArr = querySnapshot.docs.map((doc) => {
            const data = doc.data();

            // O mesmo processamento de dados
            const statusFromConfirmado =
              data.confirmado === true ? "confirmado" : "aguardando pagamento";

            return {
              id: doc.id,
              date: data.date || data.data,
              time: data.time || data.horario,
              service: data.service || data.servico,
              price: data.price || data.preco,
              status: data.status || statusFromConfirmado,
              formattedDate: formatarData(data.date || data.data),
              formattedPrice: formatarPreco(data.price || data.preco),
              statusText:
                data.confirmado === true
                  ? "Confirmado"
                  : "Aguardando Pagamento",
              clientName: data.clientName || data.cliente?.nome || "",
              clientPhone: data.clientPhone || data.cliente?.telefone || "",
              confirmado: data.confirmado === true,
            };
          });

          setAgendamentos(agendamentosArr);
        }
      } catch (error) {
        console.error("[Agendamentos] Erro ao buscar:", error);
        toast.error("Erro ao carregar agendamentos");
      } finally {
        setLoading(false);
      }
    };

    fetchAgendamentos();
  }, [filtroData]);

  // Filtrar agendamentos baseado nos critérios selecionados
  const agendamentosFiltrados = agendamentos.filter((agendamento) => {
    // Filtro por status (adaptado para usar confirmado)
    if (filtroStatus !== "todos") {
      const statusEsperado = filtroStatus === "confirmado";
      // Verificar se o status corresponde, com fallback para o campo status tradicional
      const isConfirmado =
        agendamento.confirmado !== undefined
          ? agendamento.confirmado
          : agendamento.status === "confirmado";

      if (isConfirmado !== statusEsperado) {
        return false;
      }
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

    // Filtro por data
    if (filtroData) {
      const dataFormatada = agendamento.date;
      // Tentar encontrar correspondência em qualquer formato
      if (dataFormatada !== filtroData) {
        return false;
      }
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
      fetchAgendamentos();
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento");
    } finally {
      setConfirmExclusao(null);
    }
  };

  // Função para obter classe CSS baseada no status
  const getStatusClass = (status: string) => {
    // Usar o campo 'confirmado' como principal indicador
    // Assumindo que 'status' pode ainda ter 'aguardando pagamento'
    const isConfirmed = agendamentos.find(
      (a) => a.status === status
    )?.confirmado; // Encontra o agendamento para pegar o 'confirmado'

    if (isConfirmed === true) {
      return "bg-green-100 text-green-800"; // Verde para confirmado
    } else if (status === "aguardando pagamento") {
      return "bg-orange-100 text-orange-800"; // Laranja para aguardando pagamento
    } else {
      // Se não for confirmado e não for 'aguardando pagamento', pode ser pendente/agendado inicial
      return "bg-yellow-100 text-yellow-800"; // Amarelo para pendente/agendado
    }

    /* REMOVENDO A LÓGICA ANTIGA BASEADA EM STRINGS DE STATUS
    switch (status?.toLowerCase()) {
      case AppointmentStatus.SCHEDULED: // 'agendado'
      case AppointmentStatus.PENDING: // 'pendente' (novo status)
        return "bg-yellow-100 text-yellow-800"; // Amarelo para pendente/agendado
      case "aguardando pagamento": // Status específico para dinheiro
        return "bg-orange-100 text-orange-800"; // Laranja para aguardando pagamento
      case AppointmentStatus.COMPLETED: // 'concluido' ou 'confirmado'
      case "confirmado": // Adicionar 'confirmado' explicitamente
        return "bg-green-100 text-green-800"; // Verde para concluído/confirmado
      // case AppointmentStatus.CANCELED: // 'cancelado' <-- REMOVIDO
      //   return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800"; // Cinza para outros/desconhecido
    }
    */
  };

  // Adicionar as funções que estão faltando
  const handleFiltroDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novaData = e.target.value;
    console.log(`Nova data selecionada: ${novaData}`);
    setFiltroData(novaData);
    // O useEffect irá buscar os agendamentos automaticamente quando filtroData mudar
  };

  const limparFiltros = () => {
    setFiltroData("");
    setFiltroStatus("todos");
    setFiltroTexto("");
  };

  const buscarTodosAgendamentos = () => {
    setFiltroData(""); // Limpar filtro de data para mostrar todos
  };

  // Adicionar log antes do return
  console.log(
    `[Agendamentos Render] Loading: ${loading}, Agendamentos Count: ${agendamentos.length}`
  );

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
          <label
            htmlFor="filtro-data"
            className="block text-sm font-medium text-gray-700"
          >
            Filtrar por Data
          </label>
          <input
            type="date"
            id="filtro-data"
            className="form-input rounded-md shadow-sm mt-1 block w-full"
            value={filtroData}
            onChange={handleFiltroDataChange}
          />
        </div>

        <div>
          <label
            htmlFor="filtro-status"
            className="block text-sm font-medium text-gray-700"
          >
            Filtrar por Status
          </label>
          <select
            id="filtro-status"
            className="form-select rounded-md shadow-sm mt-1 block w-full"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="confirmado">Confirmado</option>
            <option value="aguardando pagamento">Aguardando Pagamento</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filtro-texto"
            className="block text-sm font-medium text-gray-700"
          >
            Buscar por Cliente, Telefone ou Serviço
          </label>
          <input
            type="text"
            id="filtro-texto"
            className="form-input rounded-md shadow-sm mt-1 block w-full"
            placeholder="Digite para buscar..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
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
          <div className="overflow-x-auto">
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
                    Telefone
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
                      <div>{agendamento.formattedDate || agendamento.date}</div>
                      <div>{agendamento.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.clientPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agendamento.formattedPrice ||
                        formatarPreco(agendamento.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                          agendamento.status
                        )}`}
                      >
                        {agendamento.statusText || agendamento.status}
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
          </div>
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
            fetchAgendamentos();
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
