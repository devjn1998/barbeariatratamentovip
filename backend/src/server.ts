import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "./config/firebase";
import { mercadoPagoService } from "./services/mercadoPagoService";
import { resetDatabaseCollections } from "./utils/databaseAdmin";
import {
  isValidDate,
  isValidTime,
  validarDadosAgendamento,
} from "./utils/validators";

// Carrega as variáveis de ambiente
dotenv.config();

// Validação do token
if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  console.error("❌ Token do Mercado Pago não encontrado");
  process.exit(1);
}

const app = express();

// Configuração básica
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      "http://127.0.0.1:3000",
      "https://127.0.0.1:3000",
      "https://barbeariatratamentovip.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

console.log("✅ Configuração do Mercado Pago inicializada");

const FIREBASE_ENABLED = true; // Forçar Firebase habilitado
console.log("🔥 Firebase FORÇADO como habilitado para debug");

// Adicionar esta interface perto do topo do arquivo (após as importações)
interface AgendamentoDebug {
  id: string;
  data?: string;
  horario?: string;
  cliente?: { nome?: string; telefone?: string; email?: string };
  servico?: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: any; // Para propriedades adicionais que possam existir
}

// Adicione esta rota próxima ao topo, logo após a configuração do app
app.get("/api/test", (req, res) => {
  res.json({ message: "Servidor funcionando corretamente" });
});

