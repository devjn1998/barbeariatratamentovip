import { useEffect, useState } from "react";
import { checkBackendHealth } from "../services/health";

export default function ServerStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const checkStatus = async () => {
    try {
      setChecking(true);
      const status = await checkBackendHealth();

      // If status is different from current, animate the transition
      if (isOnline !== status) {
        setIsVisible(false);

        // Wait for fade out animation
        setTimeout(() => {
          setIsOnline(status);
          setLastChecked(new Date());
          setIsVisible(true);
        }, 300);
      } else {
        setIsOnline(status);
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error("Erro ao verificar status do servidor:", error);
      setIsOnline(false);
      setLastChecked(new Date());
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Verificar status ao montar o componente
    checkStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const renderStatusIcon = () => {
    if (isOnline === null) {
      return (
        <div className="flex items-center justify-center h-8 w-8 bg-gray-200 rounded-full">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
        </div>
      );
    }

    if (!isOnline) {
      return (
        <div className="relative flex items-center justify-center h-8 w-8 bg-red-100 rounded-full">
          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute -inset-0.5 rounded-full border-2 border-red-300 animate-pulse-slow opacity-75"></div>
        </div>
      );
    }

    return (
      <div className="relative flex items-center justify-center h-8 w-8 bg-green-100 rounded-full">
        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
        <div className="absolute -inset-0.5 rounded-full border-2 border-green-300 opacity-75"></div>
      </div>
    );
  };

  const getStatusText = () => {
    if (isOnline === null) {
      return {
        title: "Verificando status do servidor...",
        description: "Por favor, aguarde enquanto verificamos a conexão",
      };
    }

    if (!isOnline) {
      return {
        title: "Servidor offline",
        description: "Algumas funcionalidades podem não estar disponíveis",
      };
    }

    return {
      title: "Servidor online",
      description: "Todas as funcionalidades estão disponíveis",
    };
  };

  const statusClasses =
    isOnline === null
      ? "bg-gray-50 border-gray-300 shadow-sm"
      : isOnline
      ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-sm"
      : "bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-sm";

  const textColorClasses =
    isOnline === null
      ? "text-gray-700"
      : isOnline
      ? "text-green-700"
      : "text-red-700";

  const buttonClasses =
    isOnline === null
      ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
      : isOnline
      ? "bg-green-100 hover:bg-green-200 text-green-700"
      : "bg-red-100 hover:bg-red-200 text-red-700";

  const { title, description } = getStatusText();

  return (
    <div
      className={`transition-all duration-300 rounded-lg border ${statusClasses} p-4 mb-6 ${
        isVisible
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform -translate-y-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {renderStatusIcon()}
          <div>
            <p className={`font-medium ${textColorClasses}`}>{title}</p>
            <p className={`text-sm opacity-80 ${textColorClasses}`}>
              {description}
            </p>
          </div>
        </div>
        <button
          onClick={checkStatus}
          disabled={checking}
          className={`px-4 py-2 rounded-md text-sm transition-all duration-200 transform hover:scale-105 ${buttonClasses} ${
            checking ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {checking ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              <span>Verificando...</span>
            </div>
          ) : (
            "Verificar"
          )}
        </button>
      </div>
      {lastChecked && (
        <div className="flex justify-end mt-2">
          <p className={`text-xs italic opacity-75 ${textColorClasses}`}>
            Última verificação: {lastChecked.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
