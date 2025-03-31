// Criar este arquivo para gerenciar funções de cache
export function limparCacheLocal() {
  // Limpar localStorage
  localStorage.clear();

  // Limpar sessionStorage
  sessionStorage.clear();

  // Limpar cache de API se estiver usando alguma biblioteca de cache
  console.log("✅ Cache local limpo com sucesso");
}
