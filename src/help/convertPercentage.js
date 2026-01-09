export const convertPercentage = (texto) => {
  // Remove o símbolo e converte para número
  const valor = parseFloat(texto.replace(',', '.'));

  // Se o valor for 0, retornamos 0 ou 1 (dependendo da sua necessidade)
  if (valor <= 0) return 0;
  
  // Dividimos por 10 e arredondamos para cima
  // Ex: 56.31 / 10 = 5.63 -> Math.ceil vira 6
  // Para que 56 vira 6, 11 vira 2, etc.
  let resultado = Math.ceil(valor / 10);

  // Garante que o teto máximo seja 10 (caso o valor seja maior que 100%)
  return Math.min(resultado, 10);
}