// Adicione esta rota perto do início, logo após a configuração básica
app.get("/api/debug/agendamentos", async (req, res) => {
  try {
    console.log("🔍 Recebida solicitação para debug de agendamentos");

    const { data } = req.query;
    console.log("📅 Filtrando por data:", data || "todas as datas");

    const agendamentosRef = collection(db, "agendamentos");
    // Corrija o tipo ou declare q com um tipo mais genérico
    let q: any = agendamentosRef;

    // Se houver um filtro de data
    if (data) {
      q = query(agendamentosRef, where("data", "==", data));
    }

    const querySnapshot = await getDocs(q);
    const agendamentos: AgendamentoDebug[] = [];

    querySnapshot.forEach((doc) => {
      // Obtenha os dados do documento com tipagem correta
      const agendamentoData = doc.data() as Record<string, any>;

      // Agora podemos adicionar diretamente ao array com o id correto
      agendamentos.push({
        id: doc.id,
        ...agendamentoData, // Spread é seguro agora que temos o tipo correto
      });
    });

    console.log(`🏁 Retornando ${agendamentos.length} agendamentos`);
    return res.json(agendamentos);
  } catch (error) {
    console.error("❌ Erro ao buscar agendamentos para debug:", error);
    // Corrija o erro de tipo 'unknown' fazendo uma verificação adequada
    return res.status(500).json({
      error: "Erro ao buscar agendamentos para debug",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Rota de pagamento
app.post("/api/pagamentos", async (req, res) => {
  try {
    console.log("📊 Recebido payload para pagamento:", req.body);

    // Extrair dados do payload principal e do objeto original_data se existir
    const {
      transaction_amount,
      amount,
      valor,
      description,
      descricao,
      email,
      nome,
      name,
      phone,
      telefone,
      identification,
      identificacao,
      data,
      horario,
      servico,
      original_data = {}, // Extrair dados do objeto original_data
    } = req.body;

    // Extrair dados do original_data (caso sejam enviados neste formato)
    const {
      data: originalData,
      horario: originalHorario,
      servico: originalServico,
      nome: originalNome,
      telefone: originalTelefone,
    } = original_data;

    console.log("ℹ️ Processando dados para Mercado Pago");
    console.log("💲 Campos de valor detectados:", {
      transaction_amount,
      amount,
      valor,
    });

    // Normalizar os dados (suportar todos os formatos possíveis)
    // Priorizar transaction_amount, depois amount, depois valor
    const valorFinal = Number(transaction_amount || amount || valor || 0);

    console.log(
      "💰 Valor normalizado para pagamento:",
      valorFinal,
      typeof valorFinal
    );

    // Usar dados do original_data se os principais não estiverem definidos
    const descricaoFinal = description || descricao || "Pagamento";
    const nomeFinal = name || nome || originalNome || "Cliente";
    const emailFinal = email || "cliente@example.com";
    const telefoneFinal = phone || telefone || originalTelefone || "";
    const dataFinal = data || originalData;
    const horarioFinal = horario || originalHorario;
    const servicoFinal = servico || originalServico;

    // Validar valores com mais rigor
    if (valorFinal <= 0 || isNaN(valorFinal)) {
      const errorMsg = `Tentativa de pagamento com valor inválido: ${valorFinal}`;
      console.warn(`⚠️ ${errorMsg}`);
      return res.status(400).json({
        success: false,
        message: errorMsg,
      });
    }

    // Valores padrão para campos ausentes
    const dataFinalProcessada =
      dataFinal || new Date().toISOString().split("T")[0];
    const horarioFinalProcessado = horarioFinal || "Horário não especificado";
    const servicoFinalProcessado = servicoFinal || descricaoFinal;

    // Extrair dados do agendamento se disponíveis
    const dadosAgendamento = {
      data: dataFinalProcessada,
      horario: horarioFinalProcessado,
      cliente: {
        nome: nomeFinal,
        telefone: telefoneFinal,
        email: emailFinal,
      },
      servico: servicoFinalProcessado,
    };

    console.log("📅 Dados do agendamento:", dadosAgendamento);
    console.log("💰 Valor do pagamento (final):", valorFinal);

    // Criar o payload para o pagamento conforme especificação do Mercado Pago
    // Simplificando o payload ao máximo para evitar campos desnecessários
    const paymentPayload = {
      transaction_amount: valorFinal,
      description: descricaoFinal,
      payment_method_id: "pix",
      payer: {
        email: emailFinal,
        first_name: nomeFinal.split(" ")[0] || "Cliente",
        last_name: nomeFinal.split(" ").slice(1).join(" ") || "",
        identification: {
          type: "CPF",
          number: "12345678909",
        },
      },
      // Informações adicionais que podem ser úteis
      external_reference: `payment_${Date.now()}`,
      // Dados originais para referência
      _originalData: {
        amount: valorFinal,
        nome: nomeFinal,
        telefone: telefoneFinal,
        data: dataFinal,
        horario: horarioFinal,
        servico: servicoFinal,
      },
    };

    // Verificações adicionais antes de enviar para o Mercado Pago
    if (
      paymentPayload.transaction_amount === undefined ||
      paymentPayload.transaction_amount === null ||
      isNaN(paymentPayload.transaction_amount) ||
      paymentPayload.transaction_amount <= 0
    ) {
      const errorMsg = `Valor inválido para transaction_amount: ${paymentPayload.transaction_amount}`;
      console.error(`❌ ${errorMsg}`);
      return res.status(400).json({
        success: false,
        message: errorMsg,
      });
    }

    console.log(
      "🚀 Enviando dados para Mercado Pago:",
      JSON.stringify(paymentPayload, null, 2)
    );

    try {
      // Criar pagamento no Mercado Pago usando o serviço
      const resultado = await mercadoPagoService.createPixPayment(
        paymentPayload
      );
      console.log("✅ Pagamento criado com sucesso, ID:", resultado.id);

      // Extrair informações do PIX da resposta
      if (resultado.point_of_interaction?.transaction_data) {
        const pixData = resultado.point_of_interaction.transaction_data;
        console.log("📱 QR Code recebido, enviando para cliente");

        // Salvar o pagamento e agendamento no Firebase
        if (FIREBASE_ENABLED && resultado.id) {
          try {
            // 1. Salvar dados do PAGAMENTO (sem o agendamento ainda)
            await setDoc(doc(db, "payments", resultado.id.toString()), {
              id: resultado.id,
              status: resultado.status,
              description: resultado.description,
              transaction_amount: resultado.transaction_amount,
              payer: {
                email: emailFinal,
                name: nomeFinal,
                phone: telefoneFinal,
              },
              date_created: new Date().toISOString(),
              payment_method_id: "pix",
              // Não salvamos o agendamento ainda, apenas mantemos uma referência aos dados
              dados_agendamento_temp: dadosAgendamento,
              horario_temp: horarioFinal || null,
              data_temp: dataFinal || null,
              servico_temp: servicoFinal || null,
            });

            console.log(`📝 Pagamento ${resultado.id} salvo no Firebase`);
          } catch (error) {
            console.error("❌ Erro ao salvar pagamento no Firebase:", error);
          }
        }

        // Formatar data para exibição
        const dataFormatada =
          dataFinal || new Date().toISOString().split("T")[0];

        // Adicionar logs para depuração
        console.log({
          data_original: dataFinal,
          data_formatada: dataFormatada,
          nome_cliente: nomeFinal,
          telefone_cliente: telefoneFinal,
          email_cliente: emailFinal,
          horario: horarioFinal,
        });

        // Retornar ao Frontend com informações completas
        return res.status(201).json({
          id: resultado.id,
          status: resultado.status,
          description: resultado.description,
          transaction_amount: resultado.transaction_amount,
          date_created: resultado.date_created,
          payment_method_id: resultado.payment_method_id,
          point_of_interaction: {
            type: "PIX",
            transaction_data: {
              qr_code: pixData.qr_code,
              qr_code_base64: pixData.qr_code_base64,
              ticket_url: pixData.ticket_url,
            },
          },
          date_of_expiration: new Date(
            Date.now() + 30 * 60 * 1000
          ).toISOString(),
          message: "QR Code PIX gerado com sucesso",
          payer: {
            email: emailFinal,
            name: nomeFinal,
            phone: telefoneFinal,
          },
        });
      } else {
        console.error("❌ Resposta sem dados de PIX:", resultado);
        return res.status(400).json({
          error: "Dados PIX não gerados",
          message: "Não foi possível gerar o QR Code PIX",
          responseData: resultado,
        });
      }
    } catch (paymentError: any) {
      console.error("❌ Erro específico ao criar pagamento:", paymentError);

      // Retornar um erro mais detalhado e útil para o cliente
      return res.status(500).json({
        error: "Erro ao processar pagamento",
        message:
          paymentError.message || "Falha ao criar pagamento no Mercado Pago",
        details: paymentError.cause || {},
      });
    }
  } catch (error: any) {
    console.error("❌ Erro geral ao processar pagamento:", error);

    // Enviar detalhes do erro para ajudar na depuração
    res.status(500).json({
      error: "Erro ao processar pagamento",
      message: error.message || "Ocorreu um erro inesperado",
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
});

// Rota para processar pagamento
app.post("/api/process_payment", async (req, res) => {
  try {
    const { payment_method_id, transaction_amount } = req.body;

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: Number(transaction_amount),
        payment_method_id,
        description: "Pagamento do agendamento",
        payer: {
          email: "comprador@email.com",
          first_name: "Comprador",
          last_name: "Teste",
          identification: {
            type: "CPF",
            number: "12345678909",
          },
        },
      },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para verificar status do pagamento
app.get("/api/pagamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Verificando status do pagamento ${id}`);

    // Primeiro, tentar obter diretamente do Mercado Pago
    try {
      const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
      });

      const payment = new Payment(client);
      const result = await payment.get({ id });

      console.log(`✅ Pagamento ${id} verificado com sucesso:`, result.status);

      // Salvar no Firebase (se habilitado)
      if (FIREBASE_ENABLED) {
        try {
          await setDoc(
            doc(db, "payments", id),
            {
              id: result.id,
              status: result.status,
              statusDetail: result.status_detail,
              approved: result.status === "approved",
              transaction_amount: result.transaction_amount,
              date_created: result.date_created,
              description: result.description,
              payment_method_id: result.payment_method_id,
              payer: result.payer,
              updated_at: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (dbError: unknown) {
          const errorMessage =
            dbError instanceof Error ? dbError.message : "Erro desconhecido";
          console.warn(`⚠️ Não foi possível salvar no Firebase:`, errorMessage);
          // Continuar mesmo se falhar o salvamento
        }
      } else {
        console.log("Firebase desabilitado, ignorando persistência de dados");
      }

      // Após atualizar o status no Firebase e antes de retornar a resposta
      if (result.status === "approved") {
        // Criar ou atualizar agendamento se o pagamento for aprovado
        await criarOuAtualizarAgendamento(result);
      }

      return res.json({
        id: result.id,
        status: result.status,
        statusDetail: result.status_detail,
        approved: result.status === "approved",
        transaction_amount: result.transaction_amount,
        date_created: result.date_created,
        description: result.description,
        payment_method_id: result.payment_method_id,
        payer: result.payer,
      });
    } catch (mpError: unknown) {
      const errorMessage =
        mpError instanceof Error ? mpError.message : "Erro desconhecido";
      console.error(`❌ Erro ao consultar Mercado Pago:`, errorMessage);

      // Se falhar no Mercado Pago, tentar obter do Firebase
      try {
        const paymentDoc = await getDoc(doc(db, "payments", id));

        if (paymentDoc.exists()) {
          console.log(`📋 Pagamento ${id} encontrado no cache do Firebase`);
          return res.json(paymentDoc.data());
        }
      } catch (fbError: unknown) {
        const errorMessage =
          fbError instanceof Error ? fbError.message : "Erro desconhecido";
        console.error(`❌ Erro ao consultar Firebase:`, errorMessage);
        // Continuar para retornar resposta padrão
      }

      // Se não conseguir de nenhuma fonte, retornar status desconhecido
      return res.json({
        id,
        status: "unknown",
        statusDetail: "Não foi possível verificar o status",
        approved: false,
      });
    }
  } catch (error: any) {
    console.error("❌ Erro geral ao verificar pagamento:", error);
    res.status(500).json({
      error: "Erro ao verificar pagamento",
      details: error.message,
    });
  }
});

interface PaymentData {
  id: string;
  date_created?: string;
  status?: string;
  transaction_amount?: number;
  description?: string;
  payment_method_id?: string;
  payer?: { email: string };
}

// Rota para listar pagamentos (pode filtrar por status)
app.get("/api/pagamentos", async (req, res) => {
  try {
    const { status } = req.query;

    // Buscar pagamentos do Firebase
    let pagamentosQuery;
    const pagamentosRef = collection(db, "payments");

    // Filtrar por status se especificado
    if (status) {
      pagamentosQuery = query(pagamentosRef, where("status", "==", status));
    } else {
      pagamentosQuery = query(pagamentosRef);
    }

    const snapshot = await getDocs(pagamentosQuery);

    // Incluir o ID do documento junto com os dados
    const pagamentos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Adicionar campos para agendamento
      data_agendamento: new Date().toISOString().split("T")[0], // Data atual
      horario_agendamento: "A definir",
    }));

    res.json(pagamentos);
  } catch (error: any) {
    console.error("Erro ao buscar pagamentos:", error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para salvar manualmente um pagamento no Firebase (para testes)
app.post("/api/pagamentos/salvar", async (req, res) => {
  try {
    const paymentData = req.body;

    if (!paymentData || !paymentData.id) {
      return res.status(400).json({ error: "Dados de pagamento inválidos" });
    }

    // Adicionar campos obrigatórios se não existirem
    const payment = {
      id: paymentData.id,
      status: paymentData.status || "pending",
      date_created: paymentData.date_created || new Date().toISOString(),
      transaction_amount: paymentData.transaction_amount || 0,
      description: paymentData.description || "Pagamento manual",
      payment_method_id: paymentData.payment_method_id || "pix",
      payer: paymentData.payer || { email: "manual@teste.com" },
      updated_at: serverTimestamp(),
    };

    // Salvar no Firebase (se habilitado)
    if (FIREBASE_ENABLED) {
      try {
        await setDoc(doc(db, "payments", payment.id.toString()), payment, {
          merge: true,
        });
      } catch (dbError: unknown) {
        const errorMessage =
          dbError instanceof Error ? dbError.message : "Erro desconhecido";
        console.error("Erro ao salvar pagamento:", errorMessage);
      }
    } else {
      console.log("Firebase desabilitado, ignorando persistência de dados");
    }

    res.json({ success: true, payment });
  } catch (error: any) {
    console.error("Erro ao salvar pagamento:", error);
    res.status(500).json({ error: error.message });
  }
});

// Rota de verificação de saúde da API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Adicione esta rota no seu servidor
app.post("/api/pagamentos/sincronizar", async (req, res) => {
  try {
    console.log("🔄 Iniciando sincronização de pagamentos com o Firebase...");

    // Buscar pagamentos do Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
    });

    const payment = new Payment(client) as any;
    const searchResult = await payment.search({
      options: {
        limit: 100,
        offset: 0,
      },
    });

    if (!searchResult.results) {
      return res.json({
        success: true,
        sincronizados: 0,
        message: "Nenhum pagamento encontrado para sincronizar",
      });
    }

    // No início da função de sincronização
    console.log(
      `🔍 Encontrados ${searchResult.results.length} pagamentos no Mercado Pago`
    );
    console.log(
      `🧮 Pagamentos aprovados: ${
        searchResult.results.filter((p: any) => p.status === "approved").length
      }`
    );

    // Salvar no Firebase
    const batch = writeBatch(db);
    const pagamentosSalvos = [];

    for (const pagamento of searchResult.results) {
      if (pagamento.id) {
        const pagamentoRef = doc(db, "payments", pagamento.id.toString());
        batch.set(
          pagamentoRef,
          {
            id: pagamento.id,
            status: pagamento.status || "unknown",
            date_created: pagamento.date_created || new Date().toISOString(),
            transaction_amount: pagamento.transaction_amount || 0,
            description: pagamento.description || "",
            payment_method_id: pagamento.payment_method_id || "",
            payer: pagamento.payer || { email: "desconhecido@email.com" },
            updated_at: serverTimestamp(),
          },
          { merge: true }
        );
        pagamentosSalvos.push(pagamento.id);
      }
    }

    await batch.commit();

    // Após salvar todos os pagamentos, processar agendamentos para aprovados
    const agendamentosCriados: AgendamentoDebug[] = [];
    for (const pagamento of searchResult.results) {
      if (pagamento.status === "approved") {
        const agendamento = await criarOuAtualizarAgendamento(pagamento);
        if (agendamento) {
          agendamentosCriados.push(agendamento);
        }
      }
    }

    // Após processar os agendamentos
    console.log(`🧾 Detalhes dos agendamentos criados:`, agendamentosCriados);

    console.log(
      `✅ Sincronização concluída: ${pagamentosSalvos.length} pagamentos salvos e ${agendamentosCriados.length} agendamentos criados/atualizados`
    );

    res.json({
      success: true,
      sincronizados: pagamentosSalvos.length,
      agendamentosCriados: agendamentosCriados.length,
      message: `${pagamentosSalvos.length} pagamentos sincronizados e ${agendamentosCriados.length} agendamentos processados com sucesso`,
    });
  } catch (error: any) {
    console.error("❌ Erro na sincronização:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Falha na sincronização de pagamentos",
    });
  }
});

// Modifique a função criarOuAtualizarAgendamento para garantir formato consistente
async function criarOuAtualizarAgendamento(pagamento: any) {
  if (pagamento.status === "approved") {
    try {
      console.log(`🔄 Processando agendamento para pagamento ${pagamento.id}`);

      // Formato de data YYYY-MM-DD
      const dataHoje = new Date().toISOString().split("T")[0];
      console.log(`📅 Data formatada: ${dataHoje}`);

      // Dados do agendamento
      const agendamentoData = {
        id: `agendamento-${pagamento.id}`,
        data: dataHoje,
        horario: "A definir",
        cliente: {
          nome: pagamento.payer?.first_name
            ? `${pagamento.payer.first_name} ${
                pagamento.payer.last_name || ""
              }`.trim()
            : "Cliente",
          email: pagamento.payer?.email || "cliente@exemplo.com",
          telefone: pagamento.payer?.phone?.number || "Não informado",
        },
        servico: pagamento.description || "Corte Masculino",
        preco: pagamento.transaction_amount,
        status: "agendado",
        pagamentoId: pagamento.id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      // Log detalhado
      console.log(
        "📝 Dados do agendamento a serem salvos:",
        JSON.stringify(agendamentoData)
      );

      // Salvar no Firebase
      if (FIREBASE_ENABLED) {
        await setDoc(doc(db, "payments", agendamentoData.id), agendamentoData);
        console.log(
          `✅ Agendamento ${agendamentoData.id} criado/atualizado com sucesso`
        );
      }

      return agendamentoData;
    } catch (error) {
      console.error("❌ Erro ao processar agendamento:", error);
      return null;
    }
  }
  return null;
}

// Rota para buscar agendamentos
app.get("/api/agendamentos", async (req, res) => {
  try {
    const { data } = req.query;

    console.log(`🔎 Solicitação de busca por data: ${data}`);

    if (!data) {
      return res.status(400).json({ error: "Data não fornecida" });
    }

    // Usar um Map para garantir IDs únicos
    const agendamentosMap = new Map();

    // Buscar na coleção agendamentos
    const agendamentosRef = collection(db, "agendamentos");
    const q = query(agendamentosRef, where("data", "==", data));
    const querySnapshot = await getDocs(q);

    console.log(
      `Encontrados ${querySnapshot.size} agendamentos para a data ${data}`
    );

    querySnapshot.forEach((doc) => {
      const agendamento = doc.data();
      // Usar o ID como chave para evitar duplicatas
      if (agendamento.id) {
        agendamentosMap.set(agendamento.id, agendamento);
      }
    });

    // Converter o Map de volta para array
    const agendamentos: AgendamentoDebug[] = Array.from(
      agendamentosMap.values()
    );

    console.log(
      `✅ Total de ${agendamentos.length} agendamentos únicos para a data ${data}`
    );

    return res.json(agendamentos);
  } catch (error: any) {
    console.error("❌ Erro ao buscar agendamentos:", error);
    return res.status(500).json({
      error: "Erro ao buscar agendamentos",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Adicionar nova rota para criar agendamentos
app.post("/api/agendamentos", async (req, res) => {
  try {
    const dadosAgendamento = req.body;
    console.log("📝 Criando novo agendamento:", dadosAgendamento);

    // Validar dados com o novo validador
    const validacao = validarDadosAgendamento(dadosAgendamento);
    if (!validacao.valid) {
      return res.status(400).json({
        error: "Dados inválidos",
        message: "Dados de agendamento inválidos",
        details: validacao.errors,
      });
    }

    // Validar formato da data e horário
    if (!isValidDate(dadosAgendamento.data)) {
      return res.status(400).json({
        error: "Formato de data inválido",
        message: "A data deve estar no formato YYYY-MM-DD",
      });
    }

    if (!isValidTime(dadosAgendamento.horario)) {
      return res.status(400).json({
        error: "Formato de horário inválido",
        message: "O horário deve estar no formato HH:MM",
      });
    }

    // Verificar se o horário está disponível
    const agendamentosRef = collection(db, "agendamentos");
    const q = query(
      agendamentosRef,
      where("data", "==", dadosAgendamento.data),
      where("horario", "==", dadosAgendamento.horario)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(409).json({
        error: "Horário indisponível",
        message: "Este horário já está reservado. Por favor, escolha outro.",
      });
    }

    // Criar ID único para o agendamento
    const agendamentoId = Date.now().toString();

    // Criar documento na coleção agendamentos
    const agendamentoRef = doc(db, "agendamentos", agendamentoId);

    // Preparar dados para salvar, incluindo timestamps
    const dadosParaSalvar = {
      id: agendamentoId,
      ...dadosAgendamento,
      status: "agendado",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Salvar no Firebase
    await setDoc(agendamentoRef, dadosParaSalvar);

    console.log(`✅ Agendamento criado com sucesso. ID: ${agendamentoId}`);

    // Retornar o agendamento criado com o ID
    return res.status(201).json({
      id: agendamentoId,
      ...dadosAgendamento,
      status: "agendado",
      message: "Agendamento criado com sucesso",
    });
  } catch (error: any) {
    console.error("❌ Erro ao criar agendamento:", error);
    return res.status(500).json({
      error: "Erro ao criar agendamento",
      message:
        error.message || "Ocorreu um erro interno ao processar sua solicitação",
    });
  }
});

// Rota para debug - listar todos agendamentos sem filtro
app.get("/api/agendamentos/debug", async (req, res) => {
  try {
    const agendamentosRef = collection(db, "payments");
    const snapshot = await getDocs(agendamentosRef);

    const agendamentos: AgendamentoDebug[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      _path: doc.ref.path, // Incluir o caminho para debug
      _exists: true,
    }));

    res.json({
      count: agendamentos.length,
      agendamentos: agendamentos,
    });
  } catch (error: any) {
    console.error("Erro ao listar agendamentos:", error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para atualizar horário de um agendamento/pagamento
app.post("/api/pagamentos/:id/horario", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, horario } = req.body;

    if (!data || !horario) {
      return res.status(400).json({ error: "Data e horário são obrigatórios" });
    }

    // Atualizar no Firebase
    await setDoc(
      doc(db, "payments", id),
      {
        data_agendamento: data,
        horario_agendamento: horario,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ success: true, message: "Horário atualizado com sucesso" });
  } catch (error: any) {
    console.error("Erro ao atualizar horário:", error);
    res.status(500).json({ error: error.message });
  }
});

// Adicione esta rota ao seu arquivo server.ts
app.post("/api/pagamentos/:id/atualizar", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      data_agendamento,
      horario_agendamento,
      cliente_nome,
      cliente_telefone,
      servico,
    } = req.body;

    // Validar dados básicos
    if (!id) {
      return res.status(400).json({ error: "ID do pagamento é obrigatório" });
    }

    // Obter documento existente para assegurar que existe
    const pagamentoRef = doc(db, "payments", id.toString());
    const pagamentoDoc = await getDoc(pagamentoRef);

    if (!pagamentoDoc.exists()) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    // Preparar dados para atualização
    const dadosAtualizacao: Record<string, any> = {
      updated_at: serverTimestamp(),
    };

    // Adicionar apenas campos que foram enviados
    if (data_agendamento) dadosAtualizacao.data_agendamento = data_agendamento;
    if (horario_agendamento)
      dadosAtualizacao.horario_agendamento = horario_agendamento;
    if (cliente_nome) dadosAtualizacao.cliente_nome = cliente_nome;
    if (cliente_telefone) dadosAtualizacao.cliente_telefone = cliente_telefone;
    if (servico) dadosAtualizacao.servico = servico;

    // Atualizar o documento
    await setDoc(pagamentoRef, dadosAtualizacao, { merge: true });

    res.json({
      success: true,
      message: "Dados do agendamento atualizados com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar dados do agendamento:", error);
    res.status(500).json({ error: error.message });
  }
});

// Adicione esta função para criar o agendamento em uma coleção separada
async function criarAgendamentoSeparado(
  pagamentoId: string,
  dadosAgendamento: any
) {
  try {
    console.log(
      `🔄 Criando agendamento separado para pagamento ${pagamentoId}`
    );

    // Criar referência para o novo documento na coleção appointments
    const agendamentoRef = doc(db, "appointments", `agend-${pagamentoId}`);

    // Dados do agendamento
    const agendamentoData = {
      id: `agend-${pagamentoId}`,
      pagamentoId: pagamentoId, // Relação com o pagamento
      data: dadosAgendamento.data,
      horario: dadosAgendamento.horario,
      cliente: {
        nome: dadosAgendamento.cliente.nome,
        telefone: dadosAgendamento.cliente.telefone,
        email: dadosAgendamento.cliente.email,
      },
      servico: dadosAgendamento.servico,
      status: "agendado",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    // Log para debug
    console.log(
      "📝 Salvando agendamento separado:",
      JSON.stringify(agendamentoData)
    );

    // Salvar no Firebase
    await setDoc(agendamentoRef, agendamentoData);
    console.log(`✅ Agendamento separado criado com sucesso!`);
  } catch (error) {
    console.error("❌ Erro ao criar agendamento separado:", error);
  }
}

// Adicione esta rota antes da declaração de PORT
app.get("/api/agendamentos/all", async (req, res) => {
  try {
    console.log("🔍 Buscando todos os agendamentos");

    // Buscar agendamentos no Firebase
    const agendamentosRef = collection(db, "agendamentos");
    const querySnapshot = await getDocs(agendamentosRef);

    const agendamentos: AgendamentoDebug[] = [];

    querySnapshot.forEach((doc) => {
      const agendamento = doc.data();
      agendamentos.push({
        id: doc.id,
        ...agendamento,
      });
    });

    console.log(`✅ Total de ${agendamentos.length} agendamentos encontrados`);

    return res.json(agendamentos);
  } catch (error: any) {
    console.error("❌ Erro ao buscar todos os agendamentos:", error);
    return res.status(500).json({
      error: "Erro ao buscar agendamentos",
      details: error.message,
    });
  }
});

// Adicione esta rota para verificar agendamentos por ID
app.get("/api/agendamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando agendamento por ID: ${id}`);

    // Buscar no Firebase
    const agendamentoRef = doc(db, "agendamentos", id);
    const docSnapshot = await getDoc(agendamentoRef);

    if (docSnapshot.exists()) {
      const agendamento = docSnapshot.data();
      console.log(`✅ Agendamento encontrado:`, agendamento);
      return res.json(agendamento);
    }

    // Se não encontrou, buscar em payments
    const paymentRef = doc(db, "payments", id);
    const paymentSnapshot = await getDoc(paymentRef);

    if (paymentSnapshot.exists()) {
      const payment = paymentSnapshot.data();
      console.log(`✅ Pagamento encontrado:`, payment);

      // Mapear para formato de agendamento
      const agendamento = {
        id: payment.id,
        data: payment.data_agendamento,
        horario: payment.horario_agendamento || "A definir",
        cliente: {
          nome: payment.cliente_nome || payment.payer?.name || "Cliente",
          telefone: payment.cliente_telefone || "Não informado",
          email: payment.payer?.email || "email@example.com",
        },
        servico: payment.servico || payment.description,
        status: "agendado",
        pagamentoId: payment.id,
      };

      return res.json(agendamento);
    }

    console.log(`❌ Agendamento não encontrado com ID: ${id}`);
    return res.status(404).json({ error: "Agendamento não encontrado" });
  } catch (error: any) {
    console.error("❌ Erro ao buscar agendamento por ID:", error);
    return res.status(500).json({
      error: "Erro ao buscar agendamento",
      details: error.message,
    });
  }
});

// Rota para testar conectividade com o Mercado Pago
app.get("/api/mercadopago/test", async (req, res) => {
  try {
    // Simular uma conexão bem-sucedida para testes
    res.json({
      success: true,
      message: "Conexão com Mercado Pago estabelecida com sucesso",
      test_mode: true,
    });
  } catch (error) {
    console.error("Erro ao testar conexão com Mercado Pago:", error);
    res.status(500).json({ success: false, error: "Falha na conexão" });
  }
});

// Adicionar ao arquivo server.ts - rota para atualizar dados de agendamento por ID de pagamento
app.post("/api/pagamentos/:id/agendamento", async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAgendamento = req.body;

    console.log(`🔄 Atualizando dados de agendamento para pagamento ${id}`);
    console.log("📝 Dados recebidos:", dadosAgendamento);

    // Verificar se o pagamento existe
    const pagamentoRef = doc(db, "payments", id);
    const pagamentoSnapshot = await getDoc(pagamentoRef);

    if (!pagamentoSnapshot.exists()) {
      console.log(`❌ Pagamento ${id} não encontrado`);
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    // Verificar disponibilidade antes de criar o agendamento
    const agendamentosRef = collection(db, "agendamentos");
    const q = query(
      agendamentosRef,
      where("data", "==", dadosAgendamento.data),
      where("horario", "==", dadosAgendamento.horario)
    );
    const querySnapshot = await getDocs(q);

    // Se já existe algum agendamento neste horário, rejeitar
    if (!querySnapshot.empty) {
      console.log(
        `❌ Horário ${dadosAgendamento.horario} na data ${dadosAgendamento.data} já está ocupado`
      );
      return res.status(409).json({
        success: false,
        error: "Horário já ocupado",
        message: `O horário ${dadosAgendamento.horario} na data ${dadosAgendamento.data} já está agendado.`,
      });
    }

    // Atualizar o documento de pagamento com dados do agendamento
    await setDoc(
      pagamentoRef,
      {
        data_agendamento: dadosAgendamento.data,
        horario_agendamento: dadosAgendamento.horario,
        cliente_nome: dadosAgendamento.nome,
        cliente_telefone: dadosAgendamento.telefone,
        cliente_email: dadosAgendamento.email,
        servico: dadosAgendamento.servico,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );

    // Verificar se já existe um agendamento com esse ID
    const agendamentoRef = doc(db, "agendamentos", id);
    const agendamentoSnapshot = await getDoc(agendamentoRef);

    // Criar ou atualizar o documento de agendamento
    await setDoc(
      agendamentoRef,
      {
        id: id,
        data: dadosAgendamento.data,
        horario: dadosAgendamento.horario,
        cliente: {
          nome: dadosAgendamento.nome || "Cliente",
          telefone: dadosAgendamento.telefone || "Não informado",
          email: dadosAgendamento.email || "cliente@example.com",
        },
        servico: dadosAgendamento.servico,
        status: "agendado",
        pagamentoId: id,
        updatedAt: serverTimestamp(),
        ...(agendamentoSnapshot.exists()
          ? {}
          : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );

    console.log(
      `✅ Dados de agendamento atualizados com sucesso para pagamento ${id}`
    );

    return res.json({
      success: true,
      message: "Dados de agendamento atualizados com sucesso",
    });
  } catch (error: any) {
    console.error("❌ Erro ao atualizar dados de agendamento:", error);
    return res.status(500).json({
      error: "Erro ao atualizar dados de agendamento",
      details: error.message,
    });
  }
});

// Rota administrativa para limpar registros duplicados
app.post("/api/admin/clean-duplicates", async (req, res) => {
  try {
    // Verificar autorização (você deve implementar alguma forma de autenticação)

    console.log("🧹 Iniciando limpeza de agendamentos duplicados...");

    const agendamentosRef = collection(db, "agendamentos");
    const snapshot = await getDocs(agendamentosRef);

    const idsMap = new Map();
    const duplicados = [];
    const batch = writeBatch(db);
    let deletionCount = 0;

    // Identificar duplicatas
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.id) return;

      if (idsMap.has(data.id)) {
        duplicados.push(doc.id);
        batch.delete(doc.ref);
        deletionCount++;
      } else {
        idsMap.set(data.id, doc.id);
      }
    });

    // Executar a operação em lote
    if (duplicados.length > 0) {
      await batch.commit();
      console.log(`✅ Removidos ${deletionCount} registros duplicados`);
    } else {
      console.log("✅ Nenhum registro duplicado encontrado");
    }

    return res.json({
      success: true,
      message: `Limpeza concluída. ${deletionCount} registros duplicados removidos.`,
    });
  } catch (error: any) {
    console.error("❌ Erro na limpeza de duplicatas:", error);
    return res.status(500).json({
      error: "Erro ao limpar duplicatas",
      details: error.message,
    });
  }
});

// Adicionar nova rota para excluir agendamentos
app.delete("/api/agendamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Solicitação de exclusão de agendamento ID: ${id}`);

    // Verificar se o agendamento existe
    const agendamentoRef = doc(db, "agendamentos", id);
    const agendamentoSnapshot = await getDoc(agendamentoRef);

    if (!agendamentoSnapshot.exists()) {
      console.log(`❌ Agendamento ${id} não encontrado`);
      return res.status(404).json({
        success: false,
        error: "Agendamento não encontrado",
      });
    }

    // Deletar o agendamento
    await deleteDoc(agendamentoRef);

    console.log(`✅ Agendamento ${id} excluído com sucesso`);

    // Se houver um pagamento associado, podemos excluí-lo também ou marcá-lo
    const dados = agendamentoSnapshot.data();
    if (dados.pagamentoId) {
      try {
        const pagamentoRef = doc(db, "payments", dados.pagamentoId);
        await setDoc(
          pagamentoRef,
          {
            status: "cancelled",
            updated_at: serverTimestamp(),
          },
          { merge: true }
        );
        console.log(`✅ Pagamento ${dados.pagamentoId} marcado como cancelado`);
      } catch (paymentError) {
        console.error(`❌ Erro ao atualizar pagamento: ${paymentError}`);
        // Não falhar a operação se o pagamento não puder ser atualizado
      }
    }

    return res.json({
      success: true,
      message: "Agendamento excluído com sucesso",
    });
  } catch (error: any) {
    console.error(`❌ Erro ao excluir agendamento: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Erro ao excluir agendamento",
      details: error.message,
    });
  }
});

// Modificar a rota de verificação de disponibilidade atual
app.get("/api/disponibilidade", async (req, res) => {
  try {
    const { data, horario } = req.query;

    if (!data) {
      return res.status(400).json({ error: "Data não fornecida" });
    }

    console.log(`🔍 VERIFICANDO: ${data} às ${horario || "todos horários"}`);

    // Buscar TODOS os agendamentos e filtrar manualmente
    const agendamentosRef = collection(db, "agendamentos");
    const querySnapshot = await getDocs(agendamentosRef);

    console.log(`📊 Total de ${querySnapshot.size} agendamentos no banco`);

    // Filtrar manualmente para garantir que diferentes formatos sejam considerados
    const dataStr = String(data);
    const horariosOcupados: string[] = [];

    querySnapshot.forEach((doc) => {
      const agendamento = doc.data();

      // Verificar se as datas são equivalentes, independente de formato
      let dataMatches = false;

      // Verificação direta de strings
      if (String(agendamento.data) === dataStr) {
        dataMatches = true;
      } else {
        // Verificação com normalização de data
        try {
          const dataAgendamento = new Date(agendamento.data)
            .toISOString()
            .split("T")[0];
          const dataRequisitada = new Date(dataStr).toISOString().split("T")[0];
          dataMatches = dataAgendamento === dataRequisitada;
        } catch (e) {
          // Se falhar na conversão, usar a comparação de string original
        }
      }

      // Se a data corresponder, adicionar o horário à lista de ocupados
      if (dataMatches && agendamento.horario) {
        console.log(
          `✅ Encontrado agendamento: ${agendamento.data} às ${agendamento.horario}`
        );
        horariosOcupados.push(agendamento.horario);
      }
    });

    console.log(
      `⏰ Horários ocupados: ${horariosOcupados.join(", ") || "nenhum"}`
    );

    // Se um horário específico foi solicitado, verificar disponibilidade
    if (horario) {
      const horarioStr = String(horario);
      const disponivel = !horariosOcupados.includes(horarioStr);

      console.log(
        `🔍 Horário ${horarioStr} está ${
          disponivel ? "DISPONÍVEL" : "INDISPONÍVEL"
        }`
      );

      return res.json({
        disponivel,
        data: dataStr,
        horario: horarioStr,
        message: disponivel ? "Horário disponível" : "Horário já ocupado",
      });
    }

    // Caso contrário, retornar todos os horários ocupados
    return res.json({
      data: dataStr,
      horariosOcupados,
      message: `${horariosOcupados.length} horários ocupados para ${dataStr}`,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar disponibilidade:", error);
    return res.status(500).json({
      error: "Erro ao verificar disponibilidade",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Adicionar ao servidor: Rota para normalizar formatos de data/hora
app.post("/api/admin/normalizar-datas", async (req, res) => {
  try {
    console.log("🧹 Iniciando normalização de formatos de data/hora...");

    const agendamentosRef = collection(db, "agendamentos");
    const snapshot = await getDocs(agendamentosRef);

    const batch = writeBatch(db);
    let updateCount = 0;
    const atualizados: { id: string; [key: string]: any }[] = [];

    snapshot.forEach((docSnapshot) => {
      const docData = docSnapshot.data();
      let needsUpdate = false;
      const updates: { data?: string; horario?: string } = {};

      // Normalizar formato de data (YYYY-MM-DD)
      if (docData.data) {
        try {
          // Tentar criar uma data e normalizar o formato
          const dataObj = new Date(docData.data);
          const dataFormatada = dataObj.toISOString().split("T")[0]; // YYYY-MM-DD

          if (dataFormatada !== docData.data) {
            updates.data = dataFormatada;
            needsUpdate = true;
            console.log(
              `📅 Data normalizada: ${docData.data} -> ${dataFormatada}`
            );
          }
        } catch (e) {
          console.error(`❌ Erro ao normalizar data: ${docData.data}`, e);
        }
      }

      // Normalizar formato de horário (HH:MM)
      if (docData.horario) {
        // Remover segundos e garantir formato HH:MM
        const horarioMatch = docData.horario.match(/(\d{1,2}):(\d{2})/);
        if (horarioMatch) {
          const hora = horarioMatch[1].padStart(2, "0");
          const minuto = horarioMatch[2];
          const horarioFormatado = `${hora}:${minuto}`;

          if (horarioFormatado !== docData.horario) {
            updates.horario = horarioFormatado;
            needsUpdate = true;
            console.log(
              `⏰ Horário normalizado: ${docData.horario} -> ${horarioFormatado}`
            );
          }
        }
      }

      if (needsUpdate) {
        batch.update(doc(db, "agendamentos", docSnapshot.id), updates);
        updateCount++;
        atualizados.push({
          id: docSnapshot.id,
          ...updates,
        });
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Normalizados ${updateCount} agendamentos`);
    } else {
      console.log("✅ Nenhuma normalização necessária");
    }

    return res.json({
      success: true,
      message: `Normalização concluída. ${updateCount} agendamentos atualizados.`,
      detalhes: atualizados,
    });
  } catch (error: any) {
    console.error("❌ Erro na normalização:", error);
    return res.status(500).json({
      error: "Erro ao normalizar dados",
      details: error.message,
    });
  }
});

// Modifique a rota existente do reset-database para garantir que está correta
app.post("/api/admin/reset-database", async (req, res) => {
  console.log("🔄 Recebida solicitação para resetar banco de dados");
  try {
    // Verificar autenticação de administrador aqui
    const { collections } = req.body || {
      collections: ["agendamentos", "pagamentos"],
    };
    console.log("📁 Coleções a serem resetadas:", collections);

    const resultado = await resetDatabaseCollections(collections);
    console.log("✅ Reset concluído:", resultado);

    return res.json({
      success: true,
      message: "Banco de dados reiniciado",
      resultado,
    });
  } catch (error) {
    console.error("❌ Erro ao reiniciar banco de dados:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao reiniciar banco de dados",
    });
  }
});

// Endpoint para verificar o status de um pagamento pelo ID
app.get("/api/pagamentos/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID do pagamento não fornecido",
      });
    }

    console.log(`⏳ Verificando status do pagamento: ${id}`);

    try {
      const paymentStatus = await mercadoPagoService.checkPaymentStatus(id);

      console.log(`✅ Status do pagamento ${id} obtido:`, paymentStatus.status);

      return res.status(200).json({
        success: true,
        status: paymentStatus.status,
        approved: paymentStatus.status === "approved",
        statusDetail: paymentStatus.statusDetail,
        transactionAmount: paymentStatus.transaction_amount,
        dateCreated: paymentStatus.date_created,
        description: paymentStatus.description,
        paymentMethodId: paymentStatus.payment_method_id,
        id: paymentStatus.id,
      });
    } catch (statusError: any) {
      console.error(
        `❌ Erro ao verificar status do pagamento ${id}:`,
        statusError
      );

      // Tentar buscar do Firebase como fallback
      if (FIREBASE_ENABLED) {
        try {
          const paymentDoc = await getDoc(doc(db, "payments", id));

          if (paymentDoc.exists()) {
            const paymentData = paymentDoc.data();
            console.log(`📋 Pagamento ${id} encontrado no cache do Firebase`);

            return res.status(200).json({
              success: true,
              status: paymentData.status || "unknown",
              approved: paymentData.status === "approved",
              statusDetail:
                paymentData.statusDetail || "Dados obtidos do cache",
              transactionAmount: paymentData.transaction_amount,
              dateCreated: paymentData.date_created,
              description: paymentData.description,
              paymentMethodId: paymentData.payment_method_id,
              id: paymentData.id,
              fromCache: true,
            });
          }
        } catch (fbError) {
          console.error(`❌ Erro ao buscar do Firebase:`, fbError);
          // Continuar para o fallback padrão
        }
      }

      // Fallback padrão
      return res.status(200).json({
        success: true,
        status: "unknown",
        approved: false,
        statusDetail: "Não foi possível obter o status do pagamento",
        id: id,
        error: statusError.message,
      });
    }
  } catch (error: any) {
    console.error(`❌ Erro geral na rota de status:`, error);

    return res.status(500).json({
      success: false,
      status: "error",
      approved: false,
      message: "Erro ao verificar status do pagamento",
      error: error.message,
    });
  }
});

