import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export async function resetDatabaseCollections(
  collectionNames: string[] = ["agendamentos", "pagamentos"]
) {
  const resultado: Record<string, number> = {};

  for (const collectionName of collectionNames) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    let count = 0;
    for (const document of snapshot.docs) {
      await deleteDoc(doc(db, collectionName, document.id));
      count++;
    }

    resultado[collectionName] = count;
    console.log(`✅ Coleção ${collectionName}: ${count} documentos removidos`);
  }

  return resultado;
}
