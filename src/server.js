const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class GenericRestServer {
  constructor(options = {}) {
    this.app = express();
    this.port = options.port || process.env.PORT || 3000;
    this.dbPath = options.dbPath || process.env.DB_PATH || path.join(process.cwd(), 'db');
    this.verbose = options.verbose || process.env.VERBOSE === 'true' || false;
    this.server = null;
    
    // Resolve absolute path
    this.dbPath = path.resolve(this.dbPath);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // CORS middleware - allow requests from any origin
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      credentials: false
    }));
    
    this.app.use(express.json());
    
    // Verbose logging middleware
    if (this.verbose) {
      this.app.use((req, res, next) => {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        
        console.log(`\n📥 [${timestamp}] ${req.method} ${req.path}`);
        console.log(`   Query: ${JSON.stringify(req.query)}`);
        console.log(`   Body: ${JSON.stringify(req.body)}`);
        console.log(`   Headers: ${JSON.stringify(req.headers)}`);
        
        // Override res.json to log response
        const originalJson = res.json;
        res.json = function(data) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`📤 [${new Date().toISOString()}] Response (${duration}ms):`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
          
          return originalJson.call(this, data);
        };
        
        next();
      });
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  getDbPath(requestPath) {
    const cleanPath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath;
    return path.join(this.dbPath, cleanPath);
  }

  setupRoutes() {
    // GET route - List items or get specific item
    this.app.get('*', async (req, res) => {
      try {
        const requestPath = req.path;
        const pathParts = requestPath.split('/').filter(part => part !== '');
        
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (uuidRegex.test(lastPart)) {
            const id = pathParts.pop();
            const dirPath = this.getDbPath(pathParts.join('/'));
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
        
        const fullPath = this.getDbPath(requestPath);
        
        try {
          const stats = await fs.stat(fullPath);
          
          if (stats.isDirectory()) {
            const files = await fs.readdir(fullPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            let items = [];
            for (const file of jsonFiles) {
              const filePath = path.join(fullPath, file);
              const content = await fs.readFile(filePath, 'utf8');
              const data = JSON.parse(content);
              items.push({ id: path.parse(file).name, ...data });
            }
            
            const queryParams = req.query;
            if (Object.keys(queryParams).length > 0) {
              items = items.filter(item => {
                return Object.entries(queryParams).every(([key, value]) => {
                  if (key === '_limit' || key === '_offset' || key === '_sort' || key === '_order') {
                    return true;
                  }
                  
                  if (!(key in item)) {
                    return false;
                  }
                  
                  const itemValue = item[key];
                  
                  const itemValueStr = String(itemValue).toLowerCase();
                  const filterValueStr = String(value).toLowerCase();
                  
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
                    const regex = new RegExp(filterValueStr.replace(/\*/g, '.*'), 'i');
                    return regex.test(itemValueStr);
                  }
                  
                  return itemValueStr === filterValueStr;
                });
              });
            }
            
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
            const content = await fs.readFile(fullPath, 'utf8');
            const data = JSON.parse(content);
            res.json(data);
          } else {
            res.status(404).json({ error: 'Arquivo não encontrado' });
          }
        } catch (error) {
          if (error.code === 'ENOENT') {
            res.json([]);
          } else {
            throw error;
          }
        }
      } catch (error) {
        if (this.verbose) {
          console.error(`❌ [${new Date().toISOString()}] Erro no GET ${req.path}:`, error);
        }
        console.error('Erro no GET:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // POST route - Create new item
    this.app.post('*', async (req, res) => {
      try {
        const requestPath = req.path;
        const fullPath = this.getDbPath(requestPath);
        
        await this.ensureDirectoryExists(fullPath);
        
        const id = uuidv4();
        const fileName = `${id}.json`;
        const filePath = path.join(fullPath, fileName);
        
        const data = { id, ...req.body, createdAt: new Date().toISOString() };
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        
        res.status(201).json(data);
      } catch (error) {
        if (this.verbose) {
          console.error(`❌ [${new Date().toISOString()}] Erro no POST ${req.path}:`, error);
        }
        console.error('Erro no POST:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // PUT route - Update item (complete replacement)
    this.app.put('*', async (req, res) => {
      try {
        const requestPath = req.path;
        const pathParts = requestPath.split('/').filter(part => part !== '');
        
        if (pathParts.length === 0) {
          return res.status(400).json({ error: 'ID é obrigatório para atualização' });
        }
        
        const id = pathParts.pop();
        const dirPath = this.getDbPath(pathParts.join('/'));
        const filePath = path.join(dirPath, `${id}.json`);
        
        try {
          await fs.access(filePath);
          
          const currentContent = await fs.readFile(filePath, 'utf8');
          const currentData = JSON.parse(currentContent);
          
          const updatedData = { 
            ...currentData, 
            ...req.body, 
            id: id,
            updatedAt: new Date().toISOString() 
          };
          
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
        if (this.verbose) {
          console.error(`❌ [${new Date().toISOString()}] Erro no PUT ${req.path}:`, error);
        }
        console.error('Erro no PUT:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // PATCH route - Update item (partial update)
    this.app.patch('*', async (req, res) => {
      try {
        const requestPath = req.path;
        const pathParts = requestPath.split('/').filter(part => part !== '');
        
        if (pathParts.length === 0) {
          return res.status(400).json({ error: 'ID é obrigatório para atualização' });
        }
        
        const id = pathParts.pop();
        const dirPath = this.getDbPath(pathParts.join('/'));
        const filePath = path.join(dirPath, `${id}.json`);
        
        try {
          await fs.access(filePath);
          
          const currentContent = await fs.readFile(filePath, 'utf8');
          const currentData = JSON.parse(currentContent);
          
          const updatedData = { 
            ...currentData, 
            ...req.body, 
            id: id,
            updatedAt: new Date().toISOString() 
          };
          
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
        if (this.verbose) {
          console.error(`❌ [${new Date().toISOString()}] Erro no PATCH ${req.path}:`, error);
        }
        console.error('Erro no PATCH:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // DELETE route - Remove item
    this.app.delete('*', async (req, res) => {
      try {
        const requestPath = req.path;
        const pathParts = requestPath.split('/').filter(part => part !== '');
        
        if (pathParts.length === 0) {
          return res.status(400).json({ error: 'ID é obrigatório para exclusão' });
        }
        
        const id = pathParts.pop();
        const dirPath = this.getDbPath(pathParts.join('/'));
        const filePath = path.join(dirPath, `${id}.json`);
        
        try {
          await fs.access(filePath);
          
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
        if (this.verbose) {
          console.error(`❌ [${new Date().toISOString()}] Erro no DELETE ${req.path}:`, error);
        }
        console.error('Erro no DELETE:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Rota não encontrada' });
    });
  }

  async start() {
    try {
      await this.ensureDirectoryExists(this.dbPath);
    } catch (error) {
      console.error(`❌ Erro ao criar diretório de dados: ${error.message}`);
      throw error;
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (error) => {
        if (error) {
          reject(error);
          return;
        }

        console.log(`🚀 Servidor rodando na porta ${this.port}`);
        console.log(`📁 Diretório de dados: ${this.dbPath}`);
        console.log(`� Modo verbose: ${this.verbose ? 'Ativado' : 'Desativado'}`);
        console.log(`�📋 Endpoints disponíveis:`);
        console.log(`   GET    /* - Listar itens de uma coleção (com filtros)`);
        console.log(`   GET    /*/:id - Obter item específico por UUID`);
        console.log(`   POST   /* - Criar novo item`);
        console.log(`   PUT    /*/:id - Atualizar item existente (completo)`);
        console.log(`   PATCH  /*/:id - Atualizar item existente (parcial)`);
        console.log(`   DELETE /*/:id - Remover item`);
        console.log(`📝 Filtros disponíveis:`);
        console.log(`   ?campo=valor - Filtro exato`);
        console.log(`   ?campo=valor* - Filtro com wildcard`);
        console.log(`   ?campo=>=10 - Filtro numérico (>=, <=, >, <, !=)`);
        console.log(`   ?_sort=campo&_order=asc|desc - Ordenação`);
        console.log(`   ?_limit=10&_offset=0 - Paginação`);

        resolve(this.server);
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 Servidor parado');
          resolve();
        });
      });
    }
  }

  getApp() {
    return this.app;
  }
}

// Function to start server (for CLI usage)
async function startServer(options = {}) {
  const server = new GenericRestServer(options);
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🔄 Recebido SIGTERM, parando servidor...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🔄 Recebido SIGINT, parando servidor...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

module.exports = {
  GenericRestServer,
  startServer
};
