import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <h1 className="text-6xl font-bold text-amber-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">
        Página Não Encontrada
      </h2>
      <p className="text-gray-500 mb-6">
        Desculpe, a página que você está procurando não existe ou foi movida.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
      >
        Voltar para a Página Inicial
      </Link>
    </div>
  );
};

export default NotFoundPage;
