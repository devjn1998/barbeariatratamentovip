import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { verificarHorarioDisponivel } from "../data/appointments";
import { servicos } from "../data/services";
import MercadoPagoBrick from "./MercadoPagoBrick";

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [verificandoHorario, setVerificandoHorario] = useState(true);

  // Capturar dados do agendamento da URL
  const servicoNome = searchParams.get("service") || "";
  const servico = servicos.find((s) => s.nome === servicoNome);
  const valor = servico?.preco || 0;

  const nome = searchParams.get("name") || "";
  const telefone = searchParams.get("phone") || "";
  const data = searchParams.get("date") || "";
  const horario = searchParams.get("hour") || "";

  // Carregar script do MercadoPago
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.type = "text/javascript";
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Verificar disponibilidade do horário novamente
  useEffect(() => {
    async function verificarDisponibilidade() {
      if (!data || !horario) return;

      try {
        const disponivel = await verificarHorarioDisponivel(data, horario);

        if (!disponivel) {
          toast.error("Este horário não está mais disponível");
          navigate("/book");
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar disponibilidade:", error);
        toast.error("Erro ao verificar disponibilidade do horário");
      } finally {
        setVerificandoHorario(false);
      }
    }

    verificarDisponibilidade();
  }, [data, horario, navigate]);

  // Redirecionar se não houver serviço válido
  useEffect(() => {
    if (!servico) {
      // Use setTimeout para evitar o erro de setState durante a renderização
      setTimeout(() => {
        navigate("/");
      }, 0);
    }
  }, [servico, navigate]);

  // Se não houver serviço, renderizar null enquanto redireciona
  if (!servico) {
    return null;
  }

  // Exibir carregamento
  if (!scriptLoaded || verificandoHorario) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white shadow-lg rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
          </div>
          <p>Preparando seu pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white shadow-lg rounded-xl p-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-8">
          Pagamento - {servico.nome}
        </h1>

        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Detalhes do Agendamento</h2>
          <ul className="space-y-2">
            <li>
              <strong>Nome:</strong> {nome}
            </li>
            <li>
              <strong>Telefone:</strong> {telefone}
            </li>
            <li>
              <strong>Data:</strong>{" "}
              {new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
                timeZone: "UTC",
              })}
            </li>
            <li>
              <strong>Horário:</strong> {horario}
            </li>
            <li>
              <strong>Serviço:</strong> {servicoNome}
            </li>
            <li>
              <strong>Valor:</strong> R$ {valor.toFixed(2)}
            </li>
          </ul>
        </div>

        <MercadoPagoBrick
          amount={valor}
          dadosAgendamento={{
            data,
            horario,
            nome,
            telefone,
            servico: servicoNome,
          }}
          onSuccess={(paymentId) => {
            // Navegar para a página de confirmação
            navigate(
              `/confirm?hour=${horario}&service=${servicoNome}&payment=${paymentId}&name=${encodeURIComponent(
                nome
              )}`
            );
          }}
        />
      </div>
    </div>
  );
}
