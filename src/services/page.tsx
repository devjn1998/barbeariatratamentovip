import { servicos } from "../data/services";

export default function PaginaServicos() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-serif font-bold mb-12 text-center">
        Nossos Serviços
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {servicos.map((servico) => (
          <div
            key={servico.nome}
            className="bg-white shadow-lg rounded-xl p-8 transition-all duration-300 hover:transform hover:scale-105 border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-4">{servico.nome}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {servico.descricao}
            </p>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">
                R$ {servico.preco.toFixed(2)}
              </p>
              <a
                href="/book"
                className="cursor-pointer bg-black text-white px-6 py-2 rounded-full hover:bg-white hover:text-black border-2 border-black transition-all duration-300"
              >
                Agendar
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
