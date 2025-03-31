/**
 * Função para garantir que a navegação ocorra por HTTP em vez de HTTPS
 * @param path Caminho para onde redirecionar
 */
export function redirectToHttp(path: string): void {
  if (window.location.protocol === "https:") {
    window.location.href = `http://${window.location.host}${path}`;
  } else {
    window.location.href = path;
  }
}

/**
 * Componente para garantir que estamos usando HTTP
 */
export function ensureHttp(): boolean {
  if (window.location.protocol === "https:") {
    window.location.href = `http://${window.location.host}${window.location.pathname}`;
    return false;
  }
  return true;
}
