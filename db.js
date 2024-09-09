// db.js
const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'joyas',
  password: '1234', // Aquí colocas tu contraseña de PostgreSQL
  port: 5432,
});

module.exports = pool;
