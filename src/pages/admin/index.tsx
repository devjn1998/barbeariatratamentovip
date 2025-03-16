import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listarPagamentos } from "../../services/payment";
import { NormalizedPayment } from "../../types/payment";

export default function PaginaAdmin() {
  const [pagamentos, setPagamentos] = useState<NormalizedPayment[]>([]);
  const [filteredPagamentos, setFilteredPagamentos] = useState<
    NormalizedPayment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [dataFiltro, setDataFiltro] = useState<string>("");

  useEffect(() => {
    const carregarPagamentos = async () => {
      try {
        const data = await listarPagamentos();
        setPagamentos(data);
        setFilteredPagamentos(data);
      } catch (error) {
        toast.error("Erro ao carregar pagamentos");
      } finally {
        setLoading(false);
      }
    };

    carregarPagamentos();

    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarPagamentos, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar pagamentos por data
  useEffect(() => {
    if (!dataFiltro) {
      setFilteredPagamentos(pagamentos);
      return;
    }

    const filtered = pagamentos.filter((pagamento) => {
      const dataPagamento = new Date(pagamento.dateCreated)
        .toISOString()
        .split("T")[0];
      return dataPagamento === dataFiltro;
    });

    setFilteredPagamentos(filtered);
  }, [dataFiltro, pagamentos]);

  if (loading) {
    return (
      <div className="p-8">
        <p>Carregando pagamentos...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pagamentos Recebidos</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por data:
        </label>
        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        />
        {dataFiltro && (
          <button
            onClick={() => setDataFiltro("")}
            className="ml-2 text-blue-600 hover:underline"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {filteredPagamentos.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          {dataFiltro
            ? `Nenhum pagamento encontrado para a data ${dataFiltro}`
            : "Nenhum pagamento registrado"}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPagamentos.map((pagamento) => (
                <tr key={pagamento.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagamento.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pagamento.dateCreated).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R$ {pagamento.transactionAmount?.toFixed(2) || "0.00"}
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
                      {pagamento.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pagamento.clientEmail || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
