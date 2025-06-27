# Generic REST API - Usage Examples

## Installation & Setup

### Install globally
```bash
npm install -g generic-rest-api
```

### Install as project dependency
```bash
npm install generic-rest-api
```

## Command Line Usage

### Basic usage
```bash
# Start with defaults (port 3000, ./db folder)
generic-rest

# Custom port
generic-rest --port 8080

# Custom database path
generic-rest --db-path ./my-data

# Both custom port and path
generic-rest -p 8080 --db ./api-data
```

### Using npx (no installation needed)
```bash
npx generic-rest-api
npx generic-rest-api --port 8080 --db-path ./data
```

## Package.json Scripts

Add to your `package.json`:
```json
{
  "scripts": {
    "api": "generic-rest",
    "api:dev": "generic-rest --port 3001",
    "mock-server": "generic-rest --db-path ./mock-data --port 8080",
    "backend": "generic-rest -p 4000 --db ./backend-data"
  }
}
```

Then run:
```bash
npm run api          # Starts on port 3000
npm run api:dev      # Starts on port 3001
npm run mock-server  # Starts on port 8080 with ./mock-data
npm run backend      # Starts on port 4000 with ./backend-data
```

## Programmatic Usage

### Basic server setup
```javascript
const { GenericRestServer } = require('generic-rest-api');

const server = new GenericRestServer({
  port: 3000,
  dbPath: './data'
});

server.start().then(() => {
  console.log('Server started!');
});
```

### With custom middleware
```javascript
const { GenericRestServer } = require('generic-rest-api');

const server = new GenericRestServer({
  port: process.env.PORT || 4000,
  dbPath: process.env.DB_PATH || './api-data'
});

// Get Express app instance
const app = server.getApp();

// Add custom routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/info', (req, res) => {
  res.json({
    name: 'My API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add CORS if needed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  next();
});

server.start().catch(console.error);
```

### With graceful shutdown
```javascript
const { GenericRestServer } = require('generic-rest-api');

const server = new GenericRestServer({
  port: 3000,
  dbPath: './data'
});

// Start server
server.start().then(() => {
  console.log('Server running...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...');
  await server.stop();
  process.exit(0);
});
```

## API Examples

Once your server is running, you can use these endpoints:

### Create items
```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'

# Create a product in subcategory
curl -X POST http://localhost:3000/products/electronics \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "brand": "Dell", "price": 999.99}'
```

### List items
```bash
# List all users
curl http://localhost:3000/users

# List products in electronics category
curl http://localhost:3000/products/electronics
```

### Filter items
```bash
# Filter by exact match
curl "http://localhost:3000/users?name=John"

# Filter with wildcard
curl "http://localhost:3000/users?name=John*"

# Numeric filters
curl "http://localhost:3000/products?price>=100"
curl "http://localhost:3000/products?price<500"

# Negation
curl "http://localhost:3000/users?status!=inactive"

# Multiple filters
curl "http://localhost:3000/products?category=electronics&price>=100"
```

### Sort and paginate
```bash
# Sort by name ascending
curl "http://localhost:3000/users?_sort=name&_order=asc"

# Sort by price descending
curl "http://localhost:3000/products?_sort=price&_order=desc"

# Pagination
curl "http://localhost:3000/users?_limit=10&_offset=0"

# Combined: filter, sort, and paginate
curl "http://localhost:3000/products?category=electronics&_sort=price&_order=desc&_limit=5"
```

### Get specific item
```bash
# Get user by UUID
curl http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000
```

### Update items
```bash
# Complete update (PUT)
curl -X PUT http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith", "email": "john.smith@example.com", "age": 31}'

# Partial update (PATCH)
curl -X PATCH http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"age": 32}'
```

### Delete items
```bash
# Delete user
curl -X DELETE http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000
```

## Integration Examples

### Frontend Development
```json
{
  "scripts": {
    "dev": "npm run api & npm run frontend",
    "api": "generic-rest --port 3001 --db-path ./dev-data",
    "frontend": "react-scripts start"
  }
}
```

### Testing Environment
```json
{
  "scripts": {
    "test": "npm run test:api & npm run test:unit",
    "test:api": "generic-rest --port 3002 --db-path ./test-data",
    "test:unit": "jest"
  }
}
```

### Docker Compose
```yaml
version: '3.8'
services:
  api:
    image: node:16
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    command: npx generic-rest-api --port 3000 --db-path /app/data
    
  frontend:
    image: node:16
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "3001:3001"
    depends_on:
      - api
    command: npm run dev
```

## Use Cases

### 1. Frontend Prototyping
```bash
# Start mock API for your React/Vue/Angular app
generic-rest --port 3001 --db-path ./prototype-data
```

### 2. Integration Testing
```bash
# Start test API with clean data
generic-rest --port 3002 --db-path ./test-fixtures
```

### 3. Development Backend
```bash
# Replace real backend during development
generic-rest --port 8080 --db-path ./dev-backend
```

### 4. Learning/Teaching REST APIs
```bash
# Simple server for learning HTTP methods
generic-rest --port 3000
```

### 5. Microservice Mocking
```bash
# Mock external services
generic-rest --port 9001 --db-path ./service1-mock
generic-rest --port 9002 --db-path ./service2-mock
```
