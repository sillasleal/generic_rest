# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-06-27

### Added - Library Transformation
- 🚀 **CLI Command**: Global installable command `generic-rest`
- 📦 **NPM Package**: Can be installed via `npm install generic-rest-api`
- 🔧 **Programmatic API**: `GenericRestServer` class for embedding in Node.js apps
- 📖 **Package.json Scripts**: Easy integration with project scripts
- 🛠 **Command Line Options**: `--port`, `--db-path`, `--help`
- 📝 **Usage Documentation**: Comprehensive USAGE.md with examples
- ⚡ **NPX Support**: Run without installation using `npx generic-rest-api`

### Changed - Code Structure
- 🏗 **Refactored Architecture**: Split monolithic file into modular structure
  - `src/server.js`: Core server logic in `GenericRestServer` class
  - `src/index.js`: Main entry point with exports
  - `bin/generic-rest`: CLI executable
- 🧪 **Updated Tests**: Refactored to use new class-based structure
- 📋 **Package Configuration**: Updated package.json for npm publishing
- 🎯 **Export Structure**: Clean exports for library usage

### Features Maintained
- ✅ **Full REST API**: GET, POST, PUT, PATCH, DELETE operations
- 🔍 **Advanced Filtering**: Exact, wildcard, numeric, negation filters
- 📊 **Sorting & Pagination**: `_sort`, `_order`, `_limit`, `_offset`
- 📁 **Automatic Directory Creation**: Path-based JSON file storage
- 🆔 **UUID Generation**: Automatic unique IDs for all items
- 📅 **Timestamps**: Automatic `createdAt` and `updatedAt` fields
- 🌐 **Nested Routes**: Support for nested directory structures

### Installation Options
```bash
# Global installation
npm install -g generic-rest-api

# Project dependency
npm install generic-rest-api

# No installation (npx)
npx generic-rest-api
```

### Usage Examples
```bash
# CLI usage
generic-rest --port 8080 --db-path ./data

# Package.json scripts
{
  "scripts": {
    "api": "generic-rest --port 3001",
    "mock": "generic-rest --db-path ./mock-data"
  }
}

# Programmatic usage
const { GenericRestServer } = require('generic-rest-api');
const server = new GenericRestServer({ port: 3000, dbPath: './data' });
server.start();
```

### Migration from Previous Version
- **No Breaking Changes**: Existing functionality preserved
- **Backward Compatible**: Original `node src/index.js` still works
- **Enhanced**: Additional features without losing existing capabilities

### Developer Experience
- 🎉 **Easy Integration**: Simple installation and setup process
- 📚 **Rich Documentation**: Complete usage examples and API reference
- 🧪 **Comprehensive Tests**: Full test coverage maintained
- 🔄 **Graceful Shutdown**: Proper signal handling for production use
