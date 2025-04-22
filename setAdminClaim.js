// Importe o SDK Admin
const admin = require("firebase-admin");

// <<< IMPORTANTE: Substitua pelo caminho para SUA chave de serviço >>>
// Você pode baixar isso no Console do Firebase > Configurações do Projeto > Contas de Serviço
const serviceAccount = require("./barbearia-andin-firebase-adminsdk-fbsvc-3bf94462ce.json");

// Inicialize o Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// <<< IMPORTANTE: Substitua pelo UID do seu usuário admin >>>
// O UID foi identificado nos logs: 'jIRDWuo6M5fQI7Y5zstPhiAni4t1'
const uid = "jIRDWuo6M5fQI7Y5zstPhiAni4t1";

// Define a custom claim 'admin' como true
admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(
      `Sucesso! Custom claim { admin: true } definida para o usuário ${uid}`
    );
    // É crucial que o usuário faça logout e login novamente no frontend
    // para que o ID Token seja atualizado com a nova claim.
    console.log(
      "IMPORTANTE: O usuário precisa fazer logout e login novamente no frontend."
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro ao definir custom claim:", error);
    process.exit(1);
  });
