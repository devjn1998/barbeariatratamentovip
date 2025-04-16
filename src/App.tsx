import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BookingPage from "./pages/book/page";
import ProtectedRoute from "./components/ProtectedRoute";
import ConfirmationPage from "./confirm/page";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./layout";
import AdminLayout from "./layout/AdminLayout";
import Agendamentos from "./pages/admin/Agendamentos";
import Dashboard from "./pages/admin/Dashboard";
import LimpezaDados from "./pages/admin/LimpezaDados";
import Login from "./pages/admin/Login";
import HomePage from "./pages/home";
import PaymentPage from "./payment/page";
import ServicesPage from "./services/page";
import AdminBloqueiosPage from "./pages/admin/bloqueios/page";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
                  <Dashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agendamentos"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Agendamentos />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/limpeza-dados"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <LimpezaDados />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bloqueios"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminBloqueiosPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
