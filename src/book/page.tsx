import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { servicos } from "../data/services";
import {
  verificarHorarioDisponivel,
  adicionarAgendamento,
} from "../data/appointments";

export default function PaginaAgendamento() {
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const navegar = useNavigate();
  const [horariosIndisponiveis, setHorariosIndisponiveis] = useState<string[]>(
    []
  );

  const horariosDisponiveis = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  useEffect(() => {
    if (!dataSelecionada) return;

    async function verificarHorarios() {
      const indisponiveis = [];
      for (const horario of horariosDisponiveis) {
        const disponivel = await verificarHorarioDisponivel(
          dataSelecionada,
          horario
        );
        if (!disponivel) indisponiveis.push(horario);
      }
      setHorariosIndisponiveis(indisponiveis);
    }

    verificarHorarios();
  }, [dataSelecionada, horariosDisponiveis]);

  const aoEnviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !dataSelecionada ||
      !horarioSelecionado ||
      !servicoSelecionado ||
      !nome ||
      !telefone
    )
      return;

    try {
      const horarioDisponivel = await verificarHorarioDisponivel(
        dataSelecionada,
        horarioSelecionado
      );

      if (!horarioDisponivel) {
        alert(
          "Horário não está mais disponível. Por favor, escolha outro horário."
        );
        return;
      }

      const servico = servicos.find((s) => s.nome === servicoSelecionado);

      const novoAgendamento = {
        data: dataSelecionada,
        horario: horarioSelecionado,
        servico: servicoSelecionado,
        cliente: {
          nome,
          telefone,
        },
        status: "agendado" as const,
        preco: servico?.preco || 0,
      };

      await adicionarAgendamento(novoAgendamento);
      navegar(
        `/confirm?hour=${horarioSelecionado}&service=${servicoSelecionado}&name=${nome}`
      );
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert("Erro ao fazer o agendamento. Tente novamente.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8 text-center">
        Agende seu Horário
      </h1>

      <form onSubmit={aoEnviar} className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Seus Dados</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Data e Horário</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {horariosDisponiveis.map((horario) => (
                <button
                  type="button"
                  key={horario}
                  disabled={horariosIndisponiveis.includes(horario)}
                  className={`p-3 rounded-lg transition-all ${
                    horarioSelecionado === horario
                      ? "bg-amber-500 text-white"
                      : !horariosIndisponiveis.includes(horario)
                      ? "bg-gray-100 hover:bg-gray-200"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  onClick={() => setHorarioSelecionado(horario)}
                >
                  {horario}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Escolha o Serviço</h2>
          <div className="space-y-3">
            {servicos.map((servico) => (
              <button
                type="button"
                key={servico.nome}
                className={`w-full p-4 rounded-lg transition-all flex justify-between items-center ${
                  servicoSelecionado === servico.nome
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setServicoSelecionado(servico.nome)}
              >
                <span>{servico.nome}</span>
                <span>R$ {servico.preco.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-4 rounded-lg text-white text-lg font-bold transition-all ${
            !dataSelecionada ||
            !horarioSelecionado ||
            !servicoSelecionado ||
            !nome ||
            !telefone
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600"
          }`}
          disabled={
            !dataSelecionada ||
            !horarioSelecionado ||
            !servicoSelecionado ||
            !nome ||
            !telefone
          }
        >
          Confirmar Agendamento
        </button>
      </form>
    </div>
  );
}
