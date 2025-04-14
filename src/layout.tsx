import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./index.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-zinc-900 shadow-lg py-2"
            : "bg-transparent py-3 sm:py-6"
        }`}
      >
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-white font-bold text-xl sm:text-2xl flex items-center"
              >
                <span className="text-amber-500">TRATAMENTO</span>
                <span
                  className={`ml-1 ${
                    scrolled ? "text-white" : "text-white sm:text-black"
                  }`}
                >
                  VIP
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <ul className="hidden md:flex space-x-4 lg:space-x-8 items-center">
              <li>
                <Link
                  to="/"
                  className="text-white hover:text-amber-500 transition-colors font-medium text-sm lg:text-base"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-white hover:text-amber-500 transition-colors font-medium text-sm lg:text-base"
                >
                  Serviços
                </Link>
              </li>
              <li>
                <Link
                  to="/book"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 lg:px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 font-medium text-sm lg:text-base whitespace-nowrap"
                >
                  Agendar Agora
                </Link>
              </li>
            </ul>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white focus:outline-none p-1"
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </nav>

          {/* Mobile Menu - Better transition */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen
                ? "max-h-[300px] opacity-100 mt-4"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-2 pb-3 space-y-2 sm:px-3 bg-zinc-900 bg-opacity-90 rounded-lg backdrop-blur-sm">
              <Link
                to="/"
                className="text-white hover:text-amber-500 block px-3 py-2 rounded-md text-base font-medium"
              >
                Início
              </Link>
              <Link
                to="/services"
                className="text-white hover:text-amber-500 block px-3 py-2 rounded-md text-base font-medium"
              >
                Serviços
              </Link>
              <Link
                to="/book"
                className="bg-amber-500 hover:bg-amber-600 text-white block px-3 py-2 rounded-md text-base font-medium mt-2"
              >
                Agendar Agora
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content padding to account for fixed header */}
      <div
        className={`${
          scrolled ? "pt-14 sm:pt-16" : "pt-20 sm:pt-24"
        } transition-all duration-300`}
      >
        <main className="flex-grow">{children}</main>
      </div>

      <footer className="bg-zinc-900 text-white py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 border-b border-amber-500 pb-2 inline-block">
                Horário de Funcionamento
              </h3>
              <div className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <p className="flex justify-between">
                  <span>Terça - Sábado</span>
                  <span>9h às 20h</span>
                </p>
                <p className="flex justify-between">
                  <span>Sábado</span>
                  <span>9h às 18h</span>
                </p>
                <p className="flex justify-between">
                  <span>Domingo</span>
                  <span className="text-amber-500">Fechado</span>
                </p>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 border-b border-amber-500 pb-2 inline-block">
                Contato
              </h3>
              <div className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                <p className="flex items-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  (22) 99253-5077
                </p>
              </div>
              <div className="flex space-x-4 mt-3 sm:mt-4">
                <a
                  href="#"
                  className="text-white hover:text-amber-500 transition-colors"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-white hover:text-amber-500 transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 border-b border-amber-500 pb-2 inline-block">
                Endereço
              </h3>
              <p className="flex items-start text-sm sm:text-base">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-500 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>
                  131 R. Antônio Agostinho Ferreira
                  <br />
                  Parque Aeroporto - Macaé - RJ
                </span>
              </p>
              <div className="mt-3 sm:mt-4 bg-zinc-800 p-3 rounded-lg">
                <Link
                  to="https://api.whatsapp.com/send?phone=5522974029231&text=Oi%20Juan%2C%20preciso%20de%20um%20or%C3%A7amento"
                  target="_blank"
                  className="bg-amber-500 hover:bg-amber-600 text-white block text-center py-2 sm:py-3 rounded-md transition-all duration-300 font-bold text-sm sm:text-base"
                >
                  QUERO UM SISTEMA IGUAL A ESTE
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-zinc-700 text-center">
            <p className="text-zinc-400 text-xs sm:text-sm">
              &copy; 2024 Barbearia Andin. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
