import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { db } from "../../config/firebase";
import { Appointment } from "../../data/appointments";

export default function LimpezaDados() {
  const [loading, setLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [duplicados, setDuplicados] = useState<Record<string, Appointment[]>>(
    {}
  );
  const [total, setTotal] = useState(0);

  // Função para carregar todos os agendamentos diretamente do Firestore
  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const agendamentosRef = collection(db, "agendamentos");
      const querySnapshot = await getDocs(agendamentosRef);

      console.log(
        `Encontrados ${querySnapshot.size} documentos na coleção "agendamentos"`
      );

      const listaAgendamentos: Appointment[] = [];

      querySnapshot.forEach((doc) => {
        // Extrair dados do documento
        const data = doc.data();

        // Criar objeto completo com ID do documento
        const agendamento: Appointment = {
          ...(data as any),
          id: doc.id, // Sempre usar o ID do documento
          docId: doc.id, // Guardar o ID do documento separadamente
        };

        listaAgendamentos.push(agendamento);
      });

      setAgendamentos(listaAgendamentos);
      setTotal(listaAgendamentos.length);

      // Procurar duplicados
      encontrarDuplicados(listaAgendamentos);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  // Função para encontrar agendamentos duplicados (mesma data/horário ou mesmo cliente/data)
  const encontrarDuplicados = (lista: Appointment[]) => {
    const porDataHorario: Record<string, Appointment[]> = {};
    const duplicadosEncontrados: Record<string, Appointment[]> = {};

    // Agrupar por data+horário
    lista.forEach((agendamento) => {
      const key = `${agendamento.data}|${agendamento.horario}`;

      if (!porDataHorario[key]) {
        porDataHorario[key] = [];
      }

      porDataHorario[key].push(agendamento);
    });

    // Identificar grupos com mais de um agendamento
    for (const [key, grupo] of Object.entries(porDataHorario)) {
      if (grupo.length > 1) {
        duplicadosEncontrados[key] = grupo;
      }
    }

    setDuplicados(duplicadosEncontrados);

    console.log("Duplicados encontrados:", duplicadosEncontrados);
    console.log(
      "Total de grupos com duplicados:",
      Object.keys(duplicadosEncontrados).length
    );
  };

  // Função para remover agendamentos duplicados
  const limparDuplicados = async () => {
    if (isCleaning) return;

    // Confirmar antes de prosseguir
    if (
      !window.confirm(
        "Tem certeza que deseja remover os agendamentos duplicados? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setIsCleaning(true);

    try {
      let removidos = 0;

      // Para cada grupo de duplicados
      for (const [key, grupo] of Object.entries(duplicados)) {
        // Se houver mais de um agendamento no grupo
        if (grupo.length > 1) {
          // Manter o primeiro (geralmente o mais antigo/original) e remover os outros
          const [manter, ...remover] = grupo;

          console.log(
            `Grupo ${key}: mantendo ${manter.id}, removendo ${remover.length} duplicados`
          );

          // Remover os duplicados
          for (const agendamento of remover) {
            if (agendamento.docId) {
              await deleteDoc(doc(db, "agendamentos", agendamento.docId));
              removidos++;
            }
          }
        }
      }

      toast.success(
        `${removidos} agendamentos duplicados removidos com sucesso!`
      );

      // Recarregar dados
      await carregarAgendamentos();
    } catch (error) {
      console.error("Erro ao limpar duplicados:", error);
      toast.error("Erro ao remover agendamentos duplicados");
    } finally {
      setIsCleaning(false);
    }
  };

  // Nova função para excluir todos os agendamentos
  const excluirTodosAgendamentos = async () => {
    if (
      !window.confirm(
        "ATENÇÃO: Isso irá EXCLUIR TODOS os agendamentos do banco de dados. Esta ação NÃO PODE ser desfeita. Tem certeza absoluta?"
      )
    ) {
      return;
    }

    // Confirmação adicional
    if (
      !window.confirm(
        "CONFIRMAÇÃO FINAL: Você está prestes a excluir PERMANENTEMENTE todos os agendamentos. Digite 'CONFIRMAR' na caixa de diálogo seguinte para prosseguir."
      )
    ) {
      return;
    }

    const confirmacao = prompt("Digite 'CONFIRMAR' para prosseguir:");
    if (confirmacao !== "CONFIRMAR") {
      toast.info("Operação cancelada pelo usuário");
      return;
    }

    setLoading(true);

    try {
      const agendamentosRef = collection(db, "agendamentos");
      const querySnapshot = await getDocs(agendamentosRef);

      let deletados = 0;

      // Excluir cada documento
      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, "agendamentos", document.id));
        deletados++;
      }

      toast.success(`${deletados} agendamentos foram excluídos com sucesso!`);

      // Recarregar a lista vazia
      await carregarAgendamentos();
    } catch (error) {
      console.error("Erro ao excluir todos os agendamentos:", error);
      toast.error("Erro ao excluir todos os agendamentos");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarAgendamentos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Limpeza de Dados</h1>
        <p className="mb-4 text-gray-600">
          Use esta ferramenta para identificar e remover dados duplicados ou
          problemáticos no banco de dados.
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={carregarAgendamentos}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${
            loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Carregando..." : "Verificar Agendamentos"}
        </button>

        <button
          onClick={limparDuplicados}
          disabled={isCleaning || Object.keys(duplicados).length === 0}
          className={`px-4 py-2 rounded-md text-white ${
            isCleaning || Object.keys(duplicados).length === 0
              ? "bg-gray-400"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isCleaning ? "Limpando..." : "Remover Duplicados"}
        </button>

        {/* Novo botão para excluir todos os agendamentos */}
        <button
          onClick={excluirTodosAgendamentos}
          disabled={loading || agendamentos.length === 0}
          className={`px-4 py-2 rounded-md text-white ${
            loading || agendamentos.length === 0
              ? "bg-gray-400"
              : "bg-red-700 hover:bg-red-800"
          }`}
        >
          Excluir Todos os Agendamentos
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Resumo</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-gray-600">Total de Agendamentos</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>

          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-gray-600">Grupos com Duplicados</p>
            <p className="text-2xl font-bold">
              {Object.keys(duplicados).length}
            </p>
          </div>

          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-gray-600">Total de Duplicados</p>
            <p className="text-2xl font-bold">
              {Object.values(duplicados).reduce(
                (acc, grupo) => acc + (grupo.length - 1),
                0
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de duplicados */}
      {Object.keys(duplicados).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Agendamentos Duplicados</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Horário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(duplicados).map(([key, grupo]) => {
                  const [data, horario] = key.split("|");
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(data).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-sm text-gray-500">{horario}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {grupo.length} agendamentos
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {grupo.map((a, i) => (
                            <div
                              key={i}
                              className={`mb-2 p-2 rounded ${
                                i === 0 ? "bg-green-50" : "bg-red-50"
                              }`}
                            >
                              <div>
                                <span className="font-medium">ID:</span> {a.id}
                                {i === 0 && " (Será mantido)"}
                              </div>
                              <div>
                                <span className="font-medium">Cliente:</span>{" "}
                                {a.cliente?.nome || "Sem nome"}
                              </div>
                              <div>
                                <span className="font-medium">Serviço:</span>{" "}
                                {a.servico}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>{" "}
                                {a.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
