import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

/**
 * Esta função deve ser usada apenas uma vez para criar o primeiro administrador
 * Após o uso, este arquivo deve ser removido ou a função desabilitada
 */
export async function criarUsuarioAdmin(email: string, password: string) {
  if (process.env.NODE_ENV === "production") {
    console.error("Esta função não deve ser usada em produção");
    return { success: false, message: "Função desabilitada em produção" };
  }

  try {
    const auth = getAuth();
    const db = getFirestore();

    // Verificar se já existe um admin
    const adminDocRef = doc(db, "admins", "info");
    const adminDoc = await getDoc(adminDocRef);

    if (adminDoc.exists()) {
      console.warn("Já existe um administrador configurado");
      return { success: false, message: "Administrador já configurado" };
    }

    // Criar usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Registrar o usuário na coleção de admins
    await setDoc(adminDocRef, {
      email,
      uid: userCredential.user.uid,
      role: "admin",
      createdAt: new Date().toISOString(),
    });

    console.log("Administrador criado com sucesso:", userCredential.user.uid);
    return {
      success: true,
      message: "Administrador criado com sucesso",
      userId: userCredential.user.uid,
    };
  } catch (error: any) {
    console.error("Erro ao criar administrador:", error);
    return {
      success: false,
      message: error.message || "Erro ao criar administrador",
    };
  }
}

/**
 * IMPORTANTE: Esta função só deve ser chamada no console do navegador em ambiente de desenvolvimento
 *
 * Exemplo de uso no console:
 *
 * import { criarUsuarioAdmin } from './utils/adminCreator';
 * criarUsuarioAdmin('admin@barbearia.com', 'senha123');
 */
