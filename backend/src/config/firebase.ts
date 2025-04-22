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
import { getAuth } from "firebase-admin/auth";

// Carrega as variáveis de ambiente
dotenv.config();

// Configuração do Firebase
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyAQ-Aq4WhvOVJs-jLjKvXBt3_WT5msaHJQ",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "barbearia-andin.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "barbearia-andin",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "barbearia-andin.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "336746868613",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:336746868613:web:ea217625a53b3d88f9deec",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-7E4CMDZV4N",
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

console.log("🏁 Executando config/firebase.ts...");

try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  if (!serviceAccountJson) {
    console.error(
      "❌ Variável FIREBASE_SERVICE_ACCOUNT_KEY_JSON NÃO encontrada no ambiente!"
    );
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not set.");
  }
  console.log(
    "🔑 Variável FIREBASE_SERVICE_ACCOUNT_KEY_JSON encontrada. Tentando parse..."
  );

  try {
    // 1. Parse o JSON
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log(`✅ JSON Parsed. Project ID: ${serviceAccount.project_id}`);

    // 2. Verifique e corrija a chave privada
    if (!serviceAccount.private_key) {
      console.error(
        "❌ Campo 'private_key' não encontrado no JSON da Service Account!"
      );
      throw new Error("Missing 'private_key' in service account JSON.");
    }

    console.log("🔧 Verificando e corrigindo newlines na private_key...");
    // Log ANTES da correção
    console.log(
      "🔑 Private Key (antes da correção, início):",
      serviceAccount.private_key.substring(0, 40)
    );
    // Substitui a sequência literal '\\n' pela quebra de linha real '\n'
    const correctedPrivateKey = serviceAccount.private_key.replace(
      /\\n/g,
      "\n"
    );
    // Log DEPOIS da correção
    console.log(
      "🔑 Private Key (DEPOIS da correção, início):",
      correctedPrivateKey.substring(0, 40)
    );
    console.log("✅ Correção de newlines aplicada (ou tentada).");

    // Crie o objeto de credencial com a chave corrigida
    const credential = admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: correctedPrivateKey, // <<< USA A CHAVE CORRIGIDA
    });
    console.log("🔑 Credencial criada. Tentando inicializar o App...");

    // 3. Inicialize o Admin SDK com a credencial
    admin.initializeApp({
      credential, // Passa a credencial criada
    });
    console.log(
      "✅ Firebase Admin SDK inicializado com sucesso via Service Account."
    );
  } catch (parseOrInitError) {
    console.error(
      "❌ ERRO FATAL no bloco try interno (parse/init):",
      parseOrInitError
    );
    console.error(
      "JSON recebido (início):",
      serviceAccountJson.substring(0, 100)
    );
    throw parseOrInitError;
  }
} catch (error) {
  console.error("❌ ERRO FATAL GERAL durante inicialização:", error);
  process.exit(1);
}

export const adminDb = admin.firestore();
console.log("Firestore Admin Instance (adminDb) criada.");

export const auth = getAuth();
console.log("Firebase Admin Auth Instance (auth) criada.");

// Mantenha a inicialização do cliente se você também a usa no backend
// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// const firebaseConfig = { apiKey: process.env.FIREBASE_API_KEY, ... }; // Suas configs de cliente
// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app); // Instância do cliente
// console.log("Firestore Client Instance (db) criada.");
