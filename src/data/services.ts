export interface Service {
  nome: string;
  preco: number;
  descricao: string;
}

export const servicos: Service[] = [
  {
    nome: "Corte Máquina",
    preco: 35,
    descricao: "Corte de cabelo rápido e eficiente usando máquina elétrica.",
  },
  {
    nome: "Corte Tesoura",
    preco: 20,
    descricao:
      "Corte preciso usando tesoura profissional para um visual refinado.",
  },
  {
    nome: "Corte Pé",
    preco: 15,
    descricao: "Apare e modele os pelos dos pés para uma aparência arrumada.",
  },
  {
    nome: "Aparar Barba",
    preco: 10,
    descricao: "Mantenha sua barba com visual afiado e bem cuidado.",
  },
  {
    nome: "Barbear com Toalha Quente",
    preco: 25,
    descricao: "Barbear tradicional luxuoso com tratamento de toalha quente.",
  },
  {
    nome: "Penteado",
    preco: 15,
    descricao:
      "Estilize seu cabelo com produtos premium para qualquer ocasião.",
  },
];
