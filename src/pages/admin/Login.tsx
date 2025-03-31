import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animateFields, setAnimateFields] = useState(false);

  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Start animation when component mounts
  useEffect(() => {
    setTimeout(() => {
      setAnimateFields(true);
    }, 100);
  }, []);

  // Redirecionar se já estiver logado
  if (currentUser) {
    navigate("/admin");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/admin");
    } catch (error) {
      // O erro já é tratado no contexto de autenticação
      setError("Falha ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div
        className={`max-w-md w-full space-y-8 transition-all duration-1000 transform ${
          animateFields
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with background */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-8 text-center">
            <div className="inline-block bg-white rounded-full p-3 mb-3 shadow-md">
              <svg
                className="w-10 h-10 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Área Administrativa
            </h2>
            <p className="text-white mt-1 opacity-90">Barbearia Andin</p>
          </div>

          {/* Form body */}
          <div className="p-8">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
                <div className="flex items-center">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                className={`transition-all duration-500 delay-100 transform ${
                  animateFields
                    ? "translate-y-0 opacity-100"
                    : "translate-y-5 opacity-0"
                }`}
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div
                className={`transition-all duration-500 delay-200 transform ${
                  animateFields
                    ? "translate-y-0 opacity-100"
                    : "translate-y-5 opacity-0"
                }`}
              >
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="********"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div
                className={`transition-all duration-500 delay-300 transform ${
                  animateFields
                    ? "translate-y-0 opacity-100"
                    : "translate-y-5 opacity-0"
                }`}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-4 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Entrando...
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-amber-600 hover:text-amber-800 transition-colors"
              >
                Voltar para o site
              </a>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-white text-sm mt-4 opacity-70">
          &copy; 2024 Barbearia Andin - Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}
