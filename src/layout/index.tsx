import React, { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ReactComponent as LogoIcon } from "../assets/img/icons/logo.svg";
import { ReactComponent as LoginIcon } from "../assets/img/icons/log-in.svg";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-black text-white">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMenuOpen
            ? "bg-zinc-900 shadow-lg py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-auto text-amber-500" />
            <span className="text-xl font-bold tracking-tight">
              Barbearia <span className="text-amber-500">Andin</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`hover:text-amber-500 transition-colors ${
                isActive("/") ? "text-amber-500 font-semibold" : ""
              }`}
            >
              Início
            </Link>
            <Link
              to="/services"
              className={`hover:text-amber-500 transition-colors ${
                isActive("/services") ? "text-amber-500 font-semibold" : ""
              }`}
            >
              Serviços
            </Link>
            <Link
              to="/book"
              className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-md font-medium transition-colors shadow-md"
            >
              Agendar Horário
            </Link>
            <Link
              to="/admin/login"
              className="text-sm text-zinc-400 hover:text-amber-500 transition-colors flex items-center"
              title="Acesso Administrativo"
            >
              <LoginIcon
                className="w-4 h-4 mr-1 stroke-current"
                strokeWidth="2"
              />
              Admin
            </Link>
          </nav>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden bg-zinc-900 py-4 px-4 absolute top-full left-0 right-0 shadow-lg">
            <ul className="flex flex-col space-y-4 items-center">
              <li>
                <Link
                  to="/"
                  className={`block hover:text-amber-500 transition-colors ${
                    isActive("/") ? "text-amber-500 font-semibold" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className={`block hover:text-amber-500 transition-colors ${
                    isActive("/services") ? "text-amber-500 font-semibold" : ""
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Serviços
                </Link>
              </li>
              <li>
                <Link
                  to="/book"
                  className="block bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-md font-medium transition-colors shadow-md w-full text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Agendar Horário
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/login"
                  className="text-sm text-zinc-400 hover:text-amber-500 transition-colors flex items-center justify-center pt-2"
                  title="Acesso Administrativo"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LoginIcon
                    className="w-4 h-4 mr-1 stroke-current"
                    strokeWidth="2"
                  />
                  Admin Login
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main className="flex-grow pt-20 md:pt-24">{children}</main>

      <footer className="bg-zinc-950 text-center py-6 mt-auto">
        <p className="text-zinc-400 text-sm">
          © {new Date().getFullYear()} Barbearia Andin. Todos os direitos
          reservados.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
