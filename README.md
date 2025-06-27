# Generic REST API

A generic REST API that creates and manages JSON files based on the request path.

## � Motivation

This project was created to address the need for **quick API creation for testing projects at various levels**. Whether you're:

- 🔬 **Prototyping** a new frontend application
- 🧪 **Testing** integration between different systems
- 📚 **Learning** REST API concepts and HTTP methods
- 🚀 **Developing** proof-of-concepts rapidly
- 🔄 **Mocking** external services for development

Generic REST API provides an instant, file-based backend that adapts to your data structure automatically. No database setup, no complex configuration - just start sending requests and your API endpoints are ready to use.

## �🚀 Features

- **GET** - List items from a directory or get a specific item (with advanced filters)
- **POST** - Create a new item with unique UUID
- **PUT** - Update an existing item (complete replacement)
- **PATCH** - Update an existing item (partial update)
- **DELETE** - Remove an item

## 📁 Data Structure

- Each item is saved as a JSON file with UUID name (e.g., `550e8400-e29b-41d4-a716-446655440000.json`)
- The request path corresponds to the path in the `db/` folder
- Directories are created automatically as needed

## 🐳 Using Dev Container

### Prerequisites
- VS Code installed
- "Dev Containers" extension installed
- Docker installed and running

### How to use
1. Open the project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Dev Containers: Reopen in Container"
4. Wait for the container to be built and configured
5. The server will start automatically on port 3000

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

## 📄 License

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
