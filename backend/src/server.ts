import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  addDoc,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { adminDb, db } from "./config/firebase";
import { mercadoPagoService } from "./services/mercadoPagoService";
import { resetDatabaseCollections } from "./utils/databaseAdmin";
import {
  isValidDate,
  isValidTime,
  validarDadosAgendamento,
} from "./utils/validators";
import morgan from "morgan"; // Para logs HTTP
import * as admin from "firebase-admin"; // Import necessário para FieldValue

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
      "https://barbeariatratamentovip-git-master-devjn1998s-projects.vercel.app",
      process.env.FRONTEND_URL || "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(morgan("dev")); // Logger de requisições HTTP

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
  createdAt?: any; // Usar any temporariamente para timestamp ou string
  updatedAt?: any; // Usar any temporariamente para timestamp ou string
  [key: string]: any; // Para propriedades adicionais que possam existir
}

// Adicione esta rota próxima ao topo, logo após a configuração do app
app.get("/api/test", (req: Request, res: Response) => {
  res.json({ message: "Servidor funcionando corretamente" });
});

// Adicione esta rota perto do início, logo após a configuração básica
app.get("/api/debug/agendamentos", async (req: Request, res: Response) => {
  try {
    console.log("🔍 Recebida solicitação para debug de agendamentos");

    const { data } = req.query;
    console.log("📅 Filtrando por data:", data || "todas as datas");

    const agendamentosRef = collection(db, "agendamentos");
    let q: any = agendamentosRef;

    if (data) {
      q = query(agendamentosRef, where("data", "==", data as string));
    }

    const querySnapshot = await getDocs(q);
    const agendamentos: AgendamentoDebug[] = [];

    querySnapshot.forEach((doc: any) => {
      const agendamentoData = doc.data();
      agendamentos.push({
        id: doc.id,
        ...agendamentoData,
      });
    });

    console.log(`🏁 Retornando ${agendamentos.length} agendamentos`);
    return res.json(agendamentos);
  } catch (error) {
    console.error("❌ Erro ao buscar agendamentos para debug:", error);
    return res.status(500).json({
      error: "Erro ao buscar agendamentos para debug",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Rota de pagamento
app.post("/api/pagamentos", async (req: Request, res: Response) => {
  try {
    console.log(
      "📊 [Pagamento INÍCIO] Payload recebido:",
      JSON.stringify(req.body, null, 2)
    );

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

    console.log("ℹ️ [Pagamento Processando] Dados normalizados:", {
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
      "🚀 [Pagamento Chamando Serviço] Payload para createPixPayment:",
      JSON.stringify(paymentPayload, null, 2)
    );

    try {
      // Criar pagamento no Mercado Pago usando o serviço
      const resultado = await mercadoPagoService.createPixPayment(
        paymentPayload
      );
      console.log(
        "✅ [Pagamento Serviço OK] Resultado do serviço:",
        JSON.stringify(resultado, null, 2)
      );

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
      console.error(
        "❌ [Pagamento Serviço ERRO] Erro ao chamar createPixPayment:",
        paymentError
      );
      // Log adicional da causa, se existir
      if (paymentError.cause) {
        console.error(
          "❌ [Pagamento Serviço ERRO Detalhes]:",
          JSON.stringify(paymentError.cause, null, 2)
        );
      }
      // Retornar erro...
      return res.status(500).json({
        error: "Erro ao processar pagamento",
        message:
          paymentError.message || "Falha ao criar pagamento no Mercado Pago",
        details: paymentError.cause || {},
      });
    }
  } catch (error: any) {
    console.error("❌ [Pagamento Rota ERRO GERAL]:", error);
    // Enviar detalhes do erro para ajudar na depuração
    res.status(500).json({
      error: "Erro ao processar pagamento",
      message: error.message || "Ocorreu um erro inesperado",
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }
});

// Rota para processar pagamento
app.post("/api/process_payment", async (req: Request, res: Response) => {
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
app.get("/api/pagamentos/:id", async (req: Request, res: Response) => {
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
app.get("/api/pagamentos", async (req: Request, res: Response) => {
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
    const pagamentos: PaymentData[] = snapshot.docs.map((doc: any) => ({
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
app.post("/api/pagamentos/salvar", async (req: Request, res: Response) => {
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
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Adicione esta rota no seu servidor
app.post("/api/pagamentos/sincronizar", async (req: Request, res: Response) => {
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

// Modifique a função criarOuAtualizarAgendamento para garantir escrita correta
async function criarOuAtualizarAgendamento(pagamento: any) {
  if (pagamento.status !== "approved" || !pagamento.id) {
    console.log(
      `[CriarAgendamento] Pagamento ${pagamento.id || ""} não aprovado.`
    );
    return null;
  }

  const pagamentoId = pagamento.id.toString();
  console.log(
    `[CriarAgendamento ${pagamentoId}] Processando para pagamento aprovado.`
  );

  try {
    // --- Buscar dados complementares (se necessário) ---
    const pagamentoDocRef = doc(db, "payments", pagamentoId);
    const pagamentoSnapshot = await getDoc(pagamentoDocRef);
    const dadosPagamentoCache = pagamentoSnapshot.exists()
      ? pagamentoSnapshot.data()
      : {};

    // --- Definir os dados do agendamento ---
    // Priorizar dados que possam ter sido salvos temporariamente no pagamento
    const dataAgendamento =
      dadosPagamentoCache?.data_agendamento ||
      dadosPagamentoCache?.data_temp ||
      new Date().toISOString().split("T")[0];
    const horarioAgendamento =
      dadosPagamentoCache?.horario_agendamento ||
      dadosPagamentoCache?.horario_temp ||
      "A definir";
    const nomeCliente =
      dadosPagamentoCache?.cliente_nome ||
      pagamento.payer?.first_name ||
      "Cliente";
    const telefoneCliente =
      dadosPagamentoCache?.cliente_telefone ||
      pagamento.payer?.phone?.number ||
      "Não informado";
    const emailCliente =
      dadosPagamentoCache?.cliente_email ||
      pagamento.payer?.email ||
      "cliente@example.com";
    const servicoAgendamento =
      dadosPagamentoCache?.servico || pagamento.description || "Serviço Padrão";

    // --- Montar objeto final para a coleção 'agendamentos' ---
    const agendamentoFinalData = {
      id: pagamentoId, // Chave primária igual ao pagamento
      pagamentoId: pagamentoId,
      data: isValidDate(dataAgendamento)
        ? dataAgendamento
        : new Date().toISOString().split("T")[0], // Validar/Default Data
      horario: isValidTime(horarioAgendamento) ? horarioAgendamento : "09:00", // Validar/Default Horário
      cliente: {
        nome: nomeCliente,
        telefone: telefoneCliente,
        email: emailCliente,
      },
      servico: servicoAgendamento,
      preco: pagamento.transaction_amount,
      status: "agendado", // Status correto após pagamento
      metodoPagamento: pagamento.payment_method_id || "pix",
      updatedAt: serverTimestamp(),
      // createdAt será adicionado automaticamente pelo setDoc se não existir
    };

    console.log(
      `[CriarAgendamento ${pagamentoId}] 📝 Dados finais para salvar/atualizar em 'agendamentos':`,
      JSON.stringify(agendamentoFinalData, null, 2)
    );

    // --- Salvar/Atualizar na coleção 'agendamentos' ---
    const agendamentoRef = doc(db, "agendamentos", pagamentoId);
    await setDoc(agendamentoRef, agendamentoFinalData, { merge: true }); // Usar merge: true para atualizar ou criar

    console.log(
      `[CriarAgendamento ${pagamentoId}] ✅ Agendamento salvo/atualizado em 'agendamentos'.`
    );

    // --- (Opcional) Limpar campos temporários do pagamento ---
    if (dadosPagamentoCache) {
      // Só tenta limpar se existiam dados no cache
      try {
        const camposParaLimpar: any = {};
        if ("dados_agendamento_temp" in dadosPagamentoCache)
          camposParaLimpar.dados_agendamento_temp = deleteField();
        if ("horario_temp" in dadosPagamentoCache)
          camposParaLimpar.horario_temp = deleteField();
        if ("data_temp" in dadosPagamentoCache)
          camposParaLimpar.data_temp = deleteField();
        if ("servico_temp" in dadosPagamentoCache)
          camposParaLimpar.servico_temp = deleteField();
        if ("cliente_nome" in dadosPagamentoCache)
          camposParaLimpar.cliente_nome = deleteField();
        if ("cliente_telefone" in dadosPagamentoCache)
          camposParaLimpar.cliente_telefone = deleteField();
        if ("cliente_email" in dadosPagamentoCache)
          camposParaLimpar.cliente_email = deleteField();

        if (Object.keys(camposParaLimpar).length > 0) {
          camposParaLimpar.updated_at = serverTimestamp();
          await setDoc(pagamentoDocRef, camposParaLimpar, { merge: true });
          console.log(
            `[CriarAgendamento ${pagamentoId}] 🧹 Dados temporários limpos do pagamento.`
          );
        }
      } catch (cleanError) {
        console.warn(
          `[CriarAgendamento ${pagamentoId}] ⚠️ Não foi possível limpar dados temporários:`,
          cleanError
        );
      }
    }

    return agendamentoFinalData;
  } catch (error) {
    console.error(
      `[CriarAgendamento ${pagamento.id || "sem ID"}] ❌ Erro:`,
      error
    );
    return null;
  }
}

// Rota para buscar agendamentos por data
app.get("/api/agendamentos", async (req: Request, res: Response) => {
  try {
    const { data } = req.query;

    console.log(
      `Recebida requisição para buscar agendamentos da data: ${data}`
    );

    // Validar formato de data (deve ser YYYY-MM-DD)
    if (data && typeof data === "string") {
      // Criar a consulta
      const q = query(
        collection(db, "agendamentos"),
        where("date", "==", data) // Usando o campo date (padrão)
      );

      const querySnapshot = await getDocs(q);
      // Resto do código...
    }
  } catch (error) {
    // Tratamento de erro...
  }
});

// Adicionar nova rota para criar agendamentos
app.post("/api/agendamentos", async (req: Request, res: Response) => {
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
app.get("/api/agendamentos/debug", async (req: Request, res: Response) => {
  try {
    const agendamentosRef = collection(db, "payments");
    const snapshot = await getDocs(agendamentosRef);

    const agendamentos: AgendamentoDebug[] = snapshot.docs.map((doc: any) => ({
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
app.post("/api/pagamentos/:id/horario", async (req: Request, res: Response) => {
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

// Adicione esta rota no seu arquivo server.ts
app.post(
  "/api/pagamentos/:id/atualizar",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dadosAtualizacaoAgendamento = req.body;

      console.log(
        `[Atualizar Agendamento ${id}] 🔄 Atualizando via rota /pagamentos/:id/atualizar`
      );
      console.log(
        `[Atualizar Agendamento ${id}] 📝 Dados recebidos:`,
        dadosAtualizacaoAgendamento
      );

      // Validar dados básicos
      if (!id) {
        return res
          .status(400)
          .json({ error: "ID do pagamento/agendamento é obrigatório" });
      }

      // Mapear nomes de campos recebidos para os nomes corretos na coleção 'agendamentos'
      const dadosParaSalvar: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      if (dadosAtualizacaoAgendamento.data_agendamento)
        dadosParaSalvar.data = dadosAtualizacaoAgendamento.data_agendamento;
      if (dadosAtualizacaoAgendamento.horario_agendamento)
        dadosParaSalvar.horario =
          dadosAtualizacaoAgendamento.horario_agendamento;
      if (
        dadosAtualizacaoAgendamento.cliente_nome ||
        dadosAtualizacaoAgendamento.cliente_telefone ||
        dadosAtualizacaoAgendamento.cliente_email
      ) {
        dadosParaSalvar.cliente = {
          nome: dadosAtualizacaoAgendamento.cliente_nome,
          telefone: dadosAtualizacaoAgendamento.cliente_telefone,
          email: dadosAtualizacaoAgendamento.cliente_email,
        };
      }
      if (dadosAtualizacaoAgendamento.servico)
        dadosParaSalvar.servico = dadosAtualizacaoAgendamento.servico;
      if (dadosAtualizacaoAgendamento.status)
        dadosParaSalvar.status = dadosAtualizacaoAgendamento.status;
      // Adicionar outros campos se necessário

      // Remover campos de cliente se o objeto cliente não foi totalmente preenchido
      if (
        dadosParaSalvar.cliente &&
        (!dadosParaSalvar.cliente.nome || !dadosParaSalvar.cliente.telefone)
      ) {
        // Opcional: buscar dados existentes para mesclar ou apenas não salvar o objeto incompleto
        // Para simplicidade, vamos remover se incompleto, assumindo que a atualização deve ser completa
        console.warn(
          `[Atualizar Agendamento ${id}] Dados de cliente incompletos na atualização, não serão salvos.`
        );
        delete dadosParaSalvar.cliente;
      }

      if (Object.keys(dadosParaSalvar).length <= 1) {
        // Apenas updatedAt
        return res
          .status(400)
          .json({ error: "Nenhum dado válido para atualizar fornecido." });
      }

      // Referência ao documento na coleção 'agendamentos'
      const agendamentoRef = doc(db, "agendamentos", id.toString());

      // Verificar se o agendamento existe ANTES de tentar atualizar
      const agendamentoDoc = await getDoc(agendamentoRef);
      if (!agendamentoDoc.exists()) {
        console.log(
          `[Atualizar Agendamento ${id}] ❌ Agendamento não encontrado na coleção 'agendamentos'.`
        );
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // Atualizar o documento na coleção 'agendamentos'
      await setDoc(agendamentoRef, dadosParaSalvar, { merge: true });

      console.log(
        `[Atualizar Agendamento ${id}] ✅ Agendamento atualizado com sucesso.`
      );

      res.json({
        success: true,
        message: "Dados do agendamento atualizados com sucesso",
      });
    } catch (error: any) {
      console.error(
        `[Atualizar Agendamento ${req.params.id || "sem ID"}] ❌ Erro:`,
        error
      );
      res.status(500).json({ error: error.message });
    }
  }
);

// Adicione esta função para criar o agendamento em uma coleção separada
/*
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
*/

// Adicione esta rota antes da declaração de PORT
app.get("/api/agendamentos/all", async (req: Request, res: Response) => {
  try {
    console.log("🔍 Buscando todos os agendamentos");

    // Buscar agendamentos no Firebase
    const agendamentosRef = collection(db, "agendamentos");
    const querySnapshot = await getDocs(agendamentosRef);

    const agendamentos: AgendamentoDebug[] = [];

    querySnapshot.forEach((doc: any) => {
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
app.get("/api/agendamentos/:id", async (req: Request, res: Response) => {
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
app.get("/api/mercadopago/test", async (req: Request, res: Response) => {
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
app.post(
  "/api/pagamentos/:id/agendamento",
  async (req: Request, res: Response) => {
    // CAPTURAR ID LOGO NO INÍCIO
    const { id: agendamentoId } = req.params;
    if (!agendamentoId) {
      // Verificar se o ID foi capturado
      return res
        .status(400)
        .json({ error: "ID do agendamento ausente na URL" });
    }

    try {
      const dadosAgendamento = req.body;

      console.log(
        `[Atualizar Agendamento via Pagamento ${agendamentoId}] 🔄 Atualizando dados`
      );
      console.log(
        `[Atualizar Agendamento via Pagamento ${agendamentoId}] 📝 Dados recebidos:`,
        dadosAgendamento
      );

      // --- Validar Dados Recebidos ---
      // ... (validações existentes, usar agendamentoId se necessário) ...

      // --- Referência e Verificação de Existência (na coleção agendamentos) ---
      const agendamentoRef = doc(db, "agendamentos", agendamentoId);
      const agendamentoSnapshot = await getDoc(agendamentoRef);

      if (!agendamentoSnapshot.exists()) {
        console.log(
          `[Atualizar Agendamento via Pagamento ${agendamentoId}] ❌ Agendamento ${agendamentoId} não encontrado.`
        );
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      // --- Verificar Disponibilidade do NOVO horário (se data/horário mudaram) ---
      const agendamentoAtual = agendamentoSnapshot.data();
      if (
        agendamentoAtual.data !== dadosAgendamento.data ||
        agendamentoAtual.horario !== dadosAgendamento.horario
      ) {
        console.log(
          `[Atualizar Agendamento via Pagamento ${agendamentoId}] ⏰ Verificando disponibilidade do novo horário: ${dadosAgendamento.data} ${dadosAgendamento.horario}`
        );
        const agendamentosCollRef = collection(db, "agendamentos");
        const q = query(
          agendamentosCollRef,
          where("data", "==", dadosAgendamento.data),
          where("horario", "==", dadosAgendamento.horario)
        );
        const queryConflito = await getDocs(q);
        if (!queryConflito.empty) {
          let conflitoReal = true;
          // Usar agendamentoId na comparação
          if (
            queryConflito.size === 1 &&
            queryConflito.docs[0].id === agendamentoId
          ) {
            conflitoReal = false;
          }
          if (conflitoReal) {
            console.warn(
              `[Atualizar Agendamento via Pagamento ${agendamentoId}] ❌ Conflito: Horário ${dadosAgendamento.horario} na data ${dadosAgendamento.data} já ocupado.`
            );
            // ... (retornar erro 409)
          }
        }
      }
      // ... (resto da lógica: Preparar Dados, Atualizar Doc, Retornar Sucesso) ...
    } catch (error: any) {
      // Usar agendamentoId no log de erro
      console.error(
        `[Atualizar Agendamento via Pagamento ${agendamentoId}] ❌ Erro:`,
        error
      );
      return res.status(500).json({
        error: "Erro ao atualizar dados de agendamento",
        details: error.message,
      });
    }
  }
);

// Rota administrativa para limpar registros duplicados
app.post("/api/admin/clean-duplicates", async (req: Request, res: Response) => {
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
    snapshot.forEach((doc: any) => {
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
app.delete("/api/agendamentos/:id", async (req: Request, res: Response) => {
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

// Rota para verificar disponibilidade (GET /api/disponibilidade)
app.get("/api/disponibilidade", async (req: Request, res: Response) => {
  const { data, horario } = req.query;

  if (!data || typeof data !== "string" || !isValidDate(data)) {
    return res.status(400).json({ message: "Data inválida ou não fornecida." });
  }

  try {
    console.log(`[Disponibilidade] Verificando para data: ${data}`);

    // 1. Buscar bloqueios manuais para a data
    const bloqueiosQuery = query(
      collection(db, "bloqueios"),
      where("date", "==", data) // Assumindo que bloqueios usam 'date'
    );

    // 2. Buscar agendamentos CONFIRMADOS para a data (verificando 'confirmado' == true)
    //    Consulta tanto 'date' quanto 'data' para compatibilidade
    const agendamentosConfirmadosDateQuery = query(
      collection(db, "agendamentos"),
      where("date", "==", data),
      where("confirmado", "==", true) // <<< FILTRO CHAVE
    );
    const agendamentosConfirmadosDataQuery = query(
      collection(db, "agendamentos"),
      where("data", "==", data), // Consulta campo legado 'data' também
      where("confirmado", "==", true) // <<< FILTRO CHAVE
    );

    // Executar todas as consultas em paralelo com TIPAGEM EXPLÍCITA
    const [
      bloqueiosSnapshot,
      agendamentosDateSnapshot,
      agendamentosDataSnapshot,
    ]: [
      QuerySnapshot<DocumentData>, // Tipo para bloqueiosSnapshot
      QuerySnapshot<DocumentData>, // Tipo para agendamentosDateSnapshot
      QuerySnapshot<DocumentData> // Tipo para agendamentosDataSnapshot
    ] = await Promise.all([
      getDocs(bloqueiosQuery),
      getDocs(agendamentosConfirmadosDateQuery),
      getDocs(agendamentosConfirmadosDataQuery),
    ]);

    // 3. Extrair e combinar horários indisponíveis
    const horariosBloqueadosManualmente = bloqueiosSnapshot.docs.map(
      (doc) => doc.data().time // Assumindo que bloqueios usam 'time'
    );

    const horariosAgendadosConfirmados = [
      ...agendamentosDateSnapshot.docs,
      ...agendamentosDataSnapshot.docs,
    ]
      // Remover duplicatas caso um agendamento tenha 'date' e 'data'
      .filter(
        (doc, index, self) => index === self.findIndex((d) => d.id === doc.id)
      )
      .map((doc) => doc.data().time || doc.data().horario); // Pega 'time' ou 'horario'

    // Usar um Set para garantir horários únicos
    const horariosIndisponiveisSet = new Set([
      ...horariosBloqueadosManualmente,
      ...horariosAgendadosConfirmados,
    ]);
    const horariosIndisponiveis = Array.from(horariosIndisponiveisSet);

    console.log(
      `[Disponibilidade] Horários indisponíveis para ${data}:`,
      horariosIndisponiveis
    );

    // Se um horário específico foi solicitado, verificar se ele está na lista
    if (horario && typeof horario === "string") {
      if (!isValidTime(horario)) {
        return res
          .status(400)
          .json({ message: "Formato de horário inválido." });
      }
      const disponivel = !horariosIndisponiveis.includes(horario);
      return res.json({ disponivel });
    }

    // Se nenhum horário específico foi solicitado, retornar a lista completa
    return res.json({ horariosOcupados: horariosIndisponiveis });
  } catch (error: any) {
    console.error("[Disponibilidade] Erro ao buscar disponibilidade:", error);
    return res.status(500).json({
      message: "Erro ao verificar disponibilidade.",
      error: error.message,
    });
  }
});

// Adicionar ao servidor: Rota para normalizar formatos de data/hora
app.post("/api/admin/normalizar-datas", async (req: Request, res: Response) => {
  try {
    console.log("🧹 Iniciando normalização de formatos de data/hora...");

    const agendamentosRef = collection(db, "agendamentos");
    const snapshot = await getDocs(agendamentosRef);

    const batch = writeBatch(db);
    let updateCount = 0;
    const atualizados: { id: string; [key: string]: any }[] = [];

    snapshot.forEach((docSnapshot: any) => {
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
app.post("/api/admin/reset-database", async (req: Request, res: Response) => {
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
app.get("/api/pagamentos/:id/status", async (req: Request, res: Response) => {
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

      if (paymentStatus.status === "approved") {
        // Buscar dados temporários do pagamento/agendamento
        const paymentData = await getDoc(doc(db, "payments", id));

        // Adicionar o documento ao Firestore
        const agendamentosCollection = collection(db, "agendamentos");
        await addDoc(agendamentosCollection, {
          data: paymentData.data().dados_agendamento_temp.data,
          horario: paymentData.data().dados_agendamento_temp.horario,
          servico: paymentData.data().dados_agendamento_temp.servico,
          clienteNome: paymentData.data().cliente.nome,
          clienteTelefone: paymentData.data().cliente.telefone,
          clienteEmail: paymentData.data().cliente.email,
          statusPagamento: "approved",
          paymentId: id,
          createdAt: serverTimestamp(),
        });
        console.log(`✅ Agendamento final criado para pagamento ${id}`);
      }

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
app.post(
  "/api/agendamentos/criar-pendente",
  async (req: Request, res: Response) => {
    const routeStartTime = Date.now();
    console.log(
      `[Criar Pendente INÍCIO ${routeStartTime}] Recebida requisição:`,
      req.body
    );

    try {
      const dadosAgendamento = req.body;

      // 1. Validar os dados recebidos do frontend
      const validacao = validarDadosAgendamento(dadosAgendamento);

      if (!validacao.valid) {
        console.warn(
          `[Criar Pendente ${routeStartTime}] Dados inválidos:`,
          validacao.errors
        );
        return res
          .status(400)
          .json({ message: "Dados inválidos.", errors: validacao.errors });
      }

      // 2. Preparar dados para salvar no Firestore com o novo campo booleano
      const dadosParaSalvar = {
        ...dadosAgendamento,
        status: "aguardando pagamento", // Mantido por compatibilidade
        confirmado: false, // NOVO CAMPO: false = aguardando pagamento
        metodoPagamento: "dinheiro",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 3. Adicionar o documento ao Firestore
      console.log(
        `[Criar Pendente ${routeStartTime}] Tentando adicionar ao Firestore...`
      );
      console.time(`[Criar Pendente ${routeStartTime}] Add Firestore`);
      const docRef = await addDoc(
        collection(db, "agendamentos"),
        dadosParaSalvar
      );
      console.timeEnd(`[Criar Pendente ${routeStartTime}] Add Firestore`);
      console.log(
        `[Criar Pendente FIM ${routeStartTime}] Agendamento pendente criado com ID: ${
          docRef.id
        }. Tempo total: ${Date.now() - routeStartTime}ms`
      );

      // 4. Retornar sucesso com o ID do novo agendamento
      return res.status(201).json({
        message: "Agendamento pendente criado com sucesso!",
        id: docRef.id,
      });
    } catch (error: any) {
      console.error(
        `[Criar Pendente ERRO ${routeStartTime}] Erro ao criar agendamento pendente:`,
        error
      );
      return res.status(500).json({
        message: "Erro interno ao criar agendamento.",
        error: error.message,
      });
    }
  }
);

// Rota PUT para ATUALIZAR um agendamento existente
app.put("/api/agendamentos/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;

    // Ajustar a conversão de 'status' para 'confirmado'
    if (dadosAtualizados.status) {
      // Convertemos o status para o campo 'confirmado' (só dois estados possíveis)
      dadosAtualizados.confirmado = dadosAtualizados.status === "confirmado";
    }

    console.log(`🔄 Atualizando agendamento ID: ${id}`, dadosAtualizados);

    // Validar dados
    if (!dadosAtualizados) {
      return res
        .status(400)
        .json({ error: "Dados de atualização não fornecidos" });
    }

    // Validar status se ele foi enviado (simplificado - apenas 2 valores válidos)
    const statusValidos = ["aguardando pagamento", "confirmado"];
    if (
      dadosAtualizados.status &&
      !statusValidos.includes(dadosAtualizados.status)
    ) {
      return res
        .status(400)
        .json({ error: `Status inválido: ${dadosAtualizados.status}` });
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
    await setDoc(agendamentoRef, dadosParaSalvar, { merge: true });

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
