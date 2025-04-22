import React, { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import { toast } from "react-toastify";
import { servicos, Service } from "../../data/services"; // Ajuste o caminho
import {
  getConfirmedAppointmentsByDate, // Precisamos criar esta função
  createAppointment,
} from "../../services/appointments"; // Ajuste o caminho
import { NormalizedAppointment } from "../../types/appointment";

dayjs.extend(utc);
dayjs.locale("pt-br");

// Função para gerar horários (ex: de 15 em 15 minutos)
const generateTimeSlots = (
  startHour: number,
  endHour: number,
  intervalMinutes: number
): string[] => {
  const slots: string[] = [];
  let currentTime = dayjs().utc().hour(startHour).minute(0).second(0);
  const endTime = dayjs().utc().hour(endHour).minute(0).second(0);

  while (currentTime.isBefore(endTime)) {
    slots.push(currentTime.format("HH:mm"));
    currentTime = currentTime.add(intervalMinutes, "minute");
  }
  return slots;
};

export default function NovoAgendamento() {
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servicoSelecionado, setServicoSelecionado] = useState<Service | null>(
    null
  );
  const [dataSelecionada, setDataSelecionada] = useState(
    dayjs().utc().startOf("day")
  );
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("agendado"); // Padrão

  // Estados de controle
  const [horariosOcupadosConfirmados, setHorariosOcupadosConfirmados] =
    useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTimes, setIsFetchingTimes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gera todos os slots possíveis (7:00 às 21:00, de 15 em 15 min)
  const allPossibleSlots = useMemo(
    () => generateTimeSlots(7, 21, 15),
    [] // Executa apenas uma vez
  );

  // Busca horários confirmados quando a data muda
  const fetchOccupiedTimes = useCallback(async (date: dayjs.Dayjs) => {
    setIsFetchingTimes(true);
    setError(null);
    try {
      const dateStr = date.format("YYYY-MM-DD");
      console.log(
        `[Novo Agendamento] Buscando horários confirmados para ${dateStr}`
      );
      const appointments = await getConfirmedAppointmentsByDate(dateStr); // <<< USA A NOVA FUNÇÃO
      const occupiedTimes = appointments.map((app) => app.time);
      setHorariosOcupadosConfirmados(occupiedTimes);
      console.log(
        `[Novo Agendamento] Horários confirmados encontrados:`,
        occupiedTimes
      );
    } catch (err) {
      console.error(
        "[Novo Agendamento] Erro ao buscar horários ocupados:",
        err
      );
      setError("Falha ao buscar horários ocupados.");
      setHorariosOcupadosConfirmados([]); // Limpa em caso de erro
    } finally {
      setIsFetchingTimes(false);
    }
  }, []);

  useEffect(() => {
    fetchOccupiedTimes(dataSelecionada);
  }, [dataSelecionada, fetchOccupiedTimes]);

  // Filtra os slots disponíveis
  const horariosDisponiveis = useMemo(() => {
    return allPossibleSlots.filter(
      (slot) => !horariosOcupadosConfirmados.includes(slot)
    );
  }, [allPossibleSlots, horariosOcupadosConfirmados]);

  // Limpa horário selecionado se ele ficar indisponível
  useEffect(() => {
    if (
      horarioSelecionado &&
      !horariosDisponiveis.includes(horarioSelecionado)
    ) {
      setHorarioSelecionado(""); // Reseta se o horário atual não está mais disponível
    }
  }, [horariosDisponiveis, horarioSelecionado]);

  // Handler para submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !nome ||
      !telefone ||
      !servicoSelecionado ||
      !dataSelecionada ||
      !horarioSelecionado ||
      !statusSelecionado
    ) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsLoading(true);

    const appointmentData: Partial<NormalizedAppointment> = {
      clientName: nome,
      clientPhone: telefone,
      service: servicoSelecionado.nome,
      price: servicoSelecionado.preco,
      date: dataSelecionada.format("YYYY-MM-DD"),
      time: horarioSelecionado,
      status: statusSelecionado,
      // 'confirmado' será definido no backend baseado no status
    };

    try {
      console.log("[Novo Agendamento] Enviando dados:", appointmentData);
      const novoAgendamento = await createAppointment(appointmentData);
      toast.success(
        `Agendamento para ${novoAgendamento.clientName} criado com sucesso!`
      );
      // Limpar formulário após sucesso
      setNome("");
      setTelefone("");
      setServicoSelecionado(null);
      // setDataSelecionada(dayjs().utc().startOf('day')); // Opcional: resetar data
      setHorarioSelecionado("");
      setStatusSelecionado("agendado");
      // Rebuscar horários para atualizar a lista (caso a data não mude)
      fetchOccupiedTimes(dataSelecionada);
    } catch (err: any) {
      console.error("[Novo Agendamento] Erro ao criar agendamento:", err);
      setError(
        `Falha ao criar agendamento: ${
          err.response?.data?.message || err.message || "Erro desconhecido"
        }`
      );
      toast.error("Erro ao criar agendamento.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Adicionar Novo Agendamento Manual
      </h1>

      {error && <p className="text-red-600 bg-red-100 p-3 rounded">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow space-y-4"
      >
        {/* Nome e Telefone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome do Cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label
              htmlFor="telefone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Telefone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel" // Usar 'tel' para melhor semântica e UX mobile
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
              placeholder="(XX) XXXXX-XXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Serviço */}
        <div>
          <label
            htmlFor="servico"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Serviço <span className="text-red-500">*</span>
          </label>
          <select
            id="servico"
            value={servicoSelecionado?.nome || ""}
            onChange={(e) => {
              const selected = servicos.find((s) => s.nome === e.target.value);
              setServicoSelecionado(selected || null);
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            <option value="" disabled>
              Selecione um serviço
            </option>
            {servicos.map((s) => (
              <option key={s.nome} value={s.nome}>
                {s.nome} (R$ {s.preco.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Data e Horário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="data"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="data"
              value={dataSelecionada.format("YYYY-MM-DD")}
              onChange={(e) =>
                setDataSelecionada(dayjs.utc(e.target.value).startOf("day"))
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label
              htmlFor="horario"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Horário <span className="text-red-500">*</span>
            </label>
            <select
              id="horario"
              value={horarioSelecionado}
              onChange={(e) => setHorarioSelecionado(e.target.value)}
              required
              disabled={isFetchingTimes}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white disabled:bg-gray-100"
            >
              <option value="" disabled>
                {isFetchingTimes
                  ? "Carregando horários..."
                  : "Selecione um horário"}
              </option>
              {horariosDisponiveis.length > 0 ? (
                horariosDisponiveis.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {isFetchingTimes ? "..." : "Nenhum horário disponível"}
                </option>
              )}
            </select>
            {isFetchingTimes && (
              <div className="text-xs text-gray-500 mt-1">
                Verificando disponibilidade...
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            value={statusSelecionado}
            onChange={(e) => setStatusSelecionado(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white"
          >
            {/* Adicione os status relevantes que você usa */}
            <option value="confirmado">Confirmado</option>
            <option value="aguardando pagamento">Aguardando Pagamento</option>
          </select>
        </div>

        {/* Botão de Submissão */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || isFetchingTimes}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            ) : (
              "Adicionar Agendamento"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
