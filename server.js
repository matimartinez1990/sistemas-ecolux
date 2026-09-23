const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a PostgreSQL (Render provee la variable DATABASE_URL automáticamente)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar la tabla en PostgreSQL si no existe
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_data (
                id SERIAL PRIMARY KEY,
                content JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Verificar si ya hay un registro inicial
        const res = await pool.query('SELECT COUNT(*) FROM app_data');
        if (parseInt(res.rows[0].count) === 0) {
            const initialDb = {
                operarios: [],
                clientes: [],
                personal: [],
                proveedores: [],
                numeros: [],
                vehiculos: []
            };
            await pool.query('INSERT INTO app_data (content) VALUES ($1)', [initialDb]);
        }
        console.log("Base de datos PostgreSQL inicializada correctamente.");
    } catch (err) {
        console.error("Error al inicializar la tabla en PostgreSQL:", err);
    }
}
initDB();

// Endpoint GET: Obtener datos desde PostgreSQL
app.get('/api/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT content FROM app_data ORDER BY id DESC LIMIT 1');
        if (result.rows.length > 0) {
            res.json({ db: result.rows[0].content });
        } else {
            res.json({ db: { operarios: [], clientes: [], personal: [], proveedores: [], numeros: [], vehiculos: [] } });
        }
    } catch (error) {
        console.error("Error al leer de PostgreSQL:", error);
        res.status(500).json({ error: "Error al leer los datos de la base de datos." });
    }
});

// Endpoint POST: Guardar datos en PostgreSQL de forma permanente
app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body.db;
        if (!newData) {
            return res.status(400).json({ error: "Estructura de datos inválida." });
        }

        // Actualizar o insertar el registro único de la aplicación
        const check = await pool.query('SELECT id FROM app_data ORDER BY id DESC LIMIT 1');
        if (check.rows.length > 0) {
            await pool.query('UPDATE app_data SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newData, check.rows[0].id]);
        } else {
            await pool.query('INSERT INTO app_data (content) VALUES ($1)', [newData]);
        }

        console.log(`[${new Date().toLocaleTimeString()}] Datos guardados permanentemente en PostgreSQL.`);
        res.json({ success: true, message: "Datos guardados en PostgreSQL." });
    } catch (error) {
        console.error("Error al guardar en PostgreSQL:", error);
        res.status(500).json({ error: "Error al guardar los datos en la base de datos." });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor de Ecolux corriendo en el puerto ${PORT}`);
});
