import {
  User,
  UserCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { auth } from "../config/firebase";

// Interface para o contexto de autenticação
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

// Criar o contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Hook personalizado para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// Props para o provedor de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

// Componente provedor de autenticação
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para fazer login
  async function login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login realizado com sucesso!");
      return result;
    } catch (error: any) {
      let errorMessage = "Erro ao fazer login";

      // Tratamento de erros específicos do Firebase Auth
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Email ou senha incorretos";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas de login. Tente novamente mais tarde";
      }

      toast.error(errorMessage);
      throw error;
    }
  }

  // Função para fazer logout
  async function logout() {
    try {
      await signOut(auth);
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer logout");
      throw error;
    }
  }

  // Observar mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Limpar o observador ao desmontar
    return unsubscribe;
  }, []);

  // Valor do contexto
  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
