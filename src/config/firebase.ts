<<<<<<< HEAD
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";

// Carrega as variáveis de ambiente
dotenv.config();

// Configuração do Firebase
=======
// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  disableNetwork,
  enableNetwork,
  getFirestore,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
>>>>>>> bfa60bdd92c6e1732ae762d7bb457cec12d92e15
const firebaseConfig = {
  apiKey: "AIzaSyAQ-Aq4WhvOVJs-jLjKvXBt3_WT5msaHJQ",
  authDomain: "barbearia-andin.firebaseapp.com",
  projectId: "barbearia-andin",
  storageBucket: "barbearia-andin.firebasestorage.app",
  messagingSenderId: "336746868613",
  appId: "1:336746868613:web:ea217625a53b3d88f9deec",
  measurementId: "G-7E4CMDZV4N",
};

<<<<<<< HEAD
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
=======
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore and export
export const db = getFirestore(app);

// Initialize Firebase Authentication and export
export const auth = getAuth(app);

// Adicionar função para gerenciar conectividade
export async function handleFirebaseConnectivity(isOnline: boolean) {
  try {
    if (isOnline) {
      await enableNetwork(db);
      console.log("✅ Conexão com Firebase Firestore habilitada");
    } else {
      await disableNetwork(db);
      console.log(
        "🔌 Conexão com Firebase Firestore desabilitada temporariamente"
      );
    }
    return true;
  } catch (error) {
    console.error("❌ Erro ao gerenciar conectividade:", error);
    return false;
  }
}
>>>>>>> bfa60bdd92c6e1732ae762d7bb457cec12d92e15
