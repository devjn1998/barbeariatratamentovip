import { useEffect, useState } from "react";

// Adicionar as importações necessárias para transformar o arquivo em um módulo

// Função para verificar disponibilidade de horário
export const verificarDisponibilidade = async (
  data: string,
  horario: string
): Promise<boolean> => {
  try {
    console.log(`🔍 Verificando disponibilidade para ${data} às ${horario}...`);

    // Buscar agendamentos para esta data
    const response = await fetch(
      `/api/disponibilidade?data=${data}&horario=${horario}`
    );

    if (!response.ok) {
      throw new Error("Erro ao verificar disponibilidade");
    }

    const resultado = await response.json();
    console.log(`📅 Resultado da verificação:`, resultado);

    return resultado.disponivel;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    return false; // Em caso de erro, considerar indisponível por precaução
  }
};

// Função para obter todos os horários ocupados em uma data
export const obterHorariosOcupados = async (
  data: string
): Promise<string[]> => {
  try {
    // Usar a mesma rota de disponibilidade, mas sem especificar horário
    const response = await fetch(`/api/disponibilidade?data=${data}`);

    if (!response.ok) {
      throw new Error("Erro ao obter horários ocupados");
    }

    const resultado = await response.json();
    console.log(`📅 Horários ocupados em ${data}:`, resultado.horariosOcupados);

    return resultado.horariosOcupados || [];
  } catch (error) {
    console.error("Erro ao obter horários ocupados:", error);
    return [];
  }
};

// Componente principal da página
export default function BookPage() {
  const [dataSelecionada, setDataSelecionada] = useState<string>("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);

  // Lista de todos os horários possíveis
  const TODOS_HORARIOS = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  // Efeito para carregar horários disponíveis quando a data mudar
  useEffect(() => {
    async function carregarHorarios() {
      if (!dataSelecionada) return;

      setCarregando(true);
      try {
        // Buscar horários ocupados para a data selecionada
        const ocupados = await obterHorariosOcupados(dataSelecionada);
        setHorariosOcupados(ocupados);

        // Filtrar apenas os horários disponíveis
        const disponiveis = TODOS_HORARIOS.filter(
          (horario) => !ocupados.includes(horario)
        );

        setHorariosDisponiveis(disponiveis);
        console.log(`✅ Disponíveis: ${disponiveis.join(", ")}`);
        console.log(`❌ Ocupados: ${ocupados.join(", ")}`);
      } catch (error) {
        console.error("Erro ao carregar horários:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarHorarios();
  }, [dataSelecionada]);

  // Renderização do componente
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Agendar Serviço</h1>

      {/* Interface para seleção de data e horário */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Selecione uma data:</label>
        <input
          type="date"
          className="border p-2 rounded w-full max-w-md"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      {dataSelecionada && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Horários disponíveis:</h2>

          {carregando ? (
            <p>Carregando horários...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {horariosDisponiveis.length === 0 ? (
                <p className="col-span-4 text-red-500">
                  Não há horários disponíveis para esta data.
                </p>
              ) : (
                horariosDisponiveis.map((horario) => (
                  <button
                    key={horario}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => {
                      // Lógica para seleção de horário e prosseguimento
                      console.log(
                        `Selecionado: ${dataSelecionada} às ${horario}`
                      );
                    }}
                  >
                    {horario}
                  </button>
                ))
              )}
            </div>
          )}

          {horariosOcupados.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">
                Horários já reservados:
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {horariosOcupados.map((horario) => (
                  <span
                    key={horario}
                    className="px-2 py-1 bg-gray-200 text-gray-600 text-sm rounded"
                  >
                    {horario}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
