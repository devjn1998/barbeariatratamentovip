import { adaptMixedPaymentData } from "../adapters/paymentAdapter";
import { testMercadoPagoConnectivity as testMercadoPagoConfig } from "../config/mercadoPago";
import { AppointmentData, NormalizedPayment } from "../types/payment";
import api from "./api";

// Interface para pagamento
export interface Payment {
  id: string;
  status: string;
  date_created: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer?: {
    email: string;
    name?: string;
  };
  cliente_nome?: string;
  cliente_telefone?: string;
  data_agendamento?: string;
  horario_agendamento?: string;
  servico?: string;
}

// Interface ajustada para pagamento
export interface PaymentData {
  amount?: number; // Tornar amount opcional
  valor?: number; // Adicionar valor como alternativa a amount
  description?: string;
  descricao?: string; // Alternativa em português
  email?: string;
  name?: string;
  nome?: string; // Alternativa em português
  telefone?: string; // Adicionar telefone
  identification?: {
    type: string;
    number: string;
  };
  identificacao?: {
    // Alternativa em português
    tipo: string;
    numero: string;
  };
  [key: string]: any;
}

// Função para criar um pagamento via PIX
export async function criarPagamentoPix(paymentData: any) {
  try {
    // Verificar conectividade com Mercado Pago
    await testMercadoPagoConfig();

    // Normalizar os dados para garantir compatibilidade
    const valorNumerico = Number(paymentData.amount || paymentData.valor || 0);

    // Validação extra para garantir que o valor é um número válido
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      throw new Error(`Valor inválido para pagamento: ${valorNumerico}`);
    }

    // Criar payload simplificado com apenas os campos necessários
    const dados = {
      transaction_amount: valorNumerico, // Campo principal esperado pelo Mercado Pago
      payment_method_id: "pix",
      description: paymentData.description || "Pagamento",
      payer: {
        email: paymentData.email || "cliente@example.com",
        first_name:
          paymentData.name?.split(" ")[0] ||
          paymentData.nome?.split(" ")[0] ||
          "Cliente",
        last_name:
          paymentData.name?.split(" ").slice(1).join(" ") ||
          paymentData.nome?.split(" ").slice(1).join(" ") ||
          "",
        identification: {
          type: "CPF",
          number: "12345678909",
        },
      },
      // Dados adicionais em formato separado
      external_reference: `payment_${Date.now()}`,
      // Incluir os dados originais para processamento no backend
      original_data: {
        data: paymentData.data,
        horario: paymentData.horario,
        servico: paymentData.servico,
        nome: paymentData.nome || paymentData.name,
        telefone: paymentData.telefone || paymentData.phone,
      },
    };

    console.log("Enviando dados para API:", dados);

    // Log adicional para debug
    console.log(
      "Valor do pagamento (antes do envio):",
      dados.transaction_amount,
      typeof dados.transaction_amount
    );

    // Verificação final antes do envio
    if (
      dados.transaction_amount === undefined ||
      dados.transaction_amount === null ||
      isNaN(dados.transaction_amount) ||
      dados.transaction_amount <= 0
    ) {
      throw new Error(
        `Valor inválido para transaction_amount: ${dados.transaction_amount}`
      );
    }

    const response = await api.post("/api/pagamentos", dados);

    // Converter a resposta para o formato normalizado
    return adaptMixedPaymentData(response.data);
  } catch (error) {
    console.error("Erro na criação do pagamento PIX:", error);
    throw error;
  }
}

// Função para verificar status de pagamento
export async function verificarStatusPagamento(
  id: string
): Promise<NormalizedPayment> {
  try {
    const { data } = await api.get(`/api/pagamentos/${id}/status`);

    // Converter e normalizar a resposta
    return adaptMixedPaymentData(data);
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    throw new Error("Não foi possível verificar o status do pagamento");
  }
}

