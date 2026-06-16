const repositoryFactory = require('@app-core/repository-factory');

// Must match the model name exported from models/index.js (PascalCase).
module.exports = repositoryFactory('CreatorCard');
