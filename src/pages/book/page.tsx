import React, { useEffect, useState } from "react";

const BookingPage = () => {
  const [expedienteAberto, setExpedienteAberto] = useState(true);
  const [horarioAlmoco, setHorarioAlmoco] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    // Verificações
    const statusExpediente = localStorage.getItem("expedienteAberto");
    setExpedienteAberto(statusExpediente !== "false");

    const almoco = localStorage.getItem("horarioAlmoco") || "";
    setHorarioAlmoco(almoco);

    carregarHorarios();
  }, []);

  const carregarHorarios = async () => {
    // Horários disponíveis - exemplo
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

    // Filtrar o horário de almoço da lista
    const horariosFiltrados = horariosPadroes.filter(
      (h: string) => h !== horarioAlmoco
    );
    setHorariosDisponiveis(horariosFiltrados);
  };

  // Renderizar página de expediente fechado se necessário
  if (!expedienteAberto) {
    return (
      <div className="expediente-fechado">
        <h2>Estabelecimento Fechado</h2>
        <p>
          Nosso expediente está encerrado no momento. Por favor, retorne mais
          tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Sua página de agendamento normal, mas usando horariosDisponiveis que já exclui o almoço */}
    </div>
  );
};

export default BookingPage;
