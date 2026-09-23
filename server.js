const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a PostgreSQL (Render provee DATABASE_URL automáticamente)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar la tabla y los datos por defecto si la base de datos está vacía
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_data (
                id SERIAL PRIMARY KEY,
                content JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        const res = await pool.query('SELECT COUNT(*) FROM app_data');
        if (parseInt(res.rows[0].count) === 0) {
            // Datos iniciales integrados de Ecolux (Av. Dorrego 2646, CABA)
            const initialDb = {
                operarios: [],
                clientes: [
                    { nombre: "Cliente Inicial de Prueba", direccion: "Av. Dorrego 2646, CABA", mail: "contacto@ecolux.com", facturacion: "30-12345678-9", estado: "Activo" }
                ],
                personal: [],
                proveedores: [],
                numeros: [
                    { concepto: "Dirección", numero: "Av. Dorrego 2646, CABA" },
                    { concepto: "Teléfono Principal", numero: "4777-9336" }
                ],
                vehiculos: []
            };
            await pool.query('INSERT INTO app_data (content) VALUES ($1)', [initialDb]);
            console.log("Datos iniciales de Ecolux cargados correctamente en PostgreSQL.");
        }
    } catch (err) {
        console.error("Error al inicializar la base de datos:", err);
    }
}
initDB();

// Endpoint GET: Obtiene la información actual persistida
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
        res.status(500).json({ error: "Error al leer los datos." });
    }
});

// Endpoint POST: Guarda y actualiza de manera permanente cualquier cambio (altas, modificaciones, eliminaciones)
app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body.db;
        if (!newData) {
            return res.status(400).json({ error: "Estructura de datos inválida." });
        }

        const check = await pool.query('SELECT id FROM app_data ORDER BY id DESC LIMIT 1');
        if (check.rows.length > 0) {
            await pool.query('UPDATE app_data SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newData, check.rows[0].id]);
        } else {
            await pool.query('INSERT INTO app_data (content) VALUES ($1)', [newData]);
        }

        console.log(`[${new Date().toLocaleTimeString()}] Cambios guardados permanentemente en la base de datos.`);
        res.json({ success: true, message: "Datos guardados con éxito." });
    } catch (error) {
        console.error("Error al guardar en PostgreSQL:", error);
        res.status(500).json({ error: "Error al guardar los datos." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Ecolux operando en el puerto ${PORT}`);
});
