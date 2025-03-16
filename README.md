# Barbearia Andin

Sistema de agendamento e gestão para a Barbearia Andin.

## Características

- Agendamento online de serviços
- Pagamento via Mercado Pago (PIX)
- Painel administrativo para gerenciamento
- Integração com Firebase

## Configuração Inicial

### Pré-requisitos

- Node.js 16+
- NPM ou Yarn
- Conta no Firebase
- Conta no Mercado Pago (para pagamentos)

### Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   ```
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_MERCADO_PAGO_PUBLIC_KEY=sua_chave_aqui
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```
5. Em outro terminal, inicie o backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## Configurando o Primeiro Usuário Administrador

Para acessar o painel administrativo, você precisa criar um usuário administrador. Siga os passos abaixo:

1. Certifique-se de que o Firebase Authentication esteja habilitado no console do Firebase, com o provedor de Email/Senha ativado.

2. No seu navegador, quando a aplicação estiver rodando, abra o console (F12) e execute o seguinte código:

```javascript
import("./utils/adminCreator").then((module) => {
  module.criarUsuarioAdmin("admin@exemplo.com", "senha123").then((result) => {
    console.log(result);
  });
});
```

3. Substitua 'admin@exemplo.com' e 'senha123' por suas credenciais desejadas.

4. Após criar o administrador, você poderá fazer login na página `/admin/login` com as credenciais criadas.

5. Por segurança, após criar o primeiro usuário, você deve remover ou comentar o arquivo `src/utils/adminCreator.ts`.

## Estrutura do Projeto

- `src/` - Código fonte do frontend

  - `components/` - Componentes React reutilizáveis
  - `pages/` - Páginas da aplicação
  - `services/` - Serviços para comunicação com APIs
  - `context/` - Contextos React para gerenciamento de estado
  - `utils/` - Funções utilitárias
  - `layout/` - Componentes de layout

- `backend/` - Código fonte do servidor
  - `src/` - Código do backend
  - `controllers/` - Controladores da API
  - `routes/` - Rotas da API

## Licença

Este projeto é privado e destinado apenas ao uso da Barbearia Andin.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
