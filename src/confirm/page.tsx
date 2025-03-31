import { Link, useSearchParams } from "react-router-dom";

export default function PaginaConfirmacao() {
  const [searchParams] = useSearchParams();
  const hora = searchParams.get("hour");
  const servico = searchParams.get("service");
  const nome = searchParams.get("name");
  const paymentId = searchParams.get("payment");
  const status = searchParams.get("status");

  const isPending = status === "pending";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white shadow-lg rounded-xl p-12 text-center space-y-8">
        <h1 className="text-4xl font-serif font-bold">
          {isPending ? "Agendamento Recebido" : "Confirmação de Agendamento"}
        </h1>

        {isPending ? (
          <div className="bg-orange-50 border-2 border-orange-500 text-orange-700 px-6 py-4 rounded-xl">
            <p className="text-2xl font-bold mb-2">Agendamento Quase Lá!</p>
            <p className="text-lg">
              Seu horário foi reservado. O pagamento será realizado no dia do
              atendimento.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-500 text-green-700 px-6 py-4 rounded-xl">
            <p className="text-2xl font-bold mb-2">Agendamento Confirmado!</p>
            <p className="text-lg">Seu horário foi reservado com sucesso.</p>
          </div>
        )}

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

          {paymentId && !isPending && (
            <div className="border-b border-gray-100 pb-4">
              <p className="text-gray-500 mb-2">Código do Pagamento (PIX)</p>
              <p className="text-lg">{paymentId}</p>
            </div>
          )}

          {/* Mostrar status do pagamento */}
          <div className="border-b border-gray-100 pb-4">
            <p className="text-gray-500 mb-2">Status do Pagamento</p>
            <p
              className={`text-2xl font-bold ${
                isPending ? "text-orange-600" : "text-green-600"
              }`}
            >
              {isPending
                ? "Aguardando Pagamento (Presencial)"
                : "Pagamento Confirmado (PIX)"}
            </p>
          </div>
        </div>

        <p className="text-xl text-gray-600">
          Obrigado por escolher a Barbearia Andin.
          <br />
          {isPending
            ? "Lembre-se de efetuar o pagamento no dia."
            : "Estamos ansiosos para recebê-lo!"}
        </p>

        {/* Botões de Ação */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/"
            className="inline-block cursor-pointer bg-black text-white px-8 py-3 rounded-full hover:bg-white hover:text-black border-2 border-black transition-all duration-300 w-full sm:w-auto"
          >
            Voltar ao Início
          </Link>

          {/* Botão WhatsApp - REMOVER A CONDIÇÃO !isPending */}
          {/* {!isPending && ( */}
          <a
            href={`https://wa.me/5522992535077?text=${encodeURIComponent(
              `Olá! Tenho uma dúvida sobre meu agendamento do serviço ${servico} às ${hora}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center cursor-pointer bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 border-2 border-green-500 transition-all duration-300 w-full sm:w-auto"
          >
            {/* Ícone do WhatsApp (SVG) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
            </svg>
            Falar no WhatsApp
          </a>
          {/* )} */}
        </div>
      </div>
    </div>
  );
}
