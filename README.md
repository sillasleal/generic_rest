# Generic REST API

Uma API REST genérica que cria e gerencia arquivos JSON baseados no path da requisição.

## 🚀 Funcionalidades

- **GET** - Lista itens de um diretório ou obtém um item específico
- **POST** - Cria um novo item com UUID único
- **PUT** - Atualiza um item existente
- **DELETE** - Remove um item

## 📁 Estrutura de Dados

- Cada item é salvo como um arquivo JSON com nome UUID (ex: `550e8400-e29b-41d4-a716-446655440000.json`)
- O path da requisição corresponde ao caminho na pasta `db/`
- Diretórios são criados automaticamente conforme necessário

## 🐳 Usando Dev Container

### Pré-requisitos
- VS Code instalado
- Extensão "Dev Containers" instalada
- Docker instalado e rodando

### Como usar
1. Abra o projeto no VS Code
2. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
3. Digite "Dev Containers: Reopen in Container"
4. Aguarde o container ser construído e configurado
5. O servidor será iniciado automaticamente na porta 3000

## 📝 Exemplos de Uso

### Criar um usuário
```bash
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com"
}
```

### Listar usuários
```bash
GET http://localhost:3000/users
```

### Obter usuário específico
```bash
GET http://localhost:3000/users/{uuid}
```

### Atualizar usuário
```bash
PUT http://localhost:3000/users/{uuid}
Content-Type: application/json

{
  "name": "João Santos"
}
```

### Remover usuário
```bash
DELETE http://localhost:3000/users/{uuid}
```

### Criar produto em subcategoria
```bash
POST http://localhost:3000/products/electronics/smartphones
Content-Type: application/json

{
  "name": "iPhone 15",
  "price": 999.99
}
```

## 🛠️ Scripts Disponíveis

- `npm start` - Inicia o servidor em modo produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento (com hot reload)

## 📂 Estrutura do Projeto

```
generic-rest/
├── .devcontainer/
│   ├── devcontainer.json
│   └── Dockerfile
├── .vscode/
│   ├── tasks.json
│   └── launch.json
├── db/                 # Diretório de dados (criado automaticamente)
├── src/
│   └── index.js       # Arquivo principal da API
├── package.json
└── README.md
```

## 🔧 Configuração

### Porta do Servidor
O servidor roda na porta 3000 por padrão. Você pode alterar isso definindo a variável de ambiente `PORT`:

```bash
PORT=8080 npm start
```

### Caminho do Banco de Dados
Por padrão, os dados são salvos na pasta `db/` do projeto. Você pode configurar um caminho personalizado de três formas:

> **💡 Criação Automática**: O diretório especificado será criado automaticamente durante a inicialização do servidor se não existir.

#### 1. Argumento da linha de comando:
```bash
node src/index.js --db-path /caminho/personalizado/dados
npm start -- --db-path /caminho/personalizado/dados
```

#### 2. Variável de ambiente:
```bash
DB_PATH=/caminho/personalizado/dados npm start
```

#### 3. Docker/Dev Container:
```bash
# No docker-compose.yml ou devcontainer.json
DB_PATH=/workspace/meus-dados
```

### Ordem de prioridade:
1. **Argumento `--db-path`** (maior prioridade)
2. **Variável de ambiente `DB_PATH`**
3. **Padrão `./db`** (menor prioridade)

### Exemplos de uso:

```bash
# Usar pasta específica
node src/index.js --db-path /var/data/api

# Usar pasta temporária para testes
DB_PATH=/tmp/test-data npm run dev

# Usar pasta relativa
npm start -- --db-path ./meus-dados

# Verificar qual pasta está sendo usada (aparece no log de inicialização)
npm start -- --db-path ./custom-db
# Output: 📁 Diretório de dados: /workspaces/generic-rest/custom-db
```

> **💡 Dica**: O caminho absoluto sendo usado sempre aparece no log de inicialização do servidor para confirmação.

## 📋 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET    | `/*`     | Lista itens do diretório ou obtém item específico |
| POST   | `/*`     | Cria novo item no diretório especificado |
| PUT    | `/*/:id` | Atualiza item existente |
| DELETE | `/*/:id` | Remove item |

Todos os endpoints respondem com JSON e incluem tratamento de erros apropriado.