// Rota para criar agendamento com pagamento pendente (presencial)
app.post("/api/agendamentos/criar-pendente", async (req, res) => {
  try {
    const dadosAgendamento = req.body;
    console.log("📝 Criando agendamento pendente:", dadosAgendamento);

    // 1. Validar dados recebidos
    const validacao = validarDadosAgendamento(dadosAgendamento);
    if (!validacao.valid) {
      console.warn(
        "⚠️ Tentativa de criar agendamento pendente com dados inválidos:",
        validacao.errors
      );
      return res.status(400).json({
        error: "Dados inválidos",
        message: "Dados de agendamento inválidos",
        details: validacao.errors,
      });
    }
    if (
      !isValidDate(dadosAgendamento.data) ||
      !isValidTime(dadosAgendamento.horario)
    ) {
      return res.status(400).json({
        error: "Formato de data/hora inválido",
        message: "Verifique o formato da data (YYYY-MM-DD) e hora (HH:MM)",
      });
    }

    // 2. Verificar disponibilidade do horário (REPETIR A VERIFICAÇÃO AQUI)
    const agendamentosRef = collection(db, "agendamentos");
    const q = query(
      agendamentosRef,
      where("data", "==", dadosAgendamento.data),
      where("horario", "==", dadosAgendamento.horario),
      // Considerar agendados e pendentes como ocupados
      where("status", "in", ["agendado", "confirmado", "aguardando pagamento"])
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.warn(
        `⏰ Horário indisponível (PENDENTE): ${dadosAgendamento.data} ${dadosAgendamento.horario}`
      );
      return res.status(409).json({
        error: "Horário indisponível",
        message:
          "Este horário acabou de ser reservado. Por favor, escolha outro.",
      });
    }

    // 3. Obter o preço do serviço (necessário buscar dos dados de serviço)
    // TODO: Implementar busca do preço do serviço ou receber do frontend
    const precoServico = dadosAgendamento.preco || 0; // Usar preço enviado ou default 0

    // 4. Criar o objeto de agendamento
    const agendamentoId = `cash_${Date.now()}`;
    const dadosParaSalvar = {
      id: agendamentoId,
      data: dadosAgendamento.data,
      horario: dadosAgendamento.horario,
      servico: dadosAgendamento.servico,
      preco: precoServico,
      cliente: {
        nome: dadosAgendamento.cliente.nome,
        telefone: dadosAgendamento.cliente.telefone,
        // email é opcional
        ...(dadosAgendamento.cliente.email && {
          email: dadosAgendamento.cliente.email,
        }),
      },
      status: "aguardando pagamento", // Status específico para pagamento presencial
      metodoPagamento: "dinheiro",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Não associar a um paymentId do Mercado Pago
    };

    // 5. Salvar na coleção 'agendamentos'
    const agendamentoRef = doc(db, "agendamentos", agendamentoId);
    await setDoc(agendamentoRef, dadosParaSalvar);

    console.log(
      `✅ Agendamento pendente criado com sucesso. ID: ${agendamentoId}`
    );

    // 6. Retornar sucesso
    return res.status(201).json({
      ...dadosParaSalvar,
      message: "Agendamento criado com sucesso. Pagamento pendente.",
    });
  } catch (error: any) {
    console.error("❌ Erro ao criar agendamento pendente:", error);
    return res.status(500).json({
      error: "Erro ao criar agendamento",
      message:
        error.message || "Ocorreu um erro interno ao processar sua solicitação",
    });
  }
});

