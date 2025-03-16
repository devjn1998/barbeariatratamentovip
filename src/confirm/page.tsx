import { Link, useSearchParams } from "react-router-dom";

export default function PaginaConfirmacao() {
  const [searchParams] = useSearchParams();
  const hora = searchParams.get("hour");
  const servico = searchParams.get("service");
  const nome = searchParams.get("name");
  const paymentId = searchParams.get("payment");

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white shadow-lg rounded-xl p-12 text-center space-y-8">
        <h1 className="text-4xl font-serif font-bold">
          Confirmação de Agendamento
        </h1>

        <div className="bg-green-50 border-2 border-green-500 text-green-700 px-6 py-4 rounded-xl">
          <p className="text-2xl font-bold mb-2">Agendamento Confirmado!</p>
          <p className="text-lg">Seu horário foi reservado com sucesso.</p>
        </div>

        <div className="space-y-6 py-8">
          {nome && (
            <div className="border-b border-gray-100 pb-4">
              <p className="text-gray-500 mb-2">Cliente</p>
              <p className="text-2xl font-bold">{nome}</p>
            </div>
          )}

          <div className="border-b border-gray-100 pb-4">
            <p className="text-gray-500 mb-2">Horário Agendado</p>
            <p className="text-2xl font-bold">{hora}</p>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <p className="text-gray-500 mb-2">Serviço Escolhido</p>
            <p className="text-2xl font-bold">{servico}</p>
          </div>

          {paymentId && (
            <div className="border-b border-gray-100 pb-4">
              <p className="text-gray-500 mb-2">Código do Pagamento</p>
              <p className="text-lg">{paymentId}</p>
            </div>
          )}
        </div>

        <p className="text-xl text-gray-600">
          Obrigado por escolher a Barbearia Andin.
          <br />
          Estamos ansiosos para recebê-lo!
        </p>

        <Link
          to="/"
          className="inline-block cursor-pointer bg-black text-white px-8 py-3 rounded-full hover:bg-white hover:text-black border-2 border-black transition-all duration-300 mt-8"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
