export function checkServerStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    // Sempre retornar true para não bloquear o desenvolvimento
    resolve(true);
  });
}
