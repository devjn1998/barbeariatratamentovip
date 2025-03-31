const fs = require("fs");
const path = require("path");

const requiredEnvVars = ["MERCADO_PAGO_ACCESS_TOKEN", "PORT"];

function checkEnv() {
  const envPath = path.join(__dirname, "../.env");

  if (!fs.existsSync(envPath)) {
    console.error("Arquivo .env não encontrado!");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const missingVars = [];

  requiredEnvVars.forEach((varName) => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error(
      "Variáveis de ambiente obrigatórias não encontradas:",
      missingVars
    );
    process.exit(1);
  }
}

checkEnv();
