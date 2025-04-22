import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import ServerStatus from "../components/ServerStatus";
import { useAuth } from "../contexts/AuthContext";

// IMPORTAR SVGs como Componentes React
// Certifique-se que os caminhos estão corretos para onde você salvou os SVGs
import { ReactComponent as GridIcon } from "../assets/img/icons/grid.svg";
import { ReactComponent as CalendarIcon } from "../assets/img/icons/calendar.svg";
import { ReactComponent as ClockIcon } from "../assets/img/icons/clock.svg";
import { ReactComponent as TrashIcon } from "../assets/img/icons/trash-2.svg";
import { ReactComponent as LogOutIcon } from "../assets/img/icons/log-out.svg";
import { ReactComponent as PlusSquareIcon } from "../assets/img/icons/plus-square.svg";
import HomeIcon from "../assets/img/icons/home.png";
import UserIcon from "../assets/img/icons/user.png";
import MenuIcon from "../assets/img/icons/menu.png";
import XIcon from "../assets/img/icons/x.png";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/admin" && location.pathname.startsWith(path + "/"));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 5);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const headerHeightClass = isScrolled ? "h-12" : "h-16";
  const mainPaddingTopClass = isScrolled ? "pt-12" : "pt-16";

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header
        className={`bg-zinc-900 text-white fixed top-0 left-0 right-0 z-30 transition-all duration-300 shadow-md ${
          isScrolled ? "py-2" : "py-4"
        } ${headerHeightClass}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-full">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-3 p-1 text-gray-300 hover:text-white focus:outline-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              {sidebarOpen ? (
                <img src={XIcon} alt="Close" className="w-6 h-6" />
              ) : (
                <img src={MenuIcon} alt="Menu" className="w-6 h-6" />
              )}
            </button>
            <Link to="/admin/dashboard" className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold">
                <span className="text-amber-500">ANDIN</span> ADMIN
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6">
            {currentUser && (
              <div className="hidden md:flex items-center bg-zinc-800 px-3 py-1 rounded-full text-sm">
                <img
                  src={UserIcon}
                  alt="User"
                  className="w-4 h-4 text-amber-500 mr-2"
                />
                <span className="text-gray-300 truncate max-w-[150px] lg:max-w-[250px]">
                  {currentUser.email}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-amber-500 transition-colors flex items-center text-sm"
                title="Ver Site"
              >
                <img src={HomeIcon} alt="Home" className="w-5 h-5" />
                <span className="hidden sm:inline ml-1">Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-500 transition-colors flex items-center text-sm"
                title="Sair"
              >
                <LogOutIcon className="w-5 h-5" />
                <span className="hidden sm:inline ml-1">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`flex flex-1 ${mainPaddingTopClass}`}>
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                     lg:sticky lg:translate-x-0 lg:flex-shrink-0 lg:shadow-none lg:border-r border-gray-200
                     ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                     ${mainPaddingTopClass} lg:top-0 lg:pt-4 lg:h-[calc(100vh-${
            isScrolled ? "3rem" : "4rem"
          })]`}
        >
          <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-2 border-b border-gray-200 md:hidden">
              {currentUser && (
                <div className="flex items-center text-sm">
                  <img
                    src={UserIcon}
                    alt="User"
                    className="w-4 h-4 text-amber-500 mr-2"
                  />
                  <span className="text-gray-600 font-medium truncate">
                    {currentUser.email}
                  </span>
                </div>
              )}
            </div>

            <nav className="flex-grow p-4 overflow-y-auto">
              <ul className="space-y-2">
                {[
                  {
                    path: "/admin/dashboard",
                    label: "Dashboard",
                    Icon: GridIcon,
                  },
                  {
                    path: "/admin/agendamentos",
                    label: "Agendamentos",
                    Icon: CalendarIcon,
                  },
                  {
                    path: "/admin/bloqueios",
                    label: "Gerenciar Horários",
                    Icon: ClockIcon,
                  },
                  {
                    path: "/admin/novo-agendamento",
                    label: "Novo Agendamento",
                    Icon: PlusSquareIcon,
                  },
                  {
                    path: "/admin/limpeza-dados",
                    label: "Limpeza de Dados",
                    Icon: TrashIcon,
                  },
                ].map(({ path, label, Icon }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group ${
                        isActive(path)
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mr-3 flex-shrink-0 ${
                          isActive(path)
                            ? "text-white"
                            : "text-amber-500 group-hover:text-amber-600"
                        }`}
                        strokeWidth="1.5"
                      />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t border-gray-200 lg:hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <LogOutIcon className="w-5 h-5 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}

        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
            <div className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Barbearia Andin - Painel
              Administrativo
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
