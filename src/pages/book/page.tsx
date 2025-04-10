import React, { useEffect, useState } from "react";

const BookingPage = () => {
  const [expedienteAberto, setExpedienteAberto] = useState(true);
  const [horarioAlmoco, setHorarioAlmoco] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);

  useEffect(() => {
    // Verificar status do expediente
    const statusExpediente = localStorage.getItem("expedienteAberto");
    setExpedienteAberto(statusExpediente !== "false");

    // Verificar horário de almoço
    const almoco = localStorage.getItem("horarioAlmoco") || "";
    setHorarioAlmoco(almoco);

    // Carregar horários e filtrar o horário de almoço
    carregarHorarios();
  }, []);

  const carregarHorarios = async () => {
    // ... seu código para carregar horários

    // Filtrar o horário de almoço da lista de disponíveis
    const horariosFiltrados = horarios.filter((h) => h !== horarioAlmoco);
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
