# Generic REST API

[![Node.js Package](https://github.com/sillasleal/generic_rest/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/sillasleal/generic_rest/actions/workflows/npm-publish.yml)
[![Node.js Tests](https://github.com/sillasleal/generic_rest/actions/workflows/node.js.yml/badge.svg)](https://github.com/sillasleal/generic_rest/actions/workflows/node.js.yml)

A generic REST API library that creates and manages JSON files based on the request path. Perfect for rapid prototyping, testing, and development environments.

## 🎯 Motivation

This project was created to address the need for **quick API creation for testing projects at various levels**. Whether you're:

- 🔬 **Prototyping** a new frontend application
- 🧪 **Testing** integration between different systems
- 📚 **Learning** REST API concepts and HTTP methods
- 🚀 **Developing** proof-of-concepts rapidly
- 🔄 **Mocking** external services for development

Generic REST API provides an instant, file-based backend that adapts to your data structure automatically. No database setup, no complex configuration - just start sending requests and your API endpoints are ready to use.

## 📦 Installation

### As a global CLI tool
```bash
npm install -g generic-rest-api
```

### As a project dependency
```bash
npm install generic-rest-api
```

### Using npx (no installation required)
```bash
npx generic-rest-api
```

## 🚀 Usage

### Command Line Interface

Start the server with default settings (port 3000, ./db folder):
```bash
generic-rest
# or
npx generic-rest-api
```

Start with custom port and database path:
```bash
generic-rest --port 8080 --db-path ./my-data
# or
npx generic-rest-api -p 8080 --db ./my-data
```

### In Package.json Scripts

Add to your `package.json`:
```json
{
  "scripts": {
    "api": "generic-rest --port 3001",
    "mock-server": "generic-rest --db-path ./mock-data",
    "dev-api": "generic-rest -p 8080 --db ./dev-data"
  }
}
```

Then run:
```bash
npm run api
npm run mock-server
npm run dev-api
```

### Programmatic Usage

```javascript
const { GenericRestServer } = require('generic-rest-api');

// Create and start server
const server = new GenericRestServer({
  port: 3000,
  dbPath: './data'
});

server.start().then(() => {
  console.log('Server started!');
});

// Stop server
server.stop().then(() => {
  console.log('Server stopped!');
});
```

### Advanced Programmatic Usage

```javascript
const { GenericRestServer } = require('generic-rest-api');

const server = new GenericRestServer({
  port: process.env.PORT || 4000,
  dbPath: process.env.DB_PATH || './api-data'
});

// Get Express app for custom middleware
const app = server.getApp();

// Add custom middleware before starting
app.use('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
server.start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});
```

## 🔧 CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Port to run the server | `3000` |
| `--db-path` | `--db` | Database directory path | `./db` |
| `--help` | `-h` | Show help message | - |

## 🚀 Features

- **GET** - List items from a directory or get a specific item (with advanced filters)
- **POST** - Create a new item with unique UUID
- **PUT** - Update an existing item (complete replacement)
- **PATCH** - Update an existing item (partial update)
- **DELETE** - Remove an item

## 📁 Data Structure

- Each item is saved as a JSON file with UUID name (e.g., `550e8400-e29b-41d4-a716-446655440000.json`)
- The request path corresponds to the path in the database folder
- Directories are created automatically as needed

## 📝 Usage Examples

### Create a user
```bash
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "John Silva",
  "email": "john@email.com"
}
```

### List users
```bash
GET http://localhost:3000/users
```

### List users with filters
```bash
# Exact filter
GET http://localhost:3000/users?name=John

# Wildcard filter
GET http://localhost:3000/users?name=John*

# Numeric filters
GET http://localhost:3000/products?price>=100
GET http://localhost:3000/products?price<500

# Negation filter
GET http://localhost:3000/users?status!=inactive

# Sorting
GET http://localhost:3000/users?_sort=name&_order=asc

# Pagination
GET http://localhost:3000/users?_limit=10&_offset=0

# Combining filters
GET http://localhost:3000/products?category=electronics&price>=100&_sort=price&_order=desc&_limit=5
```

### Get specific user
```bash
GET http://localhost:3000/users/{uuid}
```

### Update user (complete)
```bash
PUT http://localhost:3000/users/{uuid}
Content-Type: application/json

{
  "name": "John Santos",
  "email": "john.santos@email.com"
}
```

### Update user (partial)
```bash
PATCH http://localhost:3000/users/{uuid}
Content-Type: application/json

{
  "name": "John Santos"
}
```

### Remove user
```bash
DELETE http://localhost:3000/users/{uuid}
```

### Create product in subcategory
```bash
POST http://localhost:3000/products/electronics/smartphones
Content-Type: application/json

{
  "name": "iPhone 15",
  "price": 999.99
}
```

## 🛠️ Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode (with hot reload)
- `npm test` - Run all automated tests
- `npm run test:watch` - Run tests in watch mode (re-run on save)

## 🧪 Tests

The project includes a complete automated test suite covering:

- ✅ Item creation (POST)
- ✅ Listing and search by ID (GET)
- ✅ Complete (PUT) and partial (PATCH) updates
- ✅ Item removal (DELETE)
- ✅ All filters and operators
- ✅ Sorting and pagination
- ✅ Error handling
- ✅ Data persistence

### Run tests
```bash
# Run all tests
npm test

# Run tests with details
npm test -- --verbose

# Run tests in watch mode
npm run test:watch
```

## 📂 Project Structure

```
generic-rest/
├── .devcontainer/
│   ├── devcontainer.json
├── .vscode/
│   ├── tasks.json
│   └── launch.json
├── __tests__/
│   └── api.test.js      # Automated tests
├── db/                  # Data directory (created automatically)
├── src/
│   └── index.js        # Main API file
├── .gitignore
├── package.json
├── README.md
└── TESTS.md            # Test documentation
```

## 🔧 Configuration

### Server Port
The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

### Database Path
By default, data is saved in the project's `db/` folder. You can configure a custom path in three ways:

> **💡 Automatic Creation**: The specified directory will be created automatically during server initialization if it doesn't exist.

#### 1. Command line argument:
```bash
node src/index.js --db-path /custom/path/data
npm start -- --db-path /custom/path/data
```

#### 2. Environment variable:
```bash
DB_PATH=/custom/path/data npm start
```

#### 3. Docker/Dev Container:
```bash
# In docker-compose.yml or devcontainer.json
DB_PATH=/workspace/my-data
```

### Priority order:
1. **`--db-path` argument** (highest priority)
2. **`DB_PATH` environment variable**
3. **Default `./db`** (lowest priority)

### Usage examples:

```bash
# Use specific folder
node src/index.js --db-path /var/data/api

# Use temporary folder for tests
DB_PATH=/tmp/test-data npm run dev

# Use relative folder
npm start -- --db-path ./my-data

# Check which folder is being used (appears in startup log)
npm start -- --db-path ./custom-db
# Output: 📁 Data directory: /workspaces/generic-rest/custom-db
```

> **💡 Tip**: The absolute path being used always appears in the server startup log for confirmation.

## 📋 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/*`     | List directory items (with filters) or get specific item by UUID |
| POST   | `/*`     | Create new item in specified directory |
| PUT    | `/*/:id` | Update existing item (complete replacement) |
| PATCH  | `/*/:id` | Update existing item (partial update) |
| DELETE | `/*/:id` | Remove item |

All endpoints respond with JSON and include appropriate error handling.

## 🔍 Available Filters (GET)

### Field Filters
- **Exact filter**: `?field=value` - Search for exact values (case-insensitive)
- **Wildcard**: `?field=value*` - Search with pattern using asterisk
- **Negation**: `?field!=value` - Exclude items with specified value

### Numeric Filters
- **Greater than**: `?field>10`
- **Greater or equal**: `?field>=10`
- **Less than**: `?field<100`
- **Less or equal**: `?field<=100`

### Sorting and Pagination
- **Sorting**: `?_sort=field&_order=asc|desc`
- **Pagination**: `?_limit=10&_offset=0`

### Filter Examples

```bash
# Search for electronic products with price between 100 and 500
GET /products?category=electronics&price>=100&price<=500

# Search for users whose name starts with "John"
GET /users?name=John*

# List first 10 products sorted by price (ascending)
GET /products?_sort=price&_order=asc&_limit=10

# Search for houses with more than 2 bedrooms, except inactive ones
GET /houses?bedrooms>2&status!=inactive
```

## 🔄 Difference between PUT and PATCH

### PUT - Complete Update
- Replaces **all** item content
- Fields not sent are **removed**
- Useful when you have all item data

```bash
# Original item: { "id": "123", "name": "John", "email": "john@email.com", "age": 30 }
PUT /users/123
{
  "name": "John Silva"
}
# Result: { "id": "123", "name": "John Silva", "updatedAt": "..." }
# Note that "email" and "age" were removed
```

### PATCH - Partial Update
- Updates **only** the sent fields
- Fields not sent are **preserved**
- Useful for specific changes

```bash
# Original item: { "id": "123", "name": "John", "email": "john@email.com", "age": 30 }
PATCH /users/123
{
  "name": "John Silva"
}
# Result: { "id": "123", "name": "John Silva", "email": "john@email.com", "age": 30, "updatedAt": "..." }
# Note that "email" and "age" were preserved
```

## � Publishing & Contributing

### Publishing to NPM

To publish this package to npm:

1. **Update version** in `package.json`
2. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```
3. **Login to npm**:
   ```bash
   npm login
   ```
4. **Publish**:
   ```bash
   npm publish
   ```

### Before Publishing Checklist
- [ ] All tests pass (`npm test`)
- [ ] README.md is updated
- [ ] CHANGELOG.md is updated
- [ ] Version is bumped in package.json
- [ ] Repository URL is correct in package.json

### Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Add tests** for new functionality
5. **Run tests**: `npm test`
6. **Commit** changes: `git commit -m 'Add amazing feature'`
7. **Push** to branch: `git push origin feature/amazing-feature`
8. **Create** a Pull Request

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/generic-rest-api.git
cd generic-rest-api

# Install dependencies
npm install

# Run tests
npm test

# Run development server
npm run dev

# Test CLI command
node bin/generic-rest --help
```

### Running Examples

```bash
# Test the programmatic API
node examples.js

# Test CLI manually
node bin/generic-rest --port 3333 --db-path ./test-data
```

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License

```
MIT License

Copyright (c) 2025 Generic REST API

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### MIT License Summary

- ✅ **Commercial use** - You can use this software commercially
- ✅ **Modification** - You can modify the software
- ✅ **Distribution** - You can distribute the software
- ✅ **Private use** - You can use the software privately
- ✅ **Sublicensing** - You can sublicense the software

**Conditions:**
- 📋 **Include license** - A copy of the license and copyright notice must be included with the software
- 📋 **Include copyright** - Copyright notice must be included

**Limitations:**
- ❌ **No liability** - The license includes a limitation of liability
- ❌ **No warranty** - The license states that the software is provided without warranty
