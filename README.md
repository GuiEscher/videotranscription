
# Projeto - Instruções de Inicialização

Este projeto contém uma aplicação frontend e um servidor backend. Siga os passos abaixo para configurar e iniciar o projeto corretamente.

## Requisitos

- Node.js (v16 ou superior)
- Yarn (v1.22 ou superior)

## Passo a Passo

1. **Clone o repositório**

   Clone o repositório do GitHub:

   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   cd seu-repositorio
   ```

2. **Instale as dependências do frontend**

   Navegue até o diretório raiz do projeto e execute o comando para instalar as dependências do frontend:

   ```bash
   yarn install
   ```

3. **Crie arquivos de variáveis de ambiente**

   Você precisa criar dois arquivos de variáveis de ambiente:

   - Um na raiz do projeto para as credenciais do Firebase.
   - Outro na pasta `servidor` para armazenar a chave da API.

   ### Firebase (na raiz do projeto)

   Crie um arquivo `.env` na pasta raiz do projeto e adicione as credenciais do Firebase:

   ```
   REACT_APP_FIREBASE_API_KEY=SuaChaveFirebaseAqui
   REACT_APP_FIREBASE_AUTH_DOMAIN=SeuAuthDomainAqui
   REACT_APP_FIREBASE_PROJECT_ID=SeuProjectIDAqui
   ```

   ### Chave da API (na pasta `servidor`)

   Na pasta `servidor`, crie um arquivo `.env` com a chave da API:

   ```
   API_KEY=SuaChaveDaApiAqui
   ```

4. **Inicie o frontend**

   Para iniciar o frontend, execute o seguinte comando no diretório raiz do projeto:

   ```bash
   yarn start
   ```

5. **Inicie o backend**

   Navegue até a pasta `servidor` e inicie o servidor Node.js:

   ```bash
   cd servidor
   node nodeServer.js
   node transcriptions.js
   ```

6. **Acessando a aplicação**

   Após iniciar tanto o frontend quanto o backend, a aplicação estará disponível no seu navegador no endereço:

   ```
   http://localhost:3000
   ```

Pronto! O projeto está configurado e em execução.
