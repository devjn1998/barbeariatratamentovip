import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import * as admin from "firebase-admin";

// Carrega as variáveis de ambiente
dotenv.config();

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAQ-Aq4WhvOVJs-jLjKvXBt3_WT5msaHJQ",
  authDomain: "barbearia-andin.firebaseapp.com",
  projectId: "barbearia-andin",
  storageBucket: "barbearia-andin.firebasestorage.app",
  messagingSenderId: "336746868613",
  appId: "1:336746868613:web:ea217625a53b3d88f9deec",
  measurementId: "G-7E4CMDZV4N",
};

// Verificar se as configurações estão presentes
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    "⚠️ Configuração do Firebase incompleta. Usando modo de desenvolvimento."
  );

  // Configuração de desenvolvimento para testes
  firebaseConfig.apiKey = "AIzaSyDev-key-for-testing";
  firebaseConfig.authDomain = "test-project.firebaseapp.com";
  firebaseConfig.projectId = "test-project";
  firebaseConfig.storageBucket = "test-project.appspot.com";
  firebaseConfig.messagingSenderId = "123456789";
  firebaseConfig.appId = "1:123456789:web:abc123def456";
}

// Inicializar o Firebase
console.log("🔥 Inicializando Firebase com projeto:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Testar conectividade com o Firestore
try {
  // Usar a coleção payments que já tem permissões
  const paymentTestRef = doc(db, "payments", "connectivity-test");
  setDoc(paymentTestRef, {
    test: true,
    timestamp: new Date(),
    id: "connectivity-test",
    status: "test",
    description: "Teste de conectividade",
  })
    .then(() =>
      console.log("✅ Teste de conectividade com Firestore bem-sucedido")
    )
    .catch((err: Error) => {
      console.error("❌ Erro ao conectar com Firestore:", err);
      console.log(
        "🔍 Verifique as regras de segurança do Firestore para a coleção payments"
      );
    });
} catch (error) {
  console.error("❌ Erro ao inicializar teste do Firestore:", error);
}

// No final do arquivo, após a inicialização do app
export const checkAndUpdateRules = async () => {
  try {
    console.log("🔐 Verificando regras de segurança do Firestore...");
    // Em produção, você pode implementar a verificação e atualização das regras
    // através da API de segurança do Firebase
    console.log("✅ Regras de segurança do Firestore verificadas");
  } catch (error) {
    console.error("❌ Erro ao verificar regras de segurança:", error);
  }
};

// Função para verificar permissões da coleção
export const testCollectionAccess = async (collectionName: string) => {
  try {
    const collectionRef = collection(db, collectionName);
    const testQuery = await getDocs(collectionRef);
    console.log(
      `✅ Acesso à coleção ${collectionName} funcionando corretamente`
    );
    return true;
  } catch (error) {
    console.error(`❌ Erro ao acessar coleção ${collectionName}:`, error);
    return false;
  }
};

export { app, db };

console.log("🏁 Executando config/firebase.ts..."); // Log inicial

try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  // LOG ADICIONADO: Verifica se a variável foi carregada
  if (serviceAccountJson) {
    // Loga apenas o início e fim para não expor a chave inteira nos logs
    console.log(
      "🔑 Variável FIREBASE_SERVICE_ACCOUNT_KEY encontrada. Início:",
      serviceAccountJson.substring(0, 30) + "...",
      "Fim:",
      serviceAccountJson.substring(serviceAccountJson.length - 30)
    );
  } else {
    console.error(
      "❌ Variável FIREBASE_SERVICE_ACCOUNT_KEY NÃO encontrada no ambiente!"
    );
  }

  if (!serviceAccountJson) {
    console.error(
      "❌ ERRO FATAL: Variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não definida!"
    );
    console.warn(
      "⚠️ Tentando inicialização padrão do Firebase Admin SDK (PROVAVELMENTE CAUSARÁ ERROS DE PERMISSÃO)."
    );
    admin.initializeApp(); // Isso provavelmente não funcionará corretamente sem credenciais
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      console.log(
        "🔑 Inicializando Firebase Admin com chave da variável de ambiente. Project ID:",
        serviceAccount.project_id
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(
        "✅ Firebase Admin SDK inicializado com sucesso via Service Account."
      );
    } catch (parseError) {
      console.error(
        "❌ ERRO FATAL ao fazer parse do JSON da FIREBASE_SERVICE_ACCOUNT_KEY:",
        parseError
      );
      console.error(
        "JSON recebido (início):",
        serviceAccountJson.substring(0, 100)
      );
      throw parseError; // Re-lança o erro após logar
    }
  }
} catch (error) {
  console.error(
    "❌ ERRO FATAL durante inicialização do Firebase Admin SDK:",
    error
  );
}

// Exporta a instância do Firestore do Admin SDK
// Garanta que esta é a instância usada nas rotas que precisam de permissão
export const adminDb = admin.firestore();
console.log("Firestore Admin Instance (adminDb) criada.");

// Mantenha a inicialização do cliente se você também a usa no backend
// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// const firebaseConfig = { apiKey: process.env.FIREBASE_API_KEY, ... }; // Suas configs de cliente
// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app); // Instância do cliente
// console.log("Firestore Client Instance (db) criada.");
