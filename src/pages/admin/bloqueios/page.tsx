import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../config/firebase"; // Ajuste o caminho se necessário
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import { toast } from "react-toastify"; // Para feedback

dayjs.extend(utc);
dayjs.locale("pt-br");

// --- Definições de Tipos ---
interface Bloqueio {
  id: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
}

interface AgendamentoConfirmado {
  id: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
  clientName?: string; // Opcional: nome do cliente
}

// --- Componente ---
export default function AdminBloqueiosPage() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().utc().startOf("day")
  );
  const [bloqueiosManuais, setBloqueiosManuais] = useState<Bloqueio[]>([]);
  const [agendamentosConfirmados, setAgendamentosConfirmados] = useState<
    AgendamentoConfirmado[]
  >([]); // NOVO ESTADO
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Horários Disponíveis (Exemplo) ---
  const horariosDisponiveis = useMemo(() => {
    const horarios = [];
    for (let hour = 7; hour <= 21; hour++) {
      if (hour === 13) continue; // Pular horário de almoço (exemplo)
      horarios.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return horarios;
  }, []);

  // --- Função para buscar dados (Bloqueios e Agendamentos Confirmados) ---
  const fetchData = async (date: dayjs.Dayjs) => {
    setIsLoading(true);
    setError(null);
    const dateStr = date.format("YYYY-MM-DD");
    console.log(`[Bloqueios Page] Buscando dados para ${dateStr}`);

    try {
      // Buscar bloqueios manuais
      const bloqueiosQuery = query(
        collection(db, "bloqueios"),
        where("date", "==", dateStr)
      );

      // Buscar agendamentos confirmados (usando 'confirmado' == true)
      const agendamentosDateQuery = query(
        collection(db, "agendamentos"),
        where("date", "==", dateStr),
        where("confirmado", "==", true) // <<< FILTRO
      );
      const agendamentosDataQuery = query(
        collection(db, "agendamentos"),
        where("data", "==", dateStr), // <<< FILTRO LEGADO
        where("confirmado", "==", true) // <<< FILTRO
      );

      const [
        bloqueiosSnapshot,
        agendamentosDateSnapshot,
        agendamentosDataSnapshot,
      ] = await Promise.all([
        getDocs(bloqueiosQuery),
        getDocs(agendamentosDateSnapshot),
        getDocs(agendamentosDataQuery),
      ]);

      // Processar bloqueios manuais
      const bloqueiosData = bloqueiosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as { date: string; time: string }),
      }));
      console.log("[Bloqueios Page] Bloqueios manuais:", bloqueiosData);
      setBloqueiosManuais(bloqueiosData);

      // Processar e combinar agendamentos confirmados
      const agendamentosDocs = [
        ...agendamentosDateSnapshot.docs,
        ...agendamentosDataSnapshot.docs,
      ].filter(
        (doc, index, self) => index === self.findIndex((d) => d.id === doc.id)
      ); // Remover duplicatas

      const agendamentosData = agendamentosDocs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date || data.data,
          time: data.time || data.horario,
          clientName: data.clientName || data.cliente?.nome || "Cliente", // Pegar nome do cliente
        };
      });
      console.log(
        "[Bloqueios Page] Agendamentos confirmados:",
        agendamentosData
      );
      setAgendamentosConfirmados(agendamentosData); // <<< Armazena no estado
    } catch (err) {
      console.error("[Bloqueios Page] Erro ao buscar dados:", err);
      setError("Falha ao carregar os dados. Tente novamente.");
      toast.error("Erro ao carregar dados de bloqueios e agendamentos.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Efeito para buscar dados quando a data muda ---
  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  // --- Funções para bloquear/desbloquear MANUALMENTE ---
  const handleBlockSlot = async (time: string) => {
    // Verifica se já existe agendamento confirmado para não bloquear manualmente por cima
    const isBooked = agendamentosConfirmados.some((a) => a.time === time);
    if (isBooked) {
      toast.info(
        "Este horário já está bloqueado por um agendamento confirmado."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    const dateStr = selectedDate.format("YYYY-MM-DD");
    try {
      await addDoc(collection(db, "bloqueios"), {
        date: dateStr,
        time: time,
        createdAt: Timestamp.now(), // Adiciona timestamp de criação
      });
      toast.success(`Horário ${time} bloqueado manualmente.`);
      await fetchData(selectedDate); // Rebusca os dados
    } catch (err) {
      console.error("[Bloqueios Page] Erro ao bloquear horário:", err);
      setError("Falha ao bloquear o horário. Tente novamente.");
      toast.error("Erro ao bloquear horário.");
      setIsLoading(false);
    }
  };

  const handleUnblockSlot = async (time: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const bloqueioParaRemover = bloqueiosManuais.find((b) => b.time === time);
      if (!bloqueioParaRemover) {
        // Isso não deveria acontecer se o botão só aparece para bloqueios manuais
        toast.error("Bloqueio manual não encontrado para remoção.");
        setIsLoading(false);
        return;
      }

      await deleteDoc(doc(db, "bloqueios", bloqueioParaRemover.id));
      toast.success(`Bloqueio manual das ${time} removido.`);
      await fetchData(selectedDate); // Rebusca os dados
    } catch (err) {
      console.error("[Bloqueios Page] Erro ao desbloquear horário:", err);
      setError("Falha ao desbloquear o horário.");
      toast.error("Erro ao remover bloqueio manual.");
      setIsLoading(false);
    }
  };

  // --- Renderização ---
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Gerenciar Bloqueios Manuais</h1>
      <div className="bg-white p-4 rounded shadow">
        <label htmlFor="date-picker" className="mr-2 font-medium">
          Selecionar Data:
        </label>
        <input
          type="date"
          id="date-picker"
          className="border rounded p-1"
          value={selectedDate.format("YYYY-MM-DD")}
          onChange={
            (e) => setSelectedDate(dayjs.utc(e.target.value).startOf("day")) // Usar UTC na seleção
          }
        />
      </div>

      {error && <p className="text-red-600 bg-red-100 p-2 rounded">{error}</p>}

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">
          Horários para {selectedDate.format("DD/MM/YYYY")}
        </h2>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {horariosDisponiveis.map((time) => {
              const bloqueioManual = bloqueiosManuais.find(
                (b) => b.time === time
              );
              const agendamentoConfirmado = agendamentosConfirmados.find(
                (a) => a.time === time
              );

              const isManuallyBlocked = !!bloqueioManual;
              const isBooked = !!agendamentoConfirmado;

              return (
                <li
                  key={time}
                  className="flex items-center justify-between p-2 border-b last:border-b-0"
                >
                  <span className="font-medium">{time}</span>
                  <div className="flex items-center gap-2">
                    {isBooked ? (
                      <span className="text-sm font-semibold text-orange-600">
                        (Agendado: {agendamentoConfirmado.clientName})
                      </span>
                    ) : isManuallyBlocked ? (
                      <>
                        <span className="text-sm font-semibold text-red-600">
                          (Bloqueado Manualmente)
                        </span>
                        <button
                          onClick={() => handleUnblockSlot(time)}
                          disabled={isLoading}
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded disabled:opacity-50"
                        >
                          Desbloquear
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleBlockSlot(time)}
                        disabled={isLoading}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
                      >
                        Bloquear Manualmente
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
