import React, { useEffect, useState, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "react-toastify";
import api from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Defina a interface para os dados do agendamento se ainda não tiver
interface Agendamento {
  id: string;
  horario: string;
  // Adicione outros campos se necessário
}

const BookingPage = () => {
  // Removidos os estados expedienteAberto e horarioAlmoco
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false); // Renomeado de loadingConfig
  // Removido o estado loadingConfig se não for mais usado

  // Horários padrão de funcionamento (exemplo) - MANTIDO
  const horariosPadroes: string[] = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  // Função para buscar horários ocupados da API - AJUSTADA
  const buscarHorariosOcupados = useCallback(async (data: Date) => {
    if (!data) return;

    setLoadingHorarios(true);
    setHorariosOcupados([]);
    const dataFormatada = format(data, "yyyy-MM-dd");
    console.log(`Buscando horários ocupados para ${dataFormatada}...`);

    try {
      // Usando a rota /api/agendamentos ou /api/disponibilidade (ajuste conforme necessário)
      const response = await api.get<{ horario: string }[]>(
        `/api/agendamentos?data=${dataFormatada}`
      );
      // Ou se implementou /api/disponibilidade:
      // const response = await api.get<{ horariosOcupados: string[] }>(`/api/disponibilidade?data=${dataFormatada}`);
      // const ocupados = response.data.horariosOcupados;

      const ocupados = response.data.map(
        (ag: { horario: string }) => ag.horario
      );
      setHorariosOcupados(ocupados);
      console.log(
        `Horários ocupados recebidos para ${dataFormatada}:`,
        ocupados
      );
    } catch (error: any) {
      console.error("Erro ao carregar horários ocupados:", error);
      toast.error(
        `Erro ao buscar horários para ${dataFormatada}. Tente novamente. (${
          error.message || "Erro desconhecido"
        })`
      );
      setHorariosOcupados([]);
    } finally {
      setLoadingHorarios(false);
    }
  }, []); // useCallback para evitar recriação desnecessária

  // Efeito para buscar horários quando a data selecionada muda - MANTIDO
  useEffect(() => {
    if (selectedDate) {
      buscarHorariosOcupados(selectedDate);
    }
  }, [selectedDate, buscarHorariosOcupados]);

  // Efeito para calcular horários disponíveis - AJUSTADO
  useEffect(() => {
    // A filtragem não depende mais de horarioAlmoco
    const disponiveis = horariosPadroes.filter(
      (horario) => !horariosOcupados.includes(horario)
    );
    setHorariosDisponiveis(disponiveis);
  }, [horariosOcupados, horariosPadroes]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Função para lidar com a seleção de horário (exemplo) - MANTIDO
  const handleHorarioSelect = (horario: string) => {
    if (!selectedDate) return;
    const dataFormatada = format(selectedDate, "yyyy-MM-dd");
    console.log(`Horário selecionado: ${horario} para ${dataFormatada}`);
    toast.info(
      `Você selecionou ${horario} em ${format(selectedDate, "dd/MM/yyyy")}`
    );
    // Continuar fluxo de agendamento...
  };

  // Removido o bloco if (!expedienteAberto)

  // O return agora não tem mais a verificação de expediente
  return (
    <div className="booking-page container mx-auto p-4 flex flex-col md:flex-row gap-8">
      <div className="calendar-container">
        <h2 className="text-xl font-semibold mb-4">Selecione a Data</h2>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={ptBR}
          // disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </div>

      <div className="time-slots-container flex-1">
        <h2 className="text-xl font-semibold mb-4">
          {selectedDate
            ? `Horários Disponíveis para ${format(selectedDate, "dd/MM/yyyy", {
                locale: ptBR,
              })}`
            : "Selecione uma data para ver os horários"}
        </h2>
        {loadingHorarios ? (
          <p>Carregando horários...</p>
        ) : selectedDate ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {horariosDisponiveis.length > 0 ? (
              horariosDisponiveis.map((horario) => (
                <button
                  key={horario}
                  onClick={() => handleHorarioSelect(horario)}
                  className="p-2 border rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-center"
                >
                  {horario}
                </button>
              ))
            ) : (
              <p>Nenhum horário disponível para esta data.</p>
            )}
          </div>
        ) : (
          <p>Selecione uma data no calendário.</p>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
