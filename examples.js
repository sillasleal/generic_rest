const { GenericRestServer } = require('./src/index');

// Example 1: Basic usage
console.log('Example 1: Basic server setup');

const server1 = new GenericRestServer({
  port: 3001,
  dbPath: './example-data'
});

server1.start().then(() => {
  console.log('✅ Server 1 started on port 3001');
  console.log('📁 Data will be stored in ./example-data');
  console.log('🌐 Try: curl http://localhost:3001/users');
  
  // Stop after 5 seconds for demo
  setTimeout(async () => {
    await server1.stop();
    console.log('🛑 Server 1 stopped\n');
    
    // Example 2: Server with custom middleware
    console.log('Example 2: Server with custom middleware');
    
    const server2 = new GenericRestServer({
      port: 3002,
      dbPath: './api-data'
    });
    
    // Add custom middleware
    const app = server2.getApp();
    
    app.use('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    app.use('/info', (req, res) => {
      res.json({
        name: 'Generic REST API',
        version: '1.0.0',
        endpoints: [
          'GET /health - Health check',
          'GET /info - API information',
          'GET /* - List items or get specific item',
          'POST /* - Create new item',
          'PUT /*/:id - Update item (complete)',
          'PATCH /*/:id - Update item (partial)',
          'DELETE /*/:id - Delete item'
        ]
      });
    });
    
    server2.start().then(() => {
      console.log('✅ Server 2 started on port 3002');
      console.log('📁 Data will be stored in ./api-data');
      console.log('🌐 Try: curl http://localhost:3002/health');
      console.log('🌐 Try: curl http://localhost:3002/info');
      
      // Stop after 5 seconds for demo
      setTimeout(async () => {
        await server2.stop();
        console.log('🛑 Server 2 stopped');
        console.log('\n🎉 Examples completed!');
      }, 5000);
    });
    
  }, 5000);
}).catch(console.error);
