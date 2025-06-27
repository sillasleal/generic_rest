const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, '..', 'db');

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
  // Remove a barra inicial e converte para caminho do sistema
  const cleanPath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath;
  return path.join(DB_PATH, cleanPath);
}

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
        
        const items = [];
        for (const file of jsonFiles) {
          const filePath = path.join(fullPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          items.push({ id: path.parse(file).name, ...data });
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Diretório de dados: ${DB_PATH}`);
  console.log(`📋 Endpoints disponíveis:`);
  console.log(`   GET    /* - Listar itens de uma coleção`);
  console.log(`   GET    /*/:id - Obter item específico por UUID`);
  console.log(`   POST   /* - Criar novo item`);
  console.log(`   PUT    /*/:id - Atualizar item existente (completo)`);
  console.log(`   PATCH  /*/:id - Atualizar item existente (parcial)`);
  console.log(`   DELETE /*/:id - Remover item`);
});