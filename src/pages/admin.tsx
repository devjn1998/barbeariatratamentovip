import { useState, useEffect } from "react";
import { Appointment, getAgendamentosPorData } from "../data/appointments";

export default function PaginaAdmin() {
  const [dataFiltro, setDataFiltro] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarAgendamentos() {
      try {
        setLoading(true);
        const dados = await getAgendamentosPorData(dataFiltro);
        setAgendamentos(dados);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        alert("Erro ao carregar os agendamentos.");
      } finally {
        setLoading(false);
      }
    }

    carregarAgendamentos();
  }, [dataFiltro]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8">
        Painel Administrativo
      </h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filtrar por Data
        </label>
        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          className="p-2 border rounded-lg"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agendamentos.map((agendamento) => (
                <tr key={agendamento.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {agendamento.horario}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {agendamento.cliente.nome}
                    </div>
                    <div className="text-sm text-gray-500">
                      {agendamento.cliente.telefone}
                    </div>
                  </td>
                  <td className="px-6 py-4">{agendamento.servico}</td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    R$ {agendamento.preco.toFixed(2)}
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
