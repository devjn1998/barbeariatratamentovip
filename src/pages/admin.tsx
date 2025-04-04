import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import EditarAgendamentoModal from "../components/EditarAgendamentoModal";
import ServerOffline from "../components/ServerOffline";
import {
  Appointment,
  carregarTodosAgendamentos,
  excluirAgendamento,
} from "../data/appointments";
import { listarPagamentos } from "../services/payment";
import { NormalizedPayment } from "../types/payment";
import { limparCacheLocal } from "../utils/cache";
import { ensureHttp } from "../utils/redirect";

// Adicione esta interface logo após as outras interfaces no início do arquivo
interface AgendamentoDebug {
  id: string;
  data?: string;
  horario?: string;
  cliente?: { nome?: string; telefone?: string; email?: string };
  servico?: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: any; // Para propriedades adicionais que possam existir
}

export default function PaginaAdmin() {
  const [dataFiltro, setDataFiltro] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState<
    "agendamentos" | "pagamentos" | "relatorios"
  >("agendamentos");
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [pagamentos, setPagamentos] = useState<NormalizedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] =
    useState<NormalizedPayment | null>(null);
  const [confirmExclusao, setConfirmExclusao] = useState<{
    id: string;
    tipo: "agendamento" | "pagamento";
    nome?: string;
  } | null>(null);
  const [error, setError] = useState(false);
  const [isHttp, setIsHttp] = useState(false);

  // Verificar se estamos usando HTTP
  useEffect(() => {
    const isHttpProtocol = ensureHttp();
    setIsHttp(isHttpProtocol);
  }, []);

  // Função para carregar pagamentos
  const carregarPagamentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await listarPagamentos();

      // Normalizar os dados para evitar campos undefined
      const dadosNormalizados = data.map((pagamento: NormalizedPayment) => ({
        ...pagamento,
        transactionAmount:
          typeof pagamento.transactionAmount === "number"
            ? pagamento.transactionAmount
            : 0,
        clientName: pagamento.clientName || "Cliente não identificado",
        clientPhone: pagamento.clientPhone || "Telefone não informado",
        appointmentDate: pagamento.appointmentDate || "Data não definida",
        appointmentTime: pagamento.appointmentTime || "",
        service: pagamento.service || "Serviço não especificado",
        status: pagamento.status || "Pendente",
      }));

      setPagamentos(dadosNormalizados);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      setError(true);
      toast.error("Erro ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados na inicialização
  useEffect(() => {
    carregarPagamentos();
  }, [carregarPagamentos]);

  useEffect(() => {
    async function loadData() {
      try {
        // Carregar agendamentos - Usar carregarTodosAgendamentos() que não exige data
        const appointmentsData = await carregarTodosAgendamentos();
        console.log("Agendamentos carregados:", appointmentsData);
        setAgendamentos(appointmentsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Carregar agendamentos para uma data específica
  const carregarAgendamentos = async (data: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/agendamentos?data=${data}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar agendamentos");
      }

      const dados = await response.json();

      // Converter os dados para o formato Appointment
      const agendamentosFormatados: Appointment[] = dados.map((item: any) => ({
        id: item.id,
        data: item.data_agendamento || item.data || "Data não informada",
        horario:
          item.horario_agendamento || item.horario || "Horário não informado",
        servico: item.servico || "Serviço não especificado",
        cliente: {
          nome: item.cliente_nome || item.cliente?.nome || "Cliente",
          telefone:
            item.cliente_telefone || item.cliente?.telefone || "Não informado",
        },
        status: item.status || "Pendente",
        preco:
          typeof item.transactionAmount === "number"
            ? item.transactionAmount
            : 0,
        pagamentoId: item.pagamentoId || item.id,
      }));

      setAgendamentos(agendamentosFormatados);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar agendamentos quando a data de filtro mudar
  useEffect(() => {
    if (activeTab === "agendamentos" && dataFiltro) {
      carregarAgendamentos(dataFiltro);
    }
  }, [dataFiltro, activeTab]);

  // Abrir modal de edição
  const handleOpenEditModal = (payment: NormalizedPayment) => {
    setEditingPayment(payment);
    setEditModalOpen(true);
  };

  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingPayment(null);
  };

  // Confirmação de exclusão
  const confirmarExclusao = (id: string, nome?: string) => {
    setConfirmExclusao({ id, tipo: "agendamento", nome });
  };

  // Cancelar exclusão
  const cancelarExclusao = () => {
    setConfirmExclusao(null);
  };

  // Executar exclusão
  const executarExclusao = async () => {
    if (!confirmExclusao) return;

    try {
      await excluirAgendamento(confirmExclusao.id);
      toast.success("Agendamento excluído com sucesso!");
      carregarAgendamentos(dataFiltro);
    } catch (error) {
      toast.error("Erro ao excluir agendamento");
    } finally {
      setConfirmExclusao(null);
    }
  };

  // Salvar edição
  const handleSaveEdit = () => {
    carregarAgendamentos(dataFiltro);
    toast.success("Agendamento atualizado com sucesso!");
  };

  // Adicionar um botão para buscar agendamentos por data específica
  const buscarAgendamentosPorData = async (data: string) => {
    try {
      console.log(`🔍 Buscando agendamentos para data ${data}...`);
      const response = await fetch(`/api/agendamentos?data=${data}`);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const agendamentos = await response.json();
      console.log(
        `📊 Agendamentos encontrados (${agendamentos.length}):`,
        agendamentos
      );

      if (agendamentos.length === 0) {
        toast.info(`Nenhum agendamento encontrado para ${data}`);
      } else {
        toast.success(`${agendamentos.length} agendamento(s) encontrado(s)`);
        setAgendamentos(agendamentos);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Falha ao buscar agendamentos");
    }
  };

  // Se não estiver usando HTTP, exibir mensagem de redirecionamento
  if (!isHttp) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Redirecionando...</h1>
        <p>Por favor aguarde, estamos redirecionando para HTTP...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>

      {/* Indicador de protocolo - para debugging */}
      <div className="mb-4 text-xs bg-gray-100 p-2 rounded">
        Protocolo: <span className="font-mono">{window.location.protocol}</span>{" "}
        | URL: <span className="font-mono">{window.location.href}</span>
      </div>

      {/* Tabs de navegação */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            className={`py-4 px-2 ${
              activeTab === "agendamentos"
                ? "border-b-2 border-amber-500 text-amber-500 font-medium"
                : "text-gray-500 hover:text-amber-500"
            }`}
            onClick={() => setActiveTab("agendamentos")}
          >
            Agendamentos
          </button>
          <button
            className={`py-4 px-2 ${
              activeTab === "pagamentos"
                ? "border-b-2 border-amber-500 text-amber-500 font-medium"
                : "text-gray-500 hover:text-amber-500"
            }`}
            onClick={() => setActiveTab("pagamentos")}
          >
            Pagamentos
          </button>
          <a
            href="/admin/limpeza-dados"
            className="py-4 px-2 text-gray-500 hover:text-amber-500"
          >
            Limpeza de Dados
          </a>
        </div>
      </div>

      {/* Conteúdo da aba de Agendamentos */}
      {activeTab === "agendamentos" && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Agendamentos</h2>
            <button
              onClick={async () => {
                const allAppointments = await carregarTodosAgendamentos();
                setAgendamentos(allAppointments);
                toast.success(
                  `${allAppointments.length} agendamentos carregados`
                );
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔄 Recarregar todos
            </button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Filtrar por data:</span>
              <input
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="border rounded p-2"
              />
              <button
                className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200"
                onClick={() => carregarAgendamentos(dataFiltro)}
              >
                Atualizar
              </button>
            </div>
            <button
              onClick={() => buscarAgendamentosPorData("2025-03-06")}
              className="ml-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Buscar 06/03
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando agendamentos...</p>
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">
                Nenhum agendamento para esta data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agendamentos
                    // Filtrar para remover qualquer undefined ou null
                    .filter((agendamento) => agendamento && agendamento.id)
                    // Ordenar por data e horário
                    .sort((a, b) => {
                      const dataComparison = a.data.localeCompare(b.data);
                      if (dataComparison !== 0) return dataComparison;
                      return a.horario.localeCompare(b.horario);
                    })
                    // Garantir chaves únicas adicionando um índice
                    .map((agendamento, index) => (
                      <tr key={`${agendamento.id}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {agendamento.cliente.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {agendamento.cliente.telefone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {/* FORMATAR MANUALMENTE YYYY-MM-DD para DD/MM/YYYY */}
                            {agendamento.data
                              ? agendamento.data.split("-").reverse().join("/")
                              : "Data inválida"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {agendamento.horario}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {agendamento.servico}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            R${" "}
                            {typeof agendamento.preco === "number"
                              ? agendamento.preco.toFixed(2)
                              : "0.00"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              agendamento.status === "agendado"
                                ? "bg-green-100 text-green-800"
                                : agendamento.status === "concluido"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {agendamento.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            className="text-amber-600 hover:text-amber-900 mr-4"
                            onClick={() => {
                              const payment: NormalizedPayment = {
                                id: agendamento.pagamentoId || agendamento.id,
                                status: agendamento.status,
                                dateCreated: agendamento.data,
                                transactionAmount: agendamento.preco,
                                description: agendamento.servico,
                                paymentMethodId: "pix",
                                appointmentDate: agendamento.data,
                                appointmentTime: agendamento.horario,
                                clientName: agendamento.cliente.nome,
                                clientPhone: agendamento.cliente.telefone,
                                service: agendamento.servico,
                                clientEmail: "",
                              };
                              handleOpenEditModal(payment);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() =>
                              confirmarExclusao(
                                agendamento.id,
                                agendamento.cliente.nome
                              )
                            }
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da aba de Pagamentos - mantemos como estava */}
      {activeTab === "pagamentos" && (
        <div>
          {loading ? (
            <div className="p-8 text-center">
              <p>Carregando pagamentos...</p>
              <div className="mt-4 w-16 h-16 border-t-4 border-b-4 border-amber-500 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : error ? (
            <ServerOffline
              onRetry={() => {
                setError(false);
                setLoading(true);
                carregarPagamentos();
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagamentos.map((pagamento) => (
                    <tr
                      key={pagamento.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-2 px-4">
                        {pagamento.id?.substring(0, 6) || "N/A"}
                      </td>
                      <td className="py-2 px-4">
                        {pagamento.status || "Pendente"}
                      </td>
                      <td className="py-2 px-4">
                        {/* Adicionar verificação para evitar o erro de toFixed */}
                        R${" "}
                        {typeof pagamento.transactionAmount === "number"
                          ? pagamento.transactionAmount.toFixed(2)
                          : "0.00"}
                      </td>
                      <td className="py-2 px-4">
                        {pagamento.clientName || "N/A"}
                      </td>
                      <td className="py-2 px-4">
                        {pagamento.clientPhone || "N/A"}
                      </td>
                      <td className="py-2 px-4">
                        {pagamento.appointmentDate || "N/A"}{" "}
                        {pagamento.appointmentTime || ""}
                      </td>
                      <td className="py-2 px-4">
                        {pagamento.service || "N/A"}
                      </td>
                      <td className="py-2 px-4">
                        {/* Adicionar botões de ação com verificações */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(pagamento)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() =>
                              confirmarExclusao(
                                pagamento.id || "",
                                pagamento.clientName
                              )
                            }
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
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
      )}

      {/* Modal de edição */}
      {editModalOpen && editingPayment && (
        <EditarAgendamentoModal
          agendamento={{
            id: editingPayment.id,
            date: editingPayment.appointmentDate || "",
            time: editingPayment.appointmentTime || "",
            service: editingPayment.service || "",
            price: editingPayment.transactionAmount || 0,
            status: editingPayment.status,
            clientName: editingPayment.clientName || "",
            clientPhone: editingPayment.clientPhone || "",
            clientEmail: editingPayment.clientEmail || "",
            paymentId: editingPayment.id,
          }}
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmExclusao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar exclusão</h3>
            <p className="mb-6">
              Tem certeza que deseja excluir o agendamento
              {confirmExclusao.nome ? ` de ${confirmExclusao.nome}` : ""}?
              <br />
              <strong className="text-red-600">
                Esta ação não pode ser desfeita!
              </strong>
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelarExclusao}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={executarExclusao}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adicione esta seção ao componente para exibir os agendamentos */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Agendamentos</h2>

        {agendamentos.length === 0 ? (
          <p className="text-gray-500">Nenhum agendamento encontrado.</p>
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
                {agendamentos.map((agendamento) => (
                  <tr key={agendamento.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agendamento.data}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agendamento.horario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agendamento.cliente?.nome || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agendamento.servico}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          agendamento.status === "agendado"
                            ? "bg-yellow-100 text-yellow-800"
                            : agendamento.status === "concluido"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {agendamento.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adicionar este botão no painel de administração */}
      <button
        onClick={async () => {
          try {
            setLoading(true);
            const response = await fetch("/api/admin/clean-duplicate-times", {
              method: "POST",
            });
            const result = await response.json();

            if (result.success) {
              toast.success(`Limpeza concluída: ${result.message}`);
              // Recarregar agendamentos após a limpeza - passando a data atual como argumento
              carregarAgendamentos(dataFiltro);
            } else {
              toast.error(`Erro na limpeza: ${result.error}`);
            }
          } catch (error) {
            console.error("Erro ao limpar duplicatas:", error);
            toast.error("Erro ao limpar horários duplicados");
          } finally {
            setLoading(false);
          }
        }}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
        disabled={loading}
      >
        Limpar Horários Duplicados
      </button>

      {/* Adicionar perto dos outros botões no componente Admin */}
      <button
        onClick={async () => {
          const data = prompt(
            "Informe a data para verificar (YYYY-MM-DD):",
            "2025-03-06"
          );
          if (!data) return;

          try {
            setLoading(true);

            // Fazer fetch para a nova rota de debug
            const response = await fetch(
              `/api/debug/agendamentos?data=${data}`
            );
            const result = await response.json();

            console.log("Resultado do diagnóstico:", result);

            // Mostrar resultado
            alert(
              `Encontrados ${
                result.count
              } agendamentos para ${data}:\n${result.agendamentos
                .map(
                  (a: AgendamentoDebug) =>
                    `${a.horario} - ${a.cliente?.nome || "Cliente"} (${
                      a.servico || "Serviço"
                    })`
                )
                .join("\n")}`
            );
          } catch (error) {
            console.error("Erro no diagnóstico:", error);
            alert("Erro ao buscar agendamentos para diagnóstico");
          } finally {
            setLoading(false);
          }
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        disabled={loading}
      >
        Diagnosticar Agendamentos
      </button>

      {/* Adicionar este botão na interface do administrador */}
      <button
        onClick={async () => {
          if (
            window.confirm(
              "ATENÇÃO: Isso irá apagar TODOS os dados. Tem certeza?"
            )
          ) {
            setLoading(true);
            try {
              // Limpar cache local
              limparCacheLocal();

              // Corrigir a URL para incluir o servidor completo
              const response = await fetch(
                "http://localhost:3001/admin/reset-database",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    collections: ["agendamentos", "pagamentos"],
                  }),
                }
              );

              // Verificar se a resposta é bem-sucedida antes de tentar analisá-la como JSON
              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ${response.status}: ${errorText}`);
              }

              const result = await response.json();

              if (result.success) {
                toast.success("Sistema reiniciado com sucesso!");
                // Recarregar a página para aplicar as mudanças
                window.location.reload();
              } else {
                toast.error(`Erro: ${result.error}`);
              }
            } catch (error) {
              console.error("Erro ao reiniciar sistema:", error);
              toast.error(
                `Erro ao reiniciar o sistema: ${
                  error instanceof Error ? error.message : "Erro desconhecido"
                }`
              );
            } finally {
              setLoading(false);
            }
          }
        }}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        disabled={loading}
      >
        Reiniciar Sistema (Limpar Todos os Dados)
      </button>
    </div>
  );
}
