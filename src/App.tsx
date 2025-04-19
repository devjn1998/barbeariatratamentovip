import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BookingPage from "./pages/book/page";
import ProtectedRoute from "./components/ProtectedRoute";
import ConfirmationPage from "./confirm/page";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./layout";
import AdminLayout from "./layout/AdminLayout";
import Agendamentos from "./pages/admin/Agendamentos";
import LimpezaDados from "./pages/admin/LimpezaDados";
import Login from "./pages/admin/Login";
import HomePage from "./pages/home";
import PaymentPage from "./payment/page";
import ServicesPage from "./services/page";
import AdminBloqueiosPage from "./pages/admin/bloqueios/page";
import AdminDashboard from "./pages/admin/Dashboard";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
            <Routes>
              {/* Rotas do site principal */}
              <Route
                path="/"
                element={
                  <Layout>
                    <HomePage />
                  </Layout>
                }
              />
              <Route
                path="/book"
                element={
                  <Layout>
                    <BookingPage />
                  </Layout>
                }
              />
              <Route
                path="/services"
                element={
                  <Layout>
                    <ServicesPage />
                  </Layout>
                }
              />
              <Route
                path="/payment"
                element={
                  <Layout>
                    <PaymentPage />
                  </Layout>
                }
              />
              <Route
                path="/confirm"
                element={
                  <Layout>
                    <ConfirmationPage />
                  </Layout>
                }
              />

              {/* Rota de login para administração */}
              <Route path="/admin/login" element={<Login />} />

              {/* Rotas protegidas do painel administrativo */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="agendamentos" element={<Agendamentos />} />
                <Route path="bloqueios" element={<AdminBloqueiosPage />} />
                <Route path="limpeza-dados" element={<LimpezaDados />} />
              </Route>

              {/* Rota 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>

          {/* Rodapé com link sutil para Admin */}
          <footer className="bg-zinc-800 text-center text-xs text-zinc-400 py-3 mt-auto">
            © {new Date().getFullYear()} Barbearia Andin. Todos os direitos
            reservados.
            <Link
              to="/admin/login"
              className="ml-4 hover:text-amber-500 transition-colors"
              title="Acesso Administrativo"
            >
              [Admin]
            </Link>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
