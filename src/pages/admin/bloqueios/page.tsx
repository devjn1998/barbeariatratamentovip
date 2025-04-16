import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "../../../config/firebase"; // Ajuste o caminho se necessário
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp, // Importante para lidar com datas no Firestore
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc"; // Usar UTC para consistência

dayjs.extend(utc);
dayjs.locale("pt-br");

// --- Definições de Tipos (Ajuste conforme sua estrutura) ---
interface Bloqueio {
  id: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
}

interface AgendamentoConfirmado {
  id: string;
  date: string; // Formato YYYY-MM-DD
  time: string; // Formato HH:mm
}

// --- Componente ---
export default function AdminBloqueiosPage() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().utc().startOf("day")
  );
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [agendamentosConfirmados, setAgendamentosConfirmados] = useState<
    AgendamentoConfirmado[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Horários Disponíveis (Exemplo - ajuste conforme sua lógica) ---
  const horariosDisponiveis = useMemo(() => {
    // Gere sua lista de horários padrão aqui
    // Exemplo: ['09:00', '10:00', ..., '17:00']
    const horarios = [];
    for (let hour = 7; hour <= 21; hour++) {
      // Adicione lógica para intervalos, almoço, etc., se necessário
      horarios.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return horarios;
  }, []);

  // --- Função para buscar dados ---
  const fetchData = async (date: dayjs.Dayjs) => {
    setIsLoading(true);
    setError(null);
    const dateStr = date.format("YYYY-MM-DD");

    try {
      // Buscar bloqueios manuais
      const bloqueiosQuery = query(
        collection(db, "bloqueios"),
        where("date", "==", dateStr)
      );
      const bloqueiosSnapshot = await getDocs(bloqueiosQuery);
      const bloqueiosData = bloqueiosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as { date: string; time: string }),
      }));
      console.log("Dados de bloqueios lidos em fetchData:", bloqueiosData);
      setBloqueios(bloqueiosData);

      // Buscar agendamentos confirmados
      const agendamentosQuery = query(
        collection(db, "agendamentos"),
        where("date", "==", dateStr),
        where("status", "==", "confirmado") // <<< Busca agendamentos confirmados
      );
      const agendamentosSnapshot = await getDocs(agendamentosQuery);
      const agendamentosData = agendamentosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as { date: string; time: string }),
      }));
      console.log(
        "Dados de agendamentos lidos em fetchData (para /admin/bloqueios):", // Log específico
        agendamentosData
      );
      setAgendamentosConfirmados(agendamentosData); // <<< Armazena no estado
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Falha ao carregar os dados. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Efeito para buscar dados quando a data muda ---
  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  // --- Funções para bloquear/desbloquear ---
  const handleBlockSlot = async (time: string) => {
    setIsLoading(true);
    setError(null); // Limpa erros anteriores

    // --- VERIFICAÇÃO DE AUTENTICAÇÃO NO CLIENTE ---
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("Usuário não autenticado no cliente ao tentar bloquear.");
      setError("Erro: Usuário não autenticado. Faça login novamente.");
      setIsLoading(false);
      alert("Sua sessão pode ter expirado. Por favor, faça login novamente."); // Alerta para o usuário
      // Opcional: redirecionar para a página de login
      // window.location.href = '/admin/login';
      return;
    }
    // --- Fim da verificação ---

    console.log("Usuário autenticado no cliente:", currentUser.uid); // Log para confirmar

    const dateStr = selectedDate.format("YYYY-MM-DD");
    try {
      const isBlocked = bloqueios.some((b) => b.time === time);
      const isBooked = agendamentosConfirmados.some((a) => a.time === time);

      if (isBlocked || isBooked) {
        alert("Este horário já está ocupado ou bloqueado.");
        setIsLoading(false);
        return;
      }

      console.log(
        `Tentando adicionar bloqueio: { date: ${dateStr}, time: ${time} }`
      ); // Log dos dados
      await addDoc(collection(db, "bloqueios"), {
        date: dateStr,
        time: time,
      });
      console.log("Bloqueio adicionado com sucesso."); // Log de sucesso
      await fetchData(selectedDate); // Rebusca dados
    } catch (err) {
      console.error("Erro ao bloquear horário:", err); // Mantém o log do erro original
      // Tenta dar uma mensagem mais específica se for erro de permissão
      if (err instanceof Error && err.message.includes("permission")) {
        setError(
          "Falha ao bloquear: Permissões insuficientes. Verifique as regras do Firestore e o status de login."
        );
      } else {
        setError("Falha ao bloquear o horário. Tente novamente.");
      }
      setIsLoading(false);
    }
  };

  const handleUnblockSlot = async (time: string) => {
    setIsLoading(true);
    try {
      const bloqueioParaRemover = bloqueios.find((b) => b.time === time);
      if (!bloqueioParaRemover) {
        alert("Bloqueio não encontrado.");
        setIsLoading(false);
        return;
      }

      await deleteDoc(doc(db, "bloqueios", bloqueioParaRemover.id));
      // Rebusca os dados para atualizar a UI
      await fetchData(selectedDate);
    } catch (err) {
      console.error("Erro ao desbloquear horário:", err);
      setError("Falha ao desbloquear o horário.");
      setIsLoading(false); // Garante que o loading termine em caso de erro
    }
  };

  console.log("Renderizando AdminBloqueiosPage com bloqueios:", bloqueios); // <-- Adicionar Log
  console.log(
    "Renderizando AdminBloqueiosPage com agendamentos:",
    agendamentosConfirmados
  ); // <-- Adicionar Log

  // --- Renderização ---
  return (
    <div>
      <h1>Gerenciar Bloqueios Manuais</h1>
      <div>
        <label htmlFor="date-picker">Selecionar Data: </label>
        <input
          type="date"
          id="date-picker"
          value={selectedDate.format("YYYY-MM-DD")}
          onChange={(e) =>
            setSelectedDate(dayjs(e.target.value).utc().startOf("day"))
          }
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Horários para {selectedDate.format("DD/MM/YYYY")}</h2>
      {isLoading ? (
        <p>Carregando horários...</p>
      ) : (
        <ul>
          {horariosDisponiveis.map((time) => {
            const isManuallyBlocked = bloqueios.some((b) => b.time === time);
            const isBooked = agendamentosConfirmados.some(
              (a) => a.time === time
            );

            return (
              <li
                key={time}
                style={{
                  margin: "10px 0",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <span>{time}</span>
                {isBooked ? (
                  <span style={{ color: "orange" }}>(Agendado)</span>
                ) : isManuallyBlocked ? (
                  <>
                    <span style={{ color: "red" }}>
                      (Bloqueado Manualmente)
                    </span>
                    <button
                      onClick={() => handleUnblockSlot(time)}
                      disabled={isLoading}
                    >
                      Desbloquear
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleBlockSlot(time)}
                    disabled={isLoading}
                  >
                    Bloquear
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
