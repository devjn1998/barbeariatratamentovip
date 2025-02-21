import { servicos } from "../data/services";

export default function PaginaServicos() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Nossos Serviços</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servicos.map((servico) => (
          <div key={servico.nome} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{servico.nome}</h2>
            <p className="text-gray-600 mb-4">{servico.descricao}</p>
            <p className="text-lg font-bold text-blue-600">
              R$ {servico.preco.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
