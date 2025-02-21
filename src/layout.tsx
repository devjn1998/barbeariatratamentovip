import React from "react";
import { Link } from "react-router-dom";
import "./index.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-zinc-900 text-white">
        <nav className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-serif font-bold">
              Barbearia Andin
            </Link>
            <ul className="flex space-x-8">
              <li>
                <Link
                  to="/"
                  className="hover:text-amber-500 transition-colors font-medium"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="hover:text-amber-500 transition-colors font-medium"
                >
                  Serviços
                </Link>
              </li>
              <li>
                <Link
                  to="/book"
                  className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-full transition-colors font-medium"
                >
                  Agendar
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-zinc-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                Horário de Funcionamento
              </h3>
              <p>Segunda - Sábado: 9h às 20h</p>
              <p>Domingo: Fechado</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contato</h3>
              <p>Telefone: (11) 99999-9999</p>
              <p>Email: contato@barbearia-andin.com</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Endereço</h3>
              <p>Rua da Barbearia, 123</p>
              <p>São Paulo - SP</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-700 text-center">
            <p>&copy; 2024 Barbearia Andin. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
