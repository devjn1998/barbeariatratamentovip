import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative h-[600px]">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <img
          src="/barbershop-hero.jpg"
          alt="Barbearia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white space-y-6">
            <h1 className="text-6xl font-bold font-serif">Barbearia Andin</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Tradição e estilo em cada corte. Uma experiência única de
              barbearia moderna.
            </p>
            <Link
              to="/book"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all"
            >
              Agende Agora
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center space-y-4">
          <div className="bg-amber-500 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
            <i className="fas fa-cut text-2xl text-white" />
          </div>
          <h3 className="text-xl font-bold">Profissionais Experientes</h3>
          <p className="text-gray-600">
            Nossa equipe possui anos de experiência em cortes modernos e
            clássicos
          </p>
        </div>
        <div className="text-center space-y-4">
          <div className="bg-amber-500 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
            <i className="fas fa-clock text-2xl text-white" />
          </div>
          <h3 className="text-xl font-bold">Ambiente Acolhedor</h3>
          <p className="text-gray-600">
            Um espaço pensado para seu conforto e bem-estar
          </p>
        </div>
        <div className="text-center space-y-4">
          <div className="bg-amber-500 w-16 h-16 mx-auto rounded-full flex items-center justify-center">
            <i className="fas fa-star text-2xl text-white" />
          </div>
          <h3 className="text-xl font-bold">Produtos Premium</h3>
          <p className="text-gray-600">
            Utilizamos apenas os melhores produtos do mercado
          </p>
        </div>
      </section>
    </div>
  );
}
