import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Redirecionar para a página de login se não estiver autenticado
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // Se estiver autenticado, renderizar o conteúdo protegido
  return <>{children}</>;
}
