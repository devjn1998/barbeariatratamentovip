import { useSearchParams } from "react-router-dom";

export default function PaginaConfirmacao() {
  const [searchParams] = useSearchParams();
  const hora = searchParams.get("hour");
  const servico = searchParams.get("service");

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-3xl font-bold mb-6">Confirmação de Agendamento</h1>
      <div
        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
        role="alert"
      >
        <strong className="font-bold">Sucesso!</strong>
        <p>Seu horário foi agendado.</p>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Horário:</p>
        <p>{hora}</p>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Serviço:</p>
        <p>{servico}</p>
      </div>
      <p className="text-gray-600">
        Obrigado por escolher a Barbearia Andin. Estamos ansiosos para
        recebê-lo!
      </p>
    </div>
  );
}
