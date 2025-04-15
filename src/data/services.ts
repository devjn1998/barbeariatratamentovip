export interface Service {
  nome: string;
  preco: number;
  descricao: string;
  duracao: string;
}

export const servicos: Service[] = [
  {
    nome: "Corte Disfarçado com Máquina",
    preco: 30,
    descricao:
      "Corte moderno com degradê suave nas laterais e nuca, realizado com máquina de precisão para criar transições perfeitas. Técnica que proporciona visual limpo e contemporâneo, com acabamento refinado nas bordas e contornos. Inclui lavagem e finalização com produtos profissionais para um resultado impecável.",
    duracao: "30 min",
  },
  {
    nome: "Corte Disfarçado com Tesoura",
    preco: 35,
    descricao:
      "Corte versátil que combina a precisão da máquina nas laterais e nuca com o trabalho detalhado da tesoura na parte superior. Ideal para quem busca um visual equilibrado entre o clássico e o moderno. Inclui lavagem e finalização com produtos profissionais.",
    duracao: "30 min",
  },
  {
    nome: "Corte pente único",
    preco: 25,
    descricao:
      "Corte tradicional com pente e tesoura em comprimento único, perfeito para quem prefere um visual clássico e uniforme. Inclui lavagem e finalização.",
    duracao: "20 min",
  },
  {
    nome: "Corte Tesoura",
    preco: 35,
    descricao:
      "Técnica precisa de corte com tesoura profissional, ideal para estilos mais elaborados e texturas específicas.",
    duracao: "30 min",
  },
  {
    nome: "Acabamento ( Pezinho )",
    preco: 10,
    descricao:
      "Cuidado especializado para os pés, garantindo higiene e aparência impecável com produtos específicos.",
    duracao: "20 min",
  },
  {
    nome: "Aparar Barba",
    preco: 20,
    descricao:
      "Modelagem completa da barba com acabamento em navalha e hidratação especial para a pele.",
    duracao: "25 min",
  },
  {
    nome: "Pigmentação",
    preco: 10,
    descricao:
      "Modelagem completa da barba com acabamento em navalha e hidratação especial para a pele.",
    duracao: "25 min",
  },
  {
    nome: "Sobrancelha",
    preco: 10,
    descricao:
      "Design e modelagem profissional das sobrancelhas, incluindo limpeza da área, depilação com pinça e acabamento perfeito para realçar o olhar.",
    duracao: "10 min",
  },
  {
    nome: "Combo Cabelo+Barba+Sobrancelha",
    preco: 55,
    descricao:
      "Corte, barba e sobrancelha com produtos de alta qualidade para garantir um visual duradouro e elegante.",
    duracao: "30 min",
  },
  {
    nome: "Combo Cabelo+Barba+Pintura+Sobrancelha",
    preco: 65,
    descricao:
      "Corte, barba, pintura e sobrancelha com produtos de alta qualidade para garantir um visual duradouro e elegante.",
    duracao: "30 min",
  },
  {
    nome: "Combo Cabelo+Sobrancelha",
    preco: 40,
    descricao:
      "Corte, barba, pintura e sobrancelha com produtos de alta qualidade para garantir um visual duradouro e elegante.",
    duracao: "30 min",
  },
];
