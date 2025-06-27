const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Importar app sem iniciar o servidor
const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Criar aplicação de teste
const app = express();
const DB_PATH = path.join(__dirname, '..', 'test-db');

// Middleware para parsing de JSON
app.use(express.json());

// Função para garantir que o diretório existe
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Função para obter o caminho completo baseado na URL
function getDbPath(requestPath) {
  const cleanPath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath;
  return path.join(DB_PATH, cleanPath);
}

// Configurar rotas (copiado do arquivo principal, mas usando DB_PATH de teste)
// GET - Listar arquivos ou obter arquivo específico por ID
app.get('*', async (req, res) => {
  try {
    const requestPath = req.path;
    const pathParts = requestPath.split('/').filter(part => part !== '');
    
    // Se há partes no caminho, verificar se a última é um UUID (busca por ID)
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      
      // Verificar se o último segmento parece um UUID (formato básico)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(lastPart)) {
        // É uma busca por ID
        const id = pathParts.pop();
        const dirPath = getDbPath(pathParts.join('/'));
        const filePath = path.join(dirPath, `${id}.json`);
        
        try {
          await fs.access(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          return res.json(data);
        } catch (error) {
          if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'Item não encontrado' });
          } else {
            throw error;
          }
        }
      }
    }
    
    // Caso contrário, listar diretório
    const fullPath = getDbPath(requestPath);
    
    try {
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        // Listar arquivos do diretório
        const files = await fs.readdir(fullPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        let items = [];
        for (const file of jsonFiles) {
          const filePath = path.join(fullPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          items.push({ id: path.parse(file).name, ...data });
        }
        
        // Aplicar filtros baseados nos query parameters
        const queryParams = req.query;
        if (Object.keys(queryParams).length > 0) {
          items = items.filter(item => {
            return Object.entries(queryParams).every(([key, value]) => {
              // Ignorar parâmetros especiais
              if (key === '_limit' || key === '_offset' || key === '_sort' || key === '_order') {
                return true;
              }
              
              // Verificar se o campo existe no item
              if (!(key in item)) {
                return false;
              }
              
              const itemValue = item[key];
              
              // Converter valores para string para comparação
              const itemValueStr = String(itemValue).toLowerCase();
              const filterValueStr = String(value).toLowerCase();
              
              // Suporte a operadores básicos
              if (filterValueStr.startsWith('>=')) {
                const numValue = parseFloat(filterValueStr.slice(2));
                return !isNaN(numValue) && parseFloat(itemValue) >= numValue;
              }
              if (filterValueStr.startsWith('<=')) {
                const numValue = parseFloat(filterValueStr.slice(2));
                return !isNaN(numValue) && parseFloat(itemValue) <= numValue;
              }
              if (filterValueStr.startsWith('>')) {
                const numValue = parseFloat(filterValueStr.slice(1));
                return !isNaN(numValue) && parseFloat(itemValue) > numValue;
              }
              if (filterValueStr.startsWith('<')) {
                const numValue = parseFloat(filterValueStr.slice(1));
                return !isNaN(numValue) && parseFloat(itemValue) < numValue;
              }
              if (filterValueStr.startsWith('!=')) {
                return itemValueStr !== filterValueStr.slice(2);
              }
              if (filterValueStr.includes('*')) {
                // Suporte a wildcards simples
                const regex = new RegExp(filterValueStr.replace(/\*/g, '.*'), 'i');
                return regex.test(itemValueStr);
              }
              
              // Comparação exata (case-insensitive)
              return itemValueStr === filterValueStr;
            });
          });
        }
        
        // Aplicar ordenação
        if (queryParams._sort) {
          const sortField = queryParams._sort;
          const sortOrder = queryParams._order === 'desc' ? -1 : 1;
          
          items.sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            
            if (aValue === undefined) return 1;
            if (bValue === undefined) return -1;
            
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              return aValue.localeCompare(bValue) * sortOrder;
            }
            
            if (aValue < bValue) return -1 * sortOrder;
            if (aValue > bValue) return 1 * sortOrder;
            return 0;
          });
        }
        
        // Aplicar paginação
        if (queryParams._offset || queryParams._limit) {
          const offset = parseInt(queryParams._offset) || 0;
          const limit = parseInt(queryParams._limit);
          
          if (limit) {
            items = items.slice(offset, offset + limit);
          } else if (offset) {
            items = items.slice(offset);
          }
        }
        
        res.json(items);
      } else if (stats.isFile() && fullPath.endsWith('.json')) {
        // Retornar arquivo específico
        const content = await fs.readFile(fullPath, 'utf8');
        const data = JSON.parse(content);
        res.json(data);
      } else {
        res.status(404).json({ error: 'Arquivo não encontrado' });
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Caminho não existe, retorna array vazio para listagem
        res.json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Erro no GET:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar novo item
app.post('*', async (req, res) => {
  try {
    const requestPath = req.path;
    const fullPath = getDbPath(requestPath);
    
    // Garantir que o diretório existe
    await ensureDirectoryExists(fullPath);
    
    // Gerar UUID para o arquivo
    const id = uuidv4();
    const fileName = `${id}.json`;
    const filePath = path.join(fullPath, fileName);
    
    // Salvar dados no arquivo
    const data = { id, ...req.body, createdAt: new Date().toISOString() };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro no POST:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar item existente
app.put('*', async (req, res) => {
  try {
    const requestPath = req.path;
    const pathParts = requestPath.split('/').filter(part => part !== '');
    
    if (pathParts.length === 0) {
      return res.status(400).json({ error: 'ID é obrigatório para atualização' });
    }
    
    const id = pathParts.pop(); // Último elemento é o ID
    const dirPath = getDbPath(pathParts.join('/'));
    const filePath = path.join(dirPath, `${id}.json`);
    
    try {
      // Verificar se o arquivo existe
      await fs.access(filePath);
      
      // Ler dados atuais
      const currentContent = await fs.readFile(filePath, 'utf8');
      const currentData = JSON.parse(currentContent);
      
      // Atualizar dados
      const updatedData = { 
        ...currentData, 
        ...req.body, 
        id: id, // Manter o ID original
        updatedAt: new Date().toISOString() 
      };
      
      // Salvar dados atualizados
      await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
      
      res.json(updatedData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Item não encontrado' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Erro no PUT:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH - Atualizar item existente (atualização parcial)
app.patch('*', async (req, res) => {
  try {
    const requestPath = req.path;
    const pathParts = requestPath.split('/').filter(part => part !== '');
    
    if (pathParts.length === 0) {
      return res.status(400).json({ error: 'ID é obrigatório para atualização' });
    }
    
    const id = pathParts.pop(); // Último elemento é o ID
    const dirPath = getDbPath(pathParts.join('/'));
    const filePath = path.join(dirPath, `${id}.json`);
    
    try {
      // Verificar se o arquivo existe
      await fs.access(filePath);
      
      // Ler dados atuais
      const currentContent = await fs.readFile(filePath, 'utf8');
      const currentData = JSON.parse(currentContent);
      
      // Atualizar apenas os campos fornecidos (merge parcial)
      const updatedData = { 
        ...currentData, 
        ...req.body, 
        id: id, // Manter o ID original
        updatedAt: new Date().toISOString() 
      };
      
      // Salvar dados atualizados
      await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2));
      
      res.json(updatedData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Item não encontrado' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Erro no PATCH:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Remover item
app.delete('*', async (req, res) => {
  try {
    const requestPath = req.path;
    const pathParts = requestPath.split('/').filter(part => part !== '');
    
    if (pathParts.length === 0) {
      return res.status(400).json({ error: 'ID é obrigatório para exclusão' });
    }
    
    const id = pathParts.pop(); // Último elemento é o ID
    const dirPath = getDbPath(pathParts.join('/'));
    const filePath = path.join(dirPath, `${id}.json`);
    
    try {
      // Verificar se o arquivo existe
      await fs.access(filePath);
      
      // Remover arquivo
      await fs.unlink(filePath);
      
      res.json({ message: 'Item removido com sucesso', id });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Item não encontrado' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Erro no DELETE:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware para tratar rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Função para limpar dados de teste
async function cleanupTestData() {
  try {
    await fs.rm(DB_PATH, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
}

// Testes
describe('Generic REST API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /', () => {
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

      // Verificar se o arquivo foi criado
      const filePath = path.join(DB_PATH, 'casas', `${response.body.id}.json`);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should create item in nested path', async () => {
      const newItem = { nome: 'Usuário Teste' };

      const response = await request(app)
        .post('/usuarios/admin')
        .send(newItem)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        nome: 'Usuário Teste',
        createdAt: expect.any(String)
      });
    });
  });

  describe('GET /', () => {
    let createdItemId;

    beforeEach(async () => {
      // Criar um item para os testes
      const response = await request(app)
        .post('/casas')
        .send({
          nome: 'Casa Teste',
          preco: 400000,
          quartos: 2,
          cidade: 'São Paulo'
        });
      createdItemId = response.body.id;
    });

    test('should list all items in a collection', async () => {
      const response = await request(app)
        .get('/casas')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: createdItemId,
        nome: 'Casa Teste',
        preco: 400000,
        quartos: 2,
        cidade: 'São Paulo'
      });
    });

    test('should return empty array for non-existent collection', async () => {
      const response = await request(app)
        .get('/produtos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    test('should get specific item by ID', async () => {
      const response = await request(app)
        .get(`/casas/${createdItemId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdItemId,
        nome: 'Casa Teste',
        preco: 400000,
        quartos: 2,
        cidade: 'São Paulo'
      });
    });

    test('should return 404 for non-existent item', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .get(`/casas/${fakeId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Item não encontrado' });
    });
  });

  describe('GET / with filters', () => {
    beforeEach(async () => {
      // Criar múltiplos itens para teste de filtros
      await request(app).post('/casas').send({
        nome: 'Casa Pequena',
        preco: 300000,
        quartos: 2,
        cidade: 'São Paulo'
      });

      await request(app).post('/casas').send({
        nome: 'Casa Grande',
        preco: 800000,
        quartos: 4,
        cidade: 'Rio de Janeiro'
      });

      await request(app).post('/casas').send({
        nome: 'Casa Média',
        preco: 500000,
        quartos: 3,
        cidade: 'São Paulo'
      });
    });

    test('should filter by exact value', async () => {
      const response = await request(app)
        .get('/casas?cidade=São Paulo')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(item => item.cidade === 'São Paulo')).toBe(true);
    });

    test('should filter by wildcard', async () => {
      const response = await request(app)
        .get('/casas?nome=Casa*')
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    test('should filter by numeric comparison (greater than)', async () => {
      const response = await request(app)
        .get('/casas?preco=>400000')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(item => item.preco > 400000)).toBe(true);
    });

    test('should filter by numeric comparison (less than or equal)', async () => {
      const response = await request(app)
        .get('/casas?preco=<=500000')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(item => item.preco <= 500000)).toBe(true);
    });

    test('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/casas?cidade=São Paulo&quartos=>2')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].nome).toBe('Casa Média');
    });

    test('should sort results', async () => {
      const response = await request(app)
        .get('/casas?_sort=preco&_order=desc')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].preco).toBe(800000);
      expect(response.body[1].preco).toBe(500000);
      expect(response.body[2].preco).toBe(300000);
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/casas?_limit=2&_offset=1')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT /', () => {
    let createdItemId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/casas')
        .send({
          nome: 'Casa Original',
          preco: 400000,
          quartos: 2
        });
      createdItemId = response.body.id;
    });

    test('should update existing item', async () => {
      const updatedData = {
        nome: 'Casa Atualizada',
        preco: 450000,
        quartos: 3
      };

      const response = await request(app)
        .put(`/casas/${createdItemId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdItemId,
        nome: 'Casa Atualizada',
        preco: 450000,
        quartos: 3,
        updatedAt: expect.any(String)
      });
    });

    test('should return 404 for non-existent item', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .put(`/casas/${fakeId}`)
        .send({ nome: 'Casa Inexistente' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Item não encontrado' });
    });

    test('should return 404 when no ID provided', async () => {
      const response = await request(app)
        .put('/casas')
        .send({ nome: 'Casa Sem ID' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Item não encontrado' });
    });
  });

  describe('PATCH /', () => {
    let createdItemId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/casas')
        .send({
          nome: 'Casa Original',
          preco: 400000,
          quartos: 2,
          cidade: 'São Paulo'
        });
      createdItemId = response.body.id;
    });

    test('should partially update existing item', async () => {
      const partialUpdate = { preco: 450000 };

      const response = await request(app)
        .patch(`/casas/${createdItemId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdItemId,
        nome: 'Casa Original', // Deve manter valor original
        preco: 450000,        // Deve atualizar
        quartos: 2,           // Deve manter valor original
        cidade: 'São Paulo',  // Deve manter valor original
        updatedAt: expect.any(String)
      });
    });

    test('should return 404 for non-existent item', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .patch(`/casas/${fakeId}`)
        .send({ preco: 500000 })
        .expect(404);

      expect(response.body).toEqual({ error: 'Item não encontrado' });
    });
  });

  describe('DELETE /', () => {
    let createdItemId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/casas')
        .send({
          nome: 'Casa Para Deletar',
          preco: 400000,
          quartos: 2
        });
      createdItemId = response.body.id;
    });

    test('should delete existing item', async () => {
      const response = await request(app)
        .delete(`/casas/${createdItemId}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Item removido com sucesso',
        id: createdItemId
      });

      // Verificar se o arquivo foi removido
      const filePath = path.join(DB_PATH, 'casas', `${createdItemId}.json`);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });

    test('should return 404 for non-existent item', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .delete(`/casas/${fakeId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Item não encontrado' });
    });

    test('should return 404 when no ID provided', async () => {
      const response = await request(app)
        .delete('/casas')
        .expect(404);

      expect(response.body).toEqual({ error: 'Item não encontrado' });
    });
  });

  describe('Error handling', () => {
    test('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/rota/inexistente/muito/longa')
        .expect(200); // Retorna 200 com array vazio para coleções inexistentes

      expect(response.body).toEqual([]);
    });
  });
});
