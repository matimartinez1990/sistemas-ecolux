const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware para parsear JSON y servir archivos estáticos desde la carpeta 'public'
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar archivo db.json si no existe
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        db: {
            operarios: [],
            clientes: [],
            personal: [],
            proveedores: [],
            numeros: [],
            vehiculos: []
        },
        user: "ecolux",
        timestamp: new Date().toLocaleString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
}

// Endpoint GET: Obtener la base de datos actual
app.get('/api/data', (req, res) => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Error al leer la base de datos:", error);
        res.status(500).json({ error: "Error interno al leer los datos." });
    }
});

// Endpoint POST: Guardar o actualizar la base de datos completa
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        
        if (!newData || !newData.db) {
            return res.status(400).json({ error: "Estructura de datos inválida." });
        }

        // Guardar en el archivo JSON local
        fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2), 'utf-8');
        
        console.log(`[${new Date().toLocaleTimeString()}] Base de datos actualizada correctamente.`);
        res.json({ success: true, message: "Datos guardados permanentemente." });
    } catch (error) {
        console.error("Error al guardar la base de datos:", error);
        res.status(500).json({ error: "Error interno al guardar los datos." });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor de Ecolux corriendo exitosamente en http://localhost:${PORT}`);
});
