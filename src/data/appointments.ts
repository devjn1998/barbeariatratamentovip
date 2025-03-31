import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import api from "../services/api";

export interface Appointment {
  id: string;
  data: string;
  horario: string;
  servico: string;
  cliente: {
    nome: string;
    telefone: string;
  };
  status: "agendado" | "concluido" | "cancelado";
  preco: number;
  pagamentoId?: string;
  docId?: string; // ID interno do documento Firestore
}

export const horariosDisponiveis = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const dadosExemplo: Appointment[] = [
  // Se houver necessidade de dados de exemplo, use algo como:
  /*
  {
    id: "exemplo-1",
    data: "2023-11-15",
    horario: "14:00",
    servico: "Corte de Cabelo",
    cliente: {
      nome: "",
      telefone: ""
    },
    status: "agendado",
    preco: 30,
    pagamentoId: "",
  }
  */
  // Em vez de usar dados de exemplo, retornar um array vazio
];

interface PaymentResponse {
  id: string;
  status: string;
  date_created: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  data_agendamento?: string;
  horario_agendamento?: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  servico?: string;
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: {
      number?: string;
    };
  };
}

export async function verificarHorarioDisponivel(
  data: string,
  horario: string
): Promise<boolean> {
  try {
    console.log(
      `Verificando disponibilidade: data=${data}, horario=${horario}`
    );

    // Referência à coleção de agendamentos no Firestore
    const agendamentosRef = collection(db, "appointments");

    // Consulta para verificar se já existe um agendamento nesta data e horário
    const q = query(
      agendamentosRef,
      where("data", "==", data),
      where("horario", "==", horario),
      where("status", "==", "agendado")
    );

    const snapshot = await getDocs(q);

    // Se não houver documentos, o horário está disponível
    const disponivel = snapshot.empty;
    console.log(
      `Horário ${horario} na data ${data} está ${
        disponivel ? "disponível" : "indisponível"
      }`
    );
    return disponivel;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade de horário:", error);
    // Em caso de erro, assumimos que o horário não está disponível (por segurança)
    return false;
  }
}

export async function adicionarAgendamento(
  appointment: Omit<Appointment, "id">
) {
  try {
    const docRef = await addDoc(collection(db, "agendamentos"), appointment);
    return { ...appointment, id: docRef.id };
  } catch (error) {
    console.error("Erro ao adicionar agendamento:", error);
    throw error;
  }
}

export async function getAgendamentosPorData(
  data: string
): Promise<Appointment[]> {
  try {
    console.log(`🔍 Buscando agendamentos para a data: "${data}"`);

    // Buscar todos os agendamentos do Firebase
    try {
      const allResponse = await fetch(
        `http://localhost:3001/api/appointments/all`
      );

      if (allResponse.ok) {
        const todosAgendamentos = await allResponse.json();
        console.log("📋 Todos os agendamentos:", todosAgendamentos);

        // Filtrar usando diversos formatos potenciais de data
        const encontrados = todosAgendamentos.filter((a: any) => {
          // Obter a data do agendamento em diversos formatos possíveis
          const dataAgendamento =
            a.data_agendamento || a.data || (a.formData && a.formData.data);

          // Logging para debug
          console.log(`Comparando: [${dataAgendamento}] com [${data}]`);

          // Comparar como strings para evitar problemas de tipo
          return String(dataAgendamento) === String(data);
        });

        console.log(
          `Encontrados ${encontrados.length} agendamentos para a data ${data}`
        );

        if (encontrados.length > 0) {
          return mapearAgendamentos(encontrados);
        }
      }
    } catch (error) {
      console.error("Erro na busca principal de agendamentos:", error);
    }

    // Método alternativo: buscar diretamente da API de agendamentos por data
    try {
      const response = await fetch(
        `http://localhost:3001/api/appointments/data/${data}`
      );
      if (response.ok) {
        const dados = await response.json();
        console.log(`Dados da API por data: ${data}`, dados);
        if (dados.length > 0) {
          return mapearAgendamentos(dados);
        }
      }
    } catch (error) {
      console.error("Erro na busca por data:", error);
    }

    console.log(`❌ Nenhum agendamento encontrado para a data ${data}`);
    return [];
  } catch (error) {
    console.error("Erro geral na busca de agendamentos:", error);
    return [];
  }
}

