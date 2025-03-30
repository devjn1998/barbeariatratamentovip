import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ServerStatus from "../components/ServerStatus";
import { useAuth } from "../contexts/AuthContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Verifica qual item do menu está ativo
  const isActive = (path: string) => location.pathname === path;

  // Efeito para rastrear scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Efeito para fechar sidebar ao mudar de rota
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className={`bg-zinc-900 text-white fixed top-0 w-full z-30 transition-all duration-300 ${
          isScrolled ? "shadow-lg py-2" : "py-4"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-4 focus:outline-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sidebarOpen ? (
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
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-amber-500">ANDIN</span> ADMIN
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {currentUser && (
              <div className="hidden md:flex items-center bg-zinc-800 px-4 py-2 rounded-full">
                <svg
                  className="w-5 h-5 text-amber-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-gray-300 text-sm">
                  {currentUser.email}
                </span>
              </div>
            )}
            <div className="flex space-x-4">
              <Link
                to="/"
                className="text-white hover:text-amber-500 transition-colors flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="hidden md:inline">Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-300 hover:text-red-500 transition-colors flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-12 container mx-auto px-4">
        <ServerStatus />

        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Navegação lateral */}
          <aside
            className={`fixed lg:static top-20 bottom-0 w-64 bg-white rounded-r-lg lg:rounded-lg shadow-lg p-4 transition-all duration-300 transform z-20 ${
              sidebarOpen ? "left-0" : "-left-64 lg:left-0"
            }`}
          >
            <nav>
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-amber-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-gray-600 font-medium">
                    {currentUser?.email?.split("@")[0] || "Administrador"}
                  </span>
                </div>
              </div>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/admin"
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive("/admin")
                        ? "bg-amber-500 text-white shadow-md"
                        : "hover:bg-amber-100"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 mr-3 ${
                        isActive("/admin") ? "text-white" : "text-amber-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/agendamentos"
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive("/admin/agendamentos")
                        ? "bg-amber-500 text-white shadow-md"
                        : "hover:bg-amber-100"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 mr-3 ${
                        isActive("/admin/agendamentos")
                          ? "text-white"
                          : "text-amber-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Agendamentos
                  </Link>
                </li>
                {/* Remover o item de menu Pagamentos */}
                {/*
                <li>
                  <Link
                    to="/admin/pagamentos"
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive("/admin/pagamentos")
                        ? "bg-amber-500 text-white shadow-md"
                        : "hover:bg-amber-100"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 mr-3 ${
                        isActive("/admin/pagamentos")
                          ? "text-white"
                          : "text-amber-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                      />
                    </svg>
                    Pagamentos
                  </Link>
                </li>
                */}
                <li>
                  <Link
                    to="/admin/limpeza-dados"
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive("/admin/limpeza-dados")
                        ? "bg-amber-500 text-white shadow-md"
                        : "hover:bg-amber-100"
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 mr-3 ${
                        isActive("/admin/limpeza-dados")
                          ? "text-white"
                          : "text-amber-500"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Limpeza de Dados
                  </Link>
                </li>
              </ul>

              <div className="absolute bottom-4 left-4 right-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors mt-4 lg:hidden"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sair
                </button>
              </div>
            </nav>
          </aside>

          {/* Conteúdo principal */}
          <main className="flex-1 bg-white rounded-lg shadow-md p-6 min-h-[500px] transform transition-all duration-300">
            <div className="animate-fadeIn">{children}</div>
          </main>
        </div>
      </div>

      <footer className="bg-zinc-900 text-white py-4">
        <div className="container mx-auto text-center">
          <p className="text-zinc-400">
            &copy; 2024 Barbearia Andin - Painel Administrativo
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
