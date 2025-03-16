import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  excluirPagamento,
  forcarExclusaoPagamento,
  limparPagamentosDeTesteOuSemCliente,
  listarPagamentos,
  sincronizarPagamentosComAgendamentos,
  verificarERestaurarPagamentos,
} from "../../services/payment";
import { NormalizedPayment } from "../../types/payment";

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState<NormalizedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [confirmExclusao, setConfirmExclusao] = useState<{
    id: string;
    descricao: string;
  } | null>(null);
  const [confirmForcaExclusao, setConfirmForcaExclusao] = useState<{
    id: string;
    descricao: string;
  } | null>(null);
  const [isSincronizando, setIsSincronizando] = useState(false);
  const [isLimpando, setIsLimpando] = useState(false);
  const [isRestaurando, setIsRestaurando] = useState(false);

  // Função para carregar pagamentos
  const carregarPagamentos = async () => {
    try {
      setLoading(true);
      const data = await listarPagamentos();
      setPagamentos(data);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      toast.error("Não foi possível carregar os pagamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPagamentos();
  }, []);

  // Filtrar pagamentos baseado nos critérios selecionados
  const pagamentosFiltrados = pagamentos.filter((pagamento) => {
    // Filtro por período
    if (filtroPeriodo !== "todos") {
      const dataAtual = new Date();
      const dataPagamento = new Date(pagamento.dateCreated);

      if (filtroPeriodo === "hoje") {
        const hoje = new Date();
        if (
          dataPagamento.getDate() !== hoje.getDate() ||
          dataPagamento.getMonth() !== hoje.getMonth() ||
          dataPagamento.getFullYear() !== hoje.getFullYear()
        ) {
          return false;
        }
      } else if (filtroPeriodo === "semana") {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(dataAtual.getDate() - 7);
        if (dataPagamento < umaSemanaAtras) return false;
      } else if (filtroPeriodo === "mes") {
        const umMesAtras = new Date();
        umMesAtras.setMonth(dataAtual.getMonth() - 1);
        if (dataPagamento < umMesAtras) return false;
      }
    }

    // Filtro por status
    if (filtroStatus !== "todos" && pagamento.status !== filtroStatus) {
      return false;
    }

    // Filtro por texto (pesquisa em vários campos)
    if (filtroTexto) {
      const texto = filtroTexto.toLowerCase();
      return (
        pagamento.id.toLowerCase().includes(texto) ||
        pagamento.description.toLowerCase().includes(texto) ||
        pagamento.clientName.toLowerCase().includes(texto) ||
        pagamento.clientName.toLowerCase().includes(texto) ||
        (pagamento.clientPhone &&
          pagamento.clientPhone.toLowerCase().includes(texto)) ||
        (pagamento.service && pagamento.service.toLowerCase().includes(texto))
      );
    }

    return true;
  });

  // Pedir confirmação antes de excluir
  const confirmarExclusao = (id: string, nome: string) => {
    setConfirmExclusao({ id, descricao: nome });
  };

  // Cancelar exclusão
  const cancelarExclusao = () => {
    setConfirmExclusao(null);
  };

  // Executar exclusão
  const executarExclusao = async () => {
    if (!confirmExclusao) return;

    try {
      setLoading(true);
      await excluirPagamento(confirmExclusao.id);
      toast.success(
        `Pagamento de ${confirmExclusao.descricao} excluído com sucesso`
      );
      // Recarregar os pagamentos após a exclusão
      await carregarPagamentos();
    } catch (error: any) {
      console.error("Erro ao excluir pagamento:", error);
      // Exibir mensagem de erro mais detalhada
      toast.error(
        `Erro ao excluir pagamento: ${
          error.message || "Tente novamente mais tarde"
        }`
      );

      // Oferecer a opção de exclusão forçada
      setConfirmForcaExclusao(confirmExclusao);
    } finally {
      setConfirmExclusao(null);
      setLoading(false);
    }
  };

  // Forçar exclusão
  const forcarExclusao = async () => {
    if (!confirmForcaExclusao) return;

    try {
      setLoading(true);
      const sucesso = await forcarExclusaoPagamento(confirmForcaExclusao.id);

      if (sucesso) {
        toast.success(
          `Pagamento de ${confirmForcaExclusao.descricao} forçadamente excluído`
        );
        // Recarregar os pagamentos após a exclusão
        await carregarPagamentos();
      } else {
        toast.error(
          "Não foi possível excluir o pagamento mesmo com exclusão forçada"
        );
      }
    } catch (error: any) {
      console.error("Erro na exclusão forçada:", error);
      toast.error(
        `Erro na exclusão forçada: ${
          error.message || "Falha completa na operação"
        }`
      );
    } finally {
      setConfirmForcaExclusao(null);
      setLoading(false);
    }
  };

  // Cancelar exclusão forçada
  const cancelarExclusaoForcada = () => {
    setConfirmForcaExclusao(null);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroPeriodo("todos");
    setFiltroStatus("todos");
    setFiltroTexto("");
  };

  // Executar sincronização
  const executarSincronizacao = async () => {
    if (isSincronizando) return;

    setIsSincronizando(true);
    try {
      const resultado = await sincronizarPagamentosComAgendamentos();
      toast.success(
        `Sincronização concluída! ${resultado.sucessos} pagamentos atualizados, ${resultado.falhas} falhas.`
      );

      // Recarregar os pagamentos para exibir os dados atualizados
      carregarPagamentos();
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast.error("Erro ao sincronizar pagamentos com agendamentos");
    } finally {
      setIsSincronizando(false);
    }
  };

  // Executar limpeza de pagamentos sem cliente
  const executarLimpezaPagamentos = async () => {
    if (isLimpando) return;

    if (
      !window.confirm(
        "Esta ação vai excluir apenas pagamentos de teste e pagamentos sem cliente " +
          "que não estão vinculados a agendamentos. Pagamentos com clientes identificados ou vinculados a agendamentos serão preservados. Deseja continuar?"
      )
    ) {
      return;
    }

    setIsLimpando(true);
    try {
      const resultado = await limparPagamentosDeTesteOuSemCliente();
      toast.success(
        `Limpeza concluída! ${resultado.removidos} pagamentos removidos, ${resultado.ignorados} pagamentos preservados, ${resultado.falhas} falhas.`
      );

      // Recarregar os pagamentos para atualizar a lista
      await carregarPagamentos();
    } catch (error) {
      console.error("Erro na limpeza de pagamentos:", error);
      toast.error("Erro ao limpar pagamentos sem cliente");
    } finally {
      setIsLimpando(false);
    }
  };

  // Executar restauração de pagamentos
  const executarRestauracaoPagamentos = async () => {
    if (isRestaurando) return;

    if (
      !window.confirm(
        "Esta ação vai tentar restaurar pagamentos que possam ter sido excluídos incorretamente. " +
          "Pagamentos serão criados para agendamentos que não têm mais seus pagamentos associados. Deseja continuar?"
      )
    ) {
      return;
    }

    setIsRestaurando(true);
    try {
      const resultado = await verificarERestaurarPagamentos();
      toast.success(
        `Restauração concluída! ${resultado.restaurados} pagamentos restaurados, ${resultado.total} agendamentos verificados, ${resultado.falhas} falhas.`
      );

      // Recarregar os pagamentos para atualizar a lista
      await carregarPagamentos();
    } catch (error: any) {
      console.error("Erro na restauração de pagamentos:", error);

      // Mensagem de erro mais detalhada
      let mensagemErro = "Erro ao restaurar pagamentos";
      if (error?.message) {
        mensagemErro += `: ${error.message}`;
      }
      if (error?.stack) {
        console.error("Stack trace do erro:", error.stack);
      }

      toast.error(mensagemErro);
    } finally {
      setIsRestaurando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Gerenciamento de Pagamentos</h1>
        <p className="mb-4 text-gray-600">
          Gerencie todos os pagamentos realizados pelos clientes. Os dados
          exibidos são as informações cadastradas pelos próprios clientes no
          momento do agendamento.
        </p>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => limparFiltros()}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Limpar Filtros
          </button>
          <button
            onClick={executarSincronizacao}
            disabled={isSincronizando}
            className={`${
              isSincronizando ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            } text-white px-4 py-2 rounded-md transition-colors flex items-center`}
          >
            {isSincronizando ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sincronizando...
              </>
            ) : (
              "Sincronizar com Agendamentos"
            )}
          </button>
          <button
            onClick={executarLimpezaPagamentos}
            disabled={isLimpando}
            className={`${
              isLimpando ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
            } text-white px-4 py-2 rounded-md transition-colors flex items-center`}
          >
            {isLimpando ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Limpando...
              </>
            ) : (
              "Limpar Pagamentos Sem Cliente"
            )}
          </button>
          <button
            onClick={executarRestauracaoPagamentos}
            disabled={isRestaurando}
            className={`${
              isRestaurando ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
            } text-white px-4 py-2 rounded-md transition-colors flex items-center hidden`}
          >
            {isRestaurando ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Restaurando...
              </>
            ) : (
              "Restaurar Pagamentos Excluídos"
            )}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Período
          </label>
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="todos">Todos</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Último mês</option>
          </select>
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
            <option value="approved">Aprovado</option>
            <option value="pending">Pendente</option>
            <option value="rejected">Rejeitado</option>
            <option value="cancelled">Cancelado</option>
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
            placeholder="ID, cliente, descrição..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Lista de pagamentos */}
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : pagamentosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum pagamento encontrado.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data
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
              {pagamentosFiltrados.map((pagamento) => (
                <tr key={pagamento.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pagamento.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagamento.formattedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium text-gray-900">
                      {pagamento.clientName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {pagamento.clientPhone}
                    </div>
                    {pagamento.appointmentId && (
                      <div className="text-xs text-green-500 mt-1">
                        ✓ Agendamento vinculado
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagamento.service || pagamento.description}
                    {pagamento.appointmentDate && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(
                          pagamento.appointmentDate
                        ).toLocaleDateString()}{" "}
                        às {pagamento.appointmentTime}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagamento.formattedAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pagamento.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : pagamento.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {pagamento.statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/pagamentos/${pagamento.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Detalhes
                      </Link>
                      <button
                        onClick={() =>
                          confirmarExclusao(
                            pagamento.id,
                            pagamento.clientName || "Cliente não identificado"
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

      {/* Modal de confirmação de exclusão */}
      {confirmExclusao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-4">Confirmar exclusão</h3>
            <p className="mb-4">
              Tem certeza que deseja excluir o pagamento do cliente{" "}
              <span className="font-semibold">{confirmExclusao.descricao}</span>
              ?
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

      {/* Modal de confirmação de exclusão forçada */}
      {confirmForcaExclusao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-4">Forçar exclusão</h3>
            <p className="mb-4">
              A exclusão normal falhou. Deseja tentar uma exclusão forçada do
              pagamento{" "}
              <span className="font-semibold">
                {confirmForcaExclusao.descricao}
              </span>
              ?
            </p>
            <p className="mb-4 text-amber-600">
              <strong>Atenção:</strong> Esta operação tentará remover o registro
              mesmo que esteja corrompido.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelarExclusaoForcada}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={forcarExclusao}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Forçar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