// Função para atualizar dados de agendamento vinculados a um pagamento
export async function atualizarDadosAgendamentoPorPagamento(
  id: string,
  dadosAgendamento: AppointmentData
) {
  try {
    // Adaptar os dados para o formato esperado pelo backend
    const dadosNormalizados = {
      data_agendamento: dadosAgendamento.date,
      horario_agendamento: dadosAgendamento.time,
      cliente_nome: dadosAgendamento.clientName,
      cliente_telefone: dadosAgendamento.clientPhone,
      servico: dadosAgendamento.service,
    };

    console.log(`Atualizando dados para pagamento ${id}:`, dadosNormalizados);
    const { data } = await api.post(
      `/api/pagamentos/${id}/agendamento`,
      dadosNormalizados
    );
    return data.success;
  } catch (error) {
    console.error("Erro ao atualizar dados de agendamento:", error);
    throw error;
  }
}

// Função para listar todos os pagamentos
export async function listarPagamentos(): Promise<NormalizedPayment[]> {
  try {
    try {
      // Tenta primeiro buscar do backend
      const { data } = await api.get("/api/pagamentos");
      // Converter cada pagamento para o formato normalizado
      const pagamentos = Array.isArray(data)
        ? data.map(adaptMixedPaymentData)
        : [];

      // Enriquecer pagamentos com dados dos agendamentos
      return await enriquecerPagamentosComDadosDeAgendamentos(pagamentos);
    } catch (backendError) {
      console.warn(
        "Backend não disponível, buscando direto do Firebase:",
        backendError
      );

      // Se backend não estiver disponível, busca direto do Firebase
      const { collection, getDocs, query, where } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../config/firebase");

      const paymentsRef = collection(db, "payments");
      const snapshot = await getDocs(paymentsRef);

      const pagamentos = snapshot.docs.map((doc) => {
        // Converter os dados do Firebase para o formato normalizado
        const data = { id: doc.id, ...doc.data() };
        return adaptMixedPaymentData(data);
      });

      // Enriquecer pagamentos com dados dos agendamentos
      return await enriquecerPagamentosComDadosDeAgendamentos(pagamentos);
    }
  } catch (error) {
    console.error("Erro ao listar pagamentos:", error);
    throw new Error("Erro ao listar pagamentos");
  }
}

/**
 * Função auxiliar para enriquecer os dados de pagamento com informações dos agendamentos
 */
async function enriquecerPagamentosComDadosDeAgendamentos(
  pagamentos: NormalizedPayment[]
): Promise<NormalizedPayment[]> {
  try {
    // Importar funções do Firebase
    const { collection, getDocs, query, where } = await import(
      "firebase/firestore"
    );
    const { db } = await import("../config/firebase");

    // Buscar todos os agendamentos
    const agendamentosRef = collection(db, "agendamentos");
    const agendamentosSnapshot = await getDocs(agendamentosRef);

    // Criar um mapa de pagamentoId -> agendamento
    const agendamentosPorPagamentoId = new Map();
    agendamentosSnapshot.docs.forEach((doc) => {
      const agendamento = doc.data();
      if (agendamento.pagamentoId) {
        agendamentosPorPagamentoId.set(agendamento.pagamentoId, {
          id: doc.id,
          ...agendamento,
        });
      }
    });

    // Enriquecer cada pagamento com dados do agendamento correspondente
    return pagamentos.map((pagamento) => {
      const agendamentoCorrespondente = agendamentosPorPagamentoId.get(
        pagamento.id
      );

      if (agendamentoCorrespondente) {
        return {
          ...pagamento,
          // Atualizar com dados do cliente do agendamento
          clientName:
            agendamentoCorrespondente.cliente?.nome || pagamento.clientName,
          clientPhone:
            agendamentoCorrespondente.cliente?.telefone ||
            pagamento.clientPhone,
          clientEmail:
            agendamentoCorrespondente.cliente?.email || pagamento.clientEmail,
          // Atualizar serviço se disponível
          service:
            agendamentoCorrespondente.servico ||
            pagamento.service ||
            pagamento.description,
          // Adicionar referência ao agendamento
          appointmentId: agendamentoCorrespondente.id,
          appointmentDate: agendamentoCorrespondente.data,
          appointmentTime: agendamentoCorrespondente.horario,
        };
      }

      return pagamento;
    });
  } catch (error) {
    console.error(
      "Erro ao enriquecer pagamentos com dados de agendamentos:",
      error
    );
    return pagamentos; // Retorna os pagamentos originais em caso de erro
  }
}

