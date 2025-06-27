# Testes da API REST Genérica

## 📋 Visão Geral

Esta suíte de testes utiliza **Jest** e **Supertest** para garantir que todos os endpoints da API REST funcionem corretamente.

## 🧪 Estrutura dos Testes

### Métodos HTTP Testados:

- **POST** - Criação de novos itens
- **GET** - Listagem e busca por ID
- **PUT** - Atualização completa de itens
- **PATCH** - Atualização parcial de itens  
- **DELETE** - Remoção de itens

### Funcionalidades Testadas:

1. **CRUD Básico**
   - ✅ Criação de itens com UUID automático
   - ✅ Listagem de coleções
   - ✅ Busca por ID específico
   - ✅ Atualização completa (PUT)
   - ✅ Atualização parcial (PATCH)
   - ✅ Remoção de itens

2. **Sistema de Filtros**
   - ✅ Filtros por valor exato
   - ✅ Filtros com wildcard (`nome=Casa*`)
   - ✅ Operadores numéricos (`preco=>500000`, `idade=<=30`)
   - ✅ Combinação de múltiplos filtros
   - ✅ Ordenação (`_sort=campo&_order=asc|desc`)
   - ✅ Paginação (`_limit=10&_offset=20`)

3. **Tratamento de Erros**
   - ✅ 404 para itens não encontrados
   - ✅ 404 para coleções inexistentes (retorna array vazio)
   - ✅ Validação de parâmetros obrigatórios

4. **Estrutura de Diretórios**
   - ✅ Criação automática de diretórios
   - ✅ Suporte a caminhos aninhados (`/usuarios/admin`)
   - ✅ Manutenção da estrutura de arquivos

## 🚀 Executando os Testes

### Executar todos os testes:
```bash
npm test
```

### Executar testes em modo watch (re-executa quando arquivos mudam):
```bash
npm run test:watch
```

### Ver relatório de cobertura:
```bash
npm test
# O relatório será gerado em ./coverage/
```

## 📊 Cobertura de Testes

Os testes cobrem:
- ✅ Todos os endpoints HTTP
- ✅ Casos de sucesso e erro
- ✅ Validação de dados
- ✅ Sistema de filtros completo
- ✅ Persistência em arquivos
- ✅ Limpeza automática de dados de teste

## 🔧 Configuração

### Dependências de Teste:
- **Jest**: Framework de testes
- **Supertest**: Testes de API HTTP
- **Node.js fs/promises**: Validação de arquivos

### Banco de Dados de Teste:
- Os testes usam um diretório separado `test-db/` 
- Dados são limpos automaticamente antes/depois dos testes
- Não interfere com dados de produção

## 📝 Exemplo de Teste

```javascript
test('should create a new item', async () => {
  const newItem = {
    nome: 'Casa de Teste',
    preco: 500000,
    quartos: 3
  };

  const response = await request(app)
    .post('/casas')
    .send(newItem)
    .expect(201);

  expect(response.body).toMatchObject({
    id: expect.any(String),
    nome: 'Casa de Teste',
    preco: 500000,
    quartos: 3,
    createdAt: expect.any(String)
  });
});
```

## 🎯 Casos de Teste Cobertos

1. **Criação (POST)**
   - ✅ Criar item simples
   - ✅ Criar item em caminho aninhado
   - ✅ Verificar UUID gerado
   - ✅ Verificar timestamp createdAt

2. **Listagem (GET)**
   - ✅ Listar todos os itens
   - ✅ Retornar array vazio para coleção inexistente
   - ✅ Buscar item específico por UUID
   - ✅ Retornar 404 para item inexistente

3. **Filtros (GET com query params)**
   - ✅ Filtro exato: `?cidade=São Paulo`
   - ✅ Wildcard: `?nome=Casa*`
   - ✅ Numérico: `?preco=>500000`
   - ✅ Combinado: `?cidade=SP&quartos=>2`
   - ✅ Ordenação: `?_sort=preco&_order=desc`
   - ✅ Paginação: `?_limit=10&_offset=20`

4. **Atualização (PUT/PATCH)**
   - ✅ Atualização completa (PUT)
   - ✅ Atualização parcial (PATCH)
   - ✅ Preservar campos não alterados (PATCH)
   - ✅ Manter ID original
   - ✅ Adicionar timestamp updatedAt

5. **Remoção (DELETE)**
   - ✅ Remover item existente
   - ✅ Verificar remoção física do arquivo
   - ✅ Retornar 404 para item inexistente

## 🏆 Resultados

```
Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        0.96s
```

Todos os 22 testes estão passando com 100% de sucesso! 🎉
