// server.js
const express = require('express');
const pool = require('./db'); // Importa la conexión a PostgreSQL
const app = express();
const PORT = 3000;

app.use(express.json());

// Middleware para registrar las consultas realizadas
const logMiddleware = (req, res, next) => {
  console.log(`Se realizó una consulta a la ruta: ${req.method} ${req.url}`);
  next();
};

app.use(logMiddleware);

// Ruta GET /joyas con HATEOAS, límite, paginación y ordenamiento
app.get('/joyas', async (req, res) => {
  try {
    const { limit = 10, page = 1, order_by = 'precio_ASC' } = req.query;
    const [orderField, orderDirection] = order_by.split('_');
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM inventario
      ORDER BY ${orderField} ${orderDirection.toUpperCase()}
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?').shift()}`;
    const links = {
      self: `${baseUrl}?page=${page}&limit=${limit}&order_by=${order_by}`,
      next: `${baseUrl}?page=${parseInt(page) + 1}&limit=${limit}&order_by=${order_by}`,
      previous: `${baseUrl}?page=${page > 1 ? page - 1 : 1}&limit=${limit}&order_by=${order_by}`
    };

    // Imprimir en la terminal los datos y enlaces
    console.log('Datos enviados en la respuesta:', result.rows);
    console.log('Enlaces HATEOAS:', links);

    // Respuesta al cliente
    res.json({
      data: result.rows,
      links: links
    });
  } catch (error) {
    console.error('Error al obtener las joyas:', error.message);
    res.status(500).json({ error: 'Error al obtener las joyas.' });
  }
});


// Ruta GET /joyas/filtros con consultas parametrizadas

app.get('/joyas/filtros', async (req, res) => {
  try {
    const { precio_min = 0, precio_max = 999999, categoria, metal } = req.query;
    
    // Crear la consulta SQL
    let query = 'SELECT * FROM inventario WHERE precio >= $1 AND precio <= $2';
    const params = [precio_min, precio_max];

    if (categoria) {
      query += ' AND categoria = $3';
      params.push(categoria);
    }

    if (metal) {
      query += ' AND metal = $4';
      params.push(metal);
    }

    console.log('Consulta SQL:', query);
    console.log('Parámetros:', params);

    // Ejecutar la consulta
    const result = await pool.query(query, params);

    // Enviar la respuesta
    res.json(result.rows);
  } catch (error) {
    console.error('Error al filtrar joyas:', error.stack || error.message);
    res.status(500).json({ error: 'Error al filtrar joyas.' });
  }
});



// Middleware para capturar errores no manejados
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Algo salió mal.' });
});

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