// Função para excluir pagamento
export async function excluirPagamento(id: string) {
  try {
    // Verificar se o ID é válido
    if (!id || id === "undefined" || id === "null") {
      throw new Error("ID do pagamento inválido");
    }

    // Caso especial para o pagamento de teste de conectividade
    if (id === "connectivity-test") {
      console.log("Excluindo teste de conectividade...");
      const { deleteDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");
      try {
        await deleteDoc(doc(db, "payments", id));
        return true;
      } catch (specialError) {
        console.error("Erro ao excluir teste de conectividade:", specialError);
        // Continue tentando as outras abordagens
      }
    }

    try {
      // Tenta excluir pelo backend primeiro
      const { data } = await api.delete(`/api/pagamentos/${id}`);
      return data.success;
    } catch (backendError) {
      console.warn(
        "Backend não disponível, tentando exclusão direta no Firebase:",
        backendError
      );

      // Se o backend falhar, tenta excluir diretamente do Firebase
      // Importações necessárias para Firebase
      const { deleteDoc, doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");

      // Verificar se o documento existe antes de excluir
      const paymentRef = doc(db, "payments", id);
      const paymentDoc = await getDoc(paymentRef);

      if (!paymentDoc.exists()) {
        console.warn(`Pagamento ${id} não encontrado no Firebase`);
        // Se o documento não existir, consideramos como "excluído com sucesso"
        return true;
      }

      // Excluir do Firebase
      await deleteDoc(paymentRef);
      return true;
    }
  } catch (error: any) {
    console.error("Erro ao excluir pagamento:", error);
    // Melhorar a mensagem de erro para incluir detalhes
    const errorMessage =
      error.message || "Não foi possível excluir o pagamento";
    throw new Error(`Erro ao excluir pagamento: ${errorMessage}`);
  }
}

// Função para verificar a conectividade com o Mercado Pago
export async function testMercadoPagoConnectivity(): Promise<boolean> {
  try {
    // Usa a função do arquivo de configuração
    return await testMercadoPagoConfig();
  } catch (error) {
    console.error("Erro ao verificar conectividade com Mercado Pago:", error);
    return false;
  }
}

// Função para sincronizar pagamentos com agendamentos
export async function sincronizarPagamentosComAgendamentos(): Promise<{
  sucessos: number;
  falhas: number;
}> {
  try {
    // Importar funções do Firebase
    const { collection, getDocs, doc, updateDoc } = await import(
      "firebase/firestore"
    );
    const { db } = await import("../config/firebase");

    // Buscar todos os agendamentos
    const agendamentosRef = collection(db, "agendamentos");
    const agendamentosSnapshot = await getDocs(agendamentosRef);

    // Buscar todos os pagamentos
    const pagamentosRef = collection(db, "payments");
    const pagamentosSnapshot = await getDocs(pagamentosRef);

    // Criar um mapa de id -> pagamento
    const pagamentosPorId = new Map();
    pagamentosSnapshot.docs.forEach((doc) => {
      pagamentosPorId.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      });
    });

    // Resultados da sincronização
    const resultados = {
      sucessos: 0,
      falhas: 0,
    };

    // Para cada agendamento, verificar se há um pagamento correspondente
    for (const agendamentoDoc of agendamentosSnapshot.docs) {
      const agendamento = agendamentoDoc.data();

      // Se o agendamento tem id de pagamento, atualizar o pagamento com dados do cliente
      if (agendamento.pagamentoId) {
        try {
          const pagamento = pagamentosPorId.get(agendamento.pagamentoId);

          if (pagamento) {
            // Atualizar o pagamento com dados do cliente do agendamento
            const pagamentoRef = doc(db, "payments", agendamento.pagamentoId);
            await updateDoc(pagamentoRef, {
              cliente_nome: agendamento.cliente?.nome || "",
              cliente_telefone: agendamento.cliente?.telefone || "",
              cliente_email: agendamento.cliente?.email || "",
              servico: agendamento.servico || "",
              data_agendamento: agendamento.data || "",
              horario_agendamento: agendamento.horario || "",
            });

            resultados.sucessos++;
          }
        } catch (error) {
          console.error(
            `Erro ao sincronizar agendamento ${agendamentoDoc.id}:`,
            error
          );
          resultados.falhas++;
        }
      }
    }

    return resultados;
  } catch (error) {
    console.error("Erro ao sincronizar pagamentos com agendamentos:", error);
    throw new Error("Não foi possível sincronizar pagamentos com agendamentos");
  }
}