// Função auxiliar para mapear os dados do agendamento
function mapearAgendamentos(agendamentos: any[]): Appointment[] {
  return agendamentos.map((agendamento) => {
    // Extrair e converter o preço para garantir que seja um número válido
    let preco = 0; // Valor padrão

    if (
      typeof agendamento.transaction_amount === "number" &&
      !isNaN(agendamento.transaction_amount)
    ) {
      preco = agendamento.transaction_amount;
    } else if (
      typeof agendamento.preco === "number" &&
      !isNaN(agendamento.preco)
    ) {
      preco = agendamento.preco;
    } else if (typeof agendamento.transaction_amount === "string") {
      // Tentar converter string para número
      const valorConvertido = parseFloat(agendamento.transaction_amount);
      if (!isNaN(valorConvertido)) {
        preco = valorConvertido;
      }
    } else if (typeof agendamento.preco === "string") {
      // Tentar converter string para número
      const valorConvertido = parseFloat(agendamento.preco);
      if (!isNaN(valorConvertido)) {
        preco = valorConvertido;
      }
    }

    // Mapear o objeto com uma estrutura consistente
    const mapped: Appointment = {
      id: agendamento.id || `temp-${Date.now()}-${Math.random()}`,
      data: agendamento.data_agendamento || agendamento.data || "",
      horario: agendamento.horario_agendamento || agendamento.horario || "",
      servico: agendamento.servico || agendamento.description || "",
      cliente: {
        nome: agendamento.cliente?.nome || agendamento.cliente_nome || "",
        telefone:
          agendamento.cliente?.telefone ||
          agendamento.cliente_telefone ||
          agendamento.payer?.phone?.number ||
          "",
      },
      status: agendamento.status || "agendado",
      preco: preco, // Usar o valor processado acima
      pagamentoId: String(agendamento.id || ""),
      docId: agendamento.id,
    };

    console.log("Agendamento mapeado:", mapped);
    return mapped;
  });
}

export async function atualizarDadosAgendamento(
  pagamentoId: string,
  dados: {
    data_agendamento?: string;
    horario_agendamento?: string;
    cliente_nome?: string;
    cliente_telefone?: string;
    servico?: string;
  }
) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/pagamentos/${pagamentoId}/atualizar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao atualizar dados do agendamento");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
    throw error;
  }
}

export async function atualizarAgendamento(
  agendamentoId: string,
  dados: {
    data?: string;
    horario?: string;
    cliente_nome?: string;
    cliente_telefone?: string;
    servico?: string;
    status?: string;
  }
) {
  try {
    const response = await fetch(
      `http://localhost:3001/api/appointments/${agendamentoId}/atualizar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao atualizar agendamento");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    throw error;
  }
}

export async function excluirAgendamento(id: string): Promise<boolean> {
  try {
    // URL corrigida para usar a mesma rota que o backend
    const response = await fetch(`/api/agendamentos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Falha ao excluir agendamento");
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    throw error;
  }
}

// Renomeando para evitar conflito de nomes
export async function carregarTodosAgendamentos(): Promise<Appointment[]> {
  try {
    console.log("🔄 Carregando todos os agendamentos do Firebase...");
    const agendamentosRef = collection(db, "agendamentos");
    const querySnapshot = await getDocs(agendamentosRef);

    // Usar um Map para garantir IDs únicos
    const agendamentosMap = new Map<string, Appointment>();

    console.log(
      `📊 DEBUG: Encontrados ${querySnapshot.size} documentos na coleção "agendamentos"`
    );

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Garantir que temos um ID válido
      const id = doc.id;

      // Log detalhado para cada documento
      console.log("📄 DEBUG: Documento encontrado:", {
        docId: id,
        dataId: data.id,
        data: data.data,
        status: data.status,
        cliente: data.cliente?.nome,
        serviço: data.servico,
      });

      // Criar objeto com ID correto
      const appointment: Appointment = {
        ...(data as any),
        id: data.id || id, // Usar data.id se existir, caso contrário usar doc.id
        docId: data.id || id,
      };

      // Usar o ID como chave para evitar duplicatas
      agendamentosMap.set(appointment.id, appointment);
    });

    // Converter o Map de volta para array
    const agendamentos = Array.from(agendamentosMap.values());

    console.log(
      `✅ Total de ${agendamentos.length} agendamentos únicos carregados`
    );

    // Log mais detalhado sobre os agendamentos carregados
    console.log("📑 DEBUG: Resumo de agendamentos carregados:");
    console.log("- Total:", agendamentos.length);

    const porStatus = agendamentos.reduce((acc, agendamento) => {
      acc[agendamento.status] = (acc[agendamento.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("- Por status:", porStatus);

    return agendamentos;
  } catch (error) {
    console.error("❌ Erro ao carregar agendamentos:", error);
    return [];
  }
}

export async function carregarAgendamentos(
  data?: string
): Promise<Appointment[]> {
  try {
    const url = data ? `/api/agendamentos?data=${data}` : `/api/agendamentos`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Erro ao carregar agendamentos");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao carregar agendamentos:", error);
    return [];
  }
}

// Função de verificação robusta no arquivo appointments.ts
export async function verificarDisponibilidade(data: string, horario: string) {
  console.log(`Verificando disponibilidade: data=${data}, horario=${horario}`);

  try {
    // Use a URL completa com o servidor
    const response = await api.get(
      `/api/disponibilidade?data=${data}&horario=${horario}`
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    return { disponivel: false, error: "Erro ao verificar disponibilidade" };
  }
}