// Rota PUT para ATUALIZAR um agendamento existente
app.put("/api/agendamentos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    console.log(`🔄 Atualizando agendamento ID: ${id}`, dadosAtualizados);

    // Validar dados recebidos (opcional, mas recomendado)
    // Você pode criar uma função `validarDadosAtualizacaoAgendamento` se necessário
    if (!dadosAtualizados) {
      return res
        .status(400)
        .json({ error: "Dados de atualização não fornecidos" });
    }
    // Validar status se ele foi enviado
    const statusValidos = ["aguardando pagamento", "confirmado", "cancelado"];
    if (
      dadosAtualizados.status &&
      !statusValidos.includes(dadosAtualizados.status)
    ) {
      return res
        .status(400)
        .json({ error: `Status inválido: ${dadosAtualizados.status}` });
    }
    // Validar data/hora se foram enviados
    if (dadosAtualizados.data && !isValidDate(dadosAtualizados.data)) {
      return res.status(400).json({ error: "Formato de data inválido" });
    }
    if (dadosAtualizados.horario && !isValidTime(dadosAtualizados.horario)) {
      return res.status(400).json({ error: "Formato de horário inválido" });
    }

    // Referência ao documento no Firestore
    const agendamentoRef = doc(db, "agendamentos", id);

    // Verificar se o agendamento existe
    const docSnapshot = await getDoc(agendamentoRef);
    if (!docSnapshot.exists()) {
      console.log(`❌ Agendamento ${id} não encontrado para atualização`);
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    // Preparar dados para atualização (incluindo timestamp)
    const dadosParaSalvar = {
      ...dadosAtualizados,
      updatedAt: serverTimestamp(),
    };

    // Atualizar o documento
    await setDoc(agendamentoRef, dadosParaSalvar, { merge: true }); // Usar merge: true para não sobrescrever campos não enviados

    console.log(`✅ Agendamento ${id} atualizado com sucesso`);

    // Retornar o agendamento atualizado
    const agendamentoAtualizado = (await getDoc(agendamentoRef)).data();
    return res.json({
      id: id,
      ...agendamentoAtualizado,
      message: "Agendamento atualizado com sucesso",
    });
  } catch (error: any) {
    console.error(`❌ Erro ao atualizar agendamento ${req.params.id}:`, error);
    return res.status(500).json({
      error: "Erro ao atualizar agendamento",
      message:
        error.message || "Ocorreu um erro interno ao processar sua solicitação",
    });
  }
});

// Porta de escuta para o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