/**
 * Função para limpar pagamentos de teste ou pagamentos que não possuem cliente associado
 * e não estão vinculados a nenhum agendamento
 */
export async function limparPagamentosDeTesteOuSemCliente(): Promise<{
  removidos: number;
  falhas: number;
  ignorados: number;
}> {
  const resultado = {
    removidos: 0,
    falhas: 0,
    ignorados: 0,
  };

  try {
    // Buscar todos os pagamentos
    const pagamentos = await listarPagamentos();
    console.log(`Encontrados ${pagamentos.length} pagamentos para análise.`);

    // IDs de pagamentos vinculados a agendamentos
    const idsVinculados = pagamentos
      .filter((p) => p.appointmentId)
      .map((p) => p.id);

    console.log(`IDs de pagamentos vinculados: [${idsVinculados.join(", ")}]`);

    // Processar cada pagamento
    for (const pagamento of pagamentos) {
      // Verificar se o pagamento tem cliente válido
      const estaVinculado = !!pagamento.appointmentId;

      // Verificação mais rigorosa para clientes não identificados
      const clienteInvalido =
        !pagamento.clientName ||
        pagamento.clientName === "Cliente não identificado" ||
        pagamento.clientName === "Nenhum" ||
        pagamento.clientName.trim() === "";

      // Mostrar logs mais detalhados para diagnóstico
      console.log(
        `Avaliando pagamento ${pagamento.id}: {
          estaVinculado: ${estaVinculado}, 
          clientName: '${pagamento.clientName || ""}',
          clienteInvalido: ${clienteInvalido}
        }`
      );

      // Excluir APENAS se todas estas condições forem verdadeiras:
      // 1. Não está vinculado a um agendamento
      // 2. Tem um cliente inválido conforme a verificação rigorosa
      // 3. É explicitamente "Cliente não identificado" (para segurança adicional)
      if (
        !estaVinculado &&
        clienteInvalido &&
        pagamento.clientName === "Cliente não identificado"
      ) {
        try {
          // Tentar excluir o pagamento
          await excluirPagamento(pagamento.id);
          console.log(
            `Pagamento sem cliente ${pagamento.id} removido com sucesso.`
          );
          resultado.removidos++;
        } catch (error) {
          console.error(`Erro ao remover pagamento ${pagamento.id}:`, error);
          resultado.falhas++;
        }
      } else {
        // Detalhes sobre por que o pagamento foi ignorado para facilitar depuração
        let motivo = [];
        if (estaVinculado) motivo.push("está vinculado a um agendamento");
        if (!clienteInvalido) motivo.push("tem cliente válido");
        if (pagamento.clientName !== "Cliente não identificado")
          motivo.push("não é explicitamente 'Cliente não identificado'");

        console.log(
          `Pagamento ${pagamento.id} ignorado: ${motivo.join(", ")}.`
        );
        resultado.ignorados++;
      }
    }

    return resultado;
  } catch (error) {
    console.error("Erro ao limpar pagamentos:", error);
    throw error;
  }
}

/**
 * Função para excluir um pagamento específico, mesmo que seja inválido ou não exista
 * Esta função força a exclusão, ignorando erros
 */
