const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const { GenericRestServer } = require('../src/index');

const TEST_DB_PATH = path.join(__dirname, 'test-db');

describe('Generic REST API', () => {
  let server;
  let app;

  beforeAll(async () => {
    // Create a server instance for testing
    server = new GenericRestServer({
      port: 0, // Use any available port
      dbPath: TEST_DB_PATH
    });
    
    app = server.getApp();
  });

  beforeEach(async () => {
    // Clean test database before each test
    try {
      await fs.rm(TEST_DB_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  afterAll(async () => {
    // Clean up test database after all tests
    try {
      await fs.rm(TEST_DB_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  describe('POST requests', () => {
    it('should create a new item and return it with UUID and createdAt', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      
      // Verify UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.body.id).toMatch(uuidRegex);
    });

    it('should create nested directory structure', async () => {
      const productData = {
        name: 'Laptop',
        price: 999.99
      };

      const response = await request(app)
        .post('/products/electronics')
        .send(productData)
        .expect(201);

      expect(response.body.name).toBe(productData.name);
      expect(response.body.price).toBe(productData.price);

      // Check if file was created in correct directory
      const dirPath = path.join(TEST_DB_PATH, 'products', 'electronics');
      const files = await fs.readdir(dirPath);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/^[0-9a-f-]+\.json$/);
    });
  });

  describe('GET requests', () => {
    it('should return empty array for non-existent collection', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return list of items after creation', async () => {
      // Create a user first
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createResponse = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      // Get the list
      const listResponse = await request(app)
        .get('/users')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]).toEqual(createResponse.body);
    });

    it('should return specific item by UUID', async () => {
      // Create a user first
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createResponse = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.id;

      // Get specific user
      const getResponse = await request(app)
        .get(`/users/${userId}`)
        .expect(200);

      expect(getResponse.body).toEqual(createResponse.body);
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Filtering', () => {
    beforeEach(async () => {
      // Create test data
      const users = [
        { name: 'John Doe', age: 30, status: 'active' },
        { name: 'Jane Smith', age: 25, status: 'inactive' },
        { name: 'Bob Johnson', age: 35, status: 'active' }
      ];

      for (const user of users) {
        await request(app).post('/users').send(user);
      }
    });

    it('should filter by exact match', async () => {
      const response = await request(app)
        .get('/users?status=active')
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach(user => {
        expect(user.status).toBe('active');
      });
    });

    it('should filter by wildcard', async () => {
      const response = await request(app)
        .get('/users?name=Jane*')
        .expect(200);

      // Jane* should match only "Jane Smith"
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Jane Smith');
    });

    it('should filter by numeric comparison (>=)', async () => {
      const response = await request(app)
        .get('/users?age=%3E%3D30') // URL encoded >=30
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach(user => {
        expect(user.age).toBeGreaterThanOrEqual(30);
      });
    });

    it('should filter by numeric comparison (<)', async () => {
      const response = await request(app)
        .get('/users?age=%3C30') // URL encoded <30
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].age).toBeLessThan(30);
    });

    it('should filter by negation (!=)', async () => {
      const response = await request(app)
        .get('/users?status=%21%3Dactive') // URL encoded !=active
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('inactive');
    });
  });

  describe('Sorting', () => {
    beforeEach(async () => {
      const users = [
        { name: 'Charlie', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 35 }
      ];

      for (const user of users) {
        await request(app).post('/users').send(user);
      }
    });

    it('should sort by field ascending', async () => {
      const response = await request(app)
        .get('/users?_sort=name&_order=asc')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBe('Alice');
      expect(response.body[1].name).toBe('Bob');
      expect(response.body[2].name).toBe('Charlie');
    });

    it('should sort by field descending', async () => {
      const response = await request(app)
        .get('/users?_sort=age&_order=desc')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].age).toBe(35);
      expect(response.body[1].age).toBe(30);
      expect(response.body[2].age).toBe(25);
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      // Create 5 users
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/users')
          .send({ name: `User ${i}`, index: i });
      }
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/users?_limit=3')
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should offset results', async () => {
      const response = await request(app)
        .get('/users?_offset=2&_limit=2')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT requests', () => {
    it('should update existing item completely', async () => {
      // Create a user first
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createResponse = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.id;

      // Update the user
      const updatedData = { name: 'John Smith', email: 'john.smith@example.com', age: 30 };
      const updateResponse = await request(app)
        .put(`/users/${userId}`)
        .send(updatedData)
        .expect(200);

      expect(updateResponse.body.id).toBe(userId);
      expect(updateResponse.body.name).toBe(updatedData.name);
      expect(updateResponse.body.email).toBe(updatedData.email);
      expect(updateResponse.body.age).toBe(updatedData.age);
      expect(updateResponse.body).toHaveProperty('updatedAt');
      expect(updateResponse.body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .put(`/users/${nonExistentId}`)
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH requests', () => {
    it('should update existing item partially', async () => {
      // Create a user first
      const userData = { name: 'John Doe', email: 'john@example.com', age: 25 };
      const createResponse = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.id;

      // Partially update the user
      const partialUpdate = { age: 30 };
      const updateResponse = await request(app)
        .patch(`/users/${userId}`)
        .send(partialUpdate)
        .expect(200);

      expect(updateResponse.body.id).toBe(userId);
      expect(updateResponse.body.name).toBe(userData.name); // Should remain unchanged
      expect(updateResponse.body.email).toBe(userData.email); // Should remain unchanged
      expect(updateResponse.body.age).toBe(30); // Should be updated
      expect(updateResponse.body).toHaveProperty('updatedAt');
    });
  });

  describe('DELETE requests', () => {
    it('should delete existing item', async () => {
      // Create a user first
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createResponse = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.id;

      // Delete the user
      const deleteResponse = await request(app)
        .delete(`/users/${userId}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('message');
      expect(deleteResponse.body.id).toBe(userId);

      // Verify user is deleted
      await request(app)
        .get(`/users/${userId}`)
        .expect(404);
    });

    it('should return 404 for non-existent item', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .delete(`/users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error handling', () => {
    it('should handle PUT to collection (treating as POST-like behavior)', async () => {
      // Since PUT without ID goes to the collection route, it gets handled by 404 handler
      const response = await request(app)
        .put('/users')
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle PATCH to collection (treating as not found)', async () => {
      // Since PATCH without ID goes to the collection route, it gets handled by 404 handler
      const response = await request(app)
        .patch('/users')
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle DELETE to collection (treating as not found)', async () => {
      // Since DELETE without ID goes to the collection route, it gets handled by 404 handler
      const response = await request(app)
        .delete('/users')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array for unknown collections', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(200); // Returns empty array for non-existent collections

      expect(response.body).toEqual([]);
    });
  });

  describe('Verbose logging', () => {
    let verboseServer;
    let verboseApp;
    let consoleLogSpy;

    beforeAll(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      verboseServer = new GenericRestServer({
        port: 0,
        dbPath: path.join(TEST_DB_PATH, 'verbose'),
        verbose: true
      });
      
      verboseApp = verboseServer.getApp();
    });

    afterAll(() => {
      consoleLogSpy.mockRestore();
    });

    beforeEach(() => {
      consoleLogSpy.mockClear();
    });

    it('should log request and response details when verbose is enabled', async () => {
      const userData = {
        name: 'Verbose Test',
        email: 'verbose@test.com'
      };

      await request(verboseApp)
        .post('/test-collection')
        .send(userData)
        .expect(201);

      // Check if verbose logging occurred
      const logCalls = consoleLogSpy.mock.calls;
      const logMessages = logCalls.map(call => call[0]).join(' ');

      expect(logMessages).toContain('📥'); // Request log icon
      expect(logMessages).toContain('POST /test-collection');
      expect(logMessages).toContain('Query:');
      expect(logMessages).toContain('Body:');
      expect(logMessages).toContain('📤'); // Response log icon
      expect(logMessages).toContain('Response');
      expect(logMessages).toContain('Status: 201');
    });

    it('should include error logging when verbose is enabled', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Try to access a non-existent item with a valid UUID format to trigger error path
      const validUuid = '12345678-1234-1234-1234-123456789012';
      await request(verboseApp)
        .get(`/users/${validUuid}`)
        .expect(404);

      consoleErrorSpy.mockRestore();
    });
  });
});
