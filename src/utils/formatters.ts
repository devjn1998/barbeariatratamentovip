// Função para formatar data
export const formatarData = (dataString: string) => {
  try {
    const [ano, mes, dia] = dataString.split("-");
    return `${dia}/${mes}/${ano}`;
  } catch (e) {
    return dataString;
  }
};

// Função para formatar preço
export const formatarPreco = (valor: number | undefined | null) => {
  try {
    if (valor === undefined || valor === null || isNaN(Number(valor))) {
      return "R$ 0,00";
    }
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error("Erro ao formatar preço:", valor, error);
    return "R$ 0,00";
  }
};

// Função para traduzir status
export const traduzirStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "confirmado":
      return "Confirmado";
    case "aguardando pagamento":
      return "Aguardando Pagamento";
    default:
      return status || "Desconhecido";
  }
};