export async function forcarExclusaoPagamento(id: string): Promise<boolean> {
  if (!id) return false;

  try {
    // Importar funções necessárias
    const { doc, deleteDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("../config/firebase");

    try {
      // Criar uma referência para o documento
      const docRef = doc(db, "payments", id);

      // Tentar excluir diretamente, ignorando erros
      await deleteDoc(docRef);
      console.log(`Pagamento ${id} forçadamente excluído com sucesso`);
      return true;
    } catch (innerError) {
      console.error(`Erro ao forçar exclusão do pagamento ${id}:`, innerError);
      return false;
    }
  } catch (error) {
    console.error("Erro ao importar funções do Firebase:", error);
    return false;
  }
}

/**
 * Função para verificar e restaurar pagamentos que possam ter sido excluídos incorretamente
 * Esta função cria pagamentos de backup para agendamentos que não têm mais o pagamento associado
 */
export async function verificarERestaurarPagamentos(): Promise<{
  restaurados: number;
  falhas: number;
  total: number;
}> {
  try {
    // Importar funções necessárias do Firebase
    const { collection, getDocs, doc, getDoc, setDoc } = await import(
      "firebase/firestore"
    );
    const { db } = await import("../config/firebase");

    // Resultados da operação
    const resultados = {
      restaurados: 0,
      falhas: 0,
      total: 0,
    };

    // Buscar todos os agendamentos
    const agendamentosRef = collection(db, "agendamentos");
    const agendamentosSnapshot = await getDocs(agendamentosRef);

    console.log(
      `Total de agendamentos encontrados: ${agendamentosSnapshot.size}`
    );

    // Lista de pagamentos especiais a serem verificados (baseado em informações específicas)
    // Este é um caso especial para o pagamento do Juan que foi excluído incorretamente
    const pagamentosEspeciais = [
      {
        possiveisIds: ["104458761553"], // IDs possíveis do pagamento
        cliente: {
          nome: "Juan",
          telefone: "(22) 97402-9231",
        },
        servico: "Corte Pé",
        valor: 10,
        data: "2025-03-11", // Formato YYYY-MM-DD
        horario: "10:00",
      },
    ];

    // Primeiro, verificar pagamentos especiais que conhecemos
    for (const pagamentoEspecial of pagamentosEspeciais) {
      // Garantir que possiveisIds é um array
      const idsParaVerificar = Array.isArray(pagamentoEspecial.possiveisIds)
        ? pagamentoEspecial.possiveisIds
        : [String(pagamentoEspecial.possiveisIds)]; // Converter para string se não for array

      for (const id of idsParaVerificar) {
        // Certificar-se de que o ID é uma string válida
        const pagamentoId = String(id);
        console.log(`Verificando pagamento especial com ID: ${pagamentoId}`);

        try {
          const pagamentoRef = doc(db, "payments", pagamentoId);
          const pagamentoDoc = await getDoc(pagamentoRef);

          // Se o pagamento não existir mais, tentamos restaurá-lo
          if (!pagamentoDoc.exists()) {
            try {
              // Criar um pagamento com os dados específicos
              const novoPagamento = {
                id: pagamentoId,
                status: "approved",
                date_created: new Date().toISOString(),
                transaction_amount: pagamentoEspecial.valor,
                description: pagamentoEspecial.servico,
                payment_method_id: "pix",
                cliente_nome: pagamentoEspecial.cliente.nome,
                cliente_telefone: pagamentoEspecial.cliente.telefone,
                data_agendamento: pagamentoEspecial.data,
                horario_agendamento: pagamentoEspecial.horario,
                servico: pagamentoEspecial.servico,
                restored: true,
                restored_at: new Date().toISOString(),
                restored_manually: true,
                special_case: true,
              };

              // Salvar o pagamento
              await setDoc(pagamentoRef, novoPagamento);
              resultados.restaurados++;
              resultados.total++;
              console.log(
                `Pagamento especial ${pagamentoId} restaurado com sucesso (cliente: ${pagamentoEspecial.cliente.nome})`
              );
            } catch (error) {
              console.error(
                `Erro ao restaurar pagamento especial ${pagamentoId}:`,
                error
              );
              resultados.falhas++;
            }
          } else {
            console.log(
              `Pagamento especial ${pagamentoId} já existe, não precisa ser restaurado`
            );
          }
        } catch (error) {
          console.error(
            `Erro ao verificar pagamento especial com ID ${pagamentoId}:`,
            error
          );
          resultados.falhas++;
        }
      }
    }

    // Para cada agendamento com pagamentoId, verificar se o pagamento existe
    for (const agendamentoDoc of agendamentosSnapshot.docs) {
      const agendamento = agendamentoDoc.data();
      const agendamentoId = agendamentoDoc.id;

      // Se o agendamento tem um pagamentoId
      if (agendamento.pagamentoId) {
        resultados.total++;

        // Garantir que o pagamentoId é uma string
        const pagamentoId = String(agendamento.pagamentoId);
        console.log(
          `Verificando pagamento ${pagamentoId} para agendamento ${agendamentoId}`
        );

        try {
          // Verificar se o pagamento existe
          const pagamentoRef = doc(db, "payments", pagamentoId);
          const pagamentoDoc = await getDoc(pagamentoRef);

          // Se o pagamento não existir, criar um novo com base nos dados do agendamento
          if (!pagamentoDoc.exists()) {
            try {
              // Criar um pagamento de backup
              const novoPagamento = {
                id: pagamentoId,
                status: "approved", // Assumimos que era aprovado
                date_created: new Date().toISOString(),
                transaction_amount: agendamento.preco || 0,
                description: agendamento.servico || "Serviço restaurado",
                payment_method_id: "pix",
                cliente_nome: agendamento.cliente?.nome || "Nome restaurado",
                cliente_telefone:
                  agendamento.cliente?.telefone || "Telefone restaurado",
                data_agendamento: agendamento.data || "",
                horario_agendamento: agendamento.horario || "",
                servico: agendamento.servico || "",
                restored: true, // Marcamos que este pagamento foi restaurado
                restored_at: new Date().toISOString(),
                original_agendamento_id: agendamentoId,
              };

              // Salvar o novo pagamento
              await setDoc(pagamentoRef, novoPagamento);
              resultados.restaurados++;
              console.log(
                `Pagamento ${pagamentoId} restaurado com sucesso para o agendamento ${agendamentoId}`
              );
            } catch (error) {
              console.error(
                `Erro ao restaurar pagamento para agendamento ${agendamentoId}:`,
                error
              );
              resultados.falhas++;
            }
          }
        } catch (error) {
          console.error(`Erro ao verificar pagamento ${pagamentoId}:`, error);
          resultados.falhas++;
        }
      }
    }

    return resultados;
  } catch (error) {
    console.error("Erro ao verificar e restaurar pagamentos:", error);
    throw new Error("Não foi possível verificar e restaurar pagamentos");
  }
}

/**
 * Função específica para restaurar o pagamento do Juan
 * Esta função foi criada para resolver o caso específico do pagamento excluído acidentalmente
 */
export async function restaurarPagamentoJuan(): Promise<boolean> {
  try {
    // Importar funções necessárias do Firebase
    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const { db } = await import("../config/firebase");

    // ID do pagamento do Juan
    const pagamentoId = "104458761553";

    // Verificar se o pagamento já existe
    const pagamentoRef = doc(db, "payments", pagamentoId);
    const pagamentoExistente = await getDoc(pagamentoRef);

    if (pagamentoExistente.exists()) {
      console.log("O pagamento do Juan já existe, não é necessário restaurar.");
      return true;
    }

    // Dados específicos do pagamento do Juan
    const dadosPagamento = {
      id: pagamentoId,
      status: "approved",
      date_created: new Date().toISOString(),
      transaction_amount: 10,
      description: "Corte Pé",
      payment_method_id: "pix",
      cliente_nome: "Juan",
      cliente_telefone: "(22) 97402-9231",
      data_agendamento: "2025-03-11",
      horario_agendamento: "10:00",
      servico: "Corte Pé",
      restored: true,
      restored_at: new Date().toISOString(),
      special_restore: true,
    };

    // Salvar o pagamento
    await setDoc(pagamentoRef, dadosPagamento);
    console.log("Pagamento do Juan restaurado com sucesso!");

    return true;
  } catch (error) {
    console.error("Erro ao restaurar pagamento do Juan:", error);
    return false;
  }
}
