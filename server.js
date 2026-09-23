const express = require('express');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la Base de Datos (lee la variable DATABASE_URL de Render automáticamente)
const sequelize = process.env.DATABASE_URL 
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
    : new Sequelize('ecolux_db', 'postgres', 'password', {
        host: 'localhost',
        dialect: 'postgres'
    });

// Definición de Modelos (Tablas)
const Operario = sequelize.define('Operario', {
    leg: { type: DataTypes.INTEGER, primaryKey: true },
    nombre: DataTypes.STRING,
    cuil: DataTypes.STRING,
    domicilio: DataTypes.STRING,
    ingreso: DataTypes.STRING,
    egreso: DataTypes.STRING,
    categoria: DataTypes.STRING
});

const Cliente = sequelize.define('Cliente', {
    nombre: { type: DataTypes.STRING, primaryKey: true },
    direccion: DataTypes.STRING,
    mail: DataTypes.STRING,
    facturacion: DataTypes.STRING,
    estado: DataTypes.STRING
});

const PersonalOficial = sequelize.define('PersonalOficial', {
    nombre: { type: DataTypes.STRING, primaryKey: true },
    celular: DataTypes.STRING,
    modelo: DataTypes.STRING,
    cuil: DataTypes.STRING
});

const Proveedor = sequelize.define('Proveedor', {
    nombre: { type: DataTypes.STRING, primaryKey: true },
    detalle: DataTypes.TEXT
});

const NumeroArt = sequelize.define('NumeroArt', {
    concepto: { type: DataTypes.STRING, primaryKey: true },
    numero: DataTypes.TEXT
});

const Vehiculo = sequelize.define('Vehiculo', {
    patente: { type: DataTypes.STRING, primaryKey: true },
    vehiculo: DataTypes.STRING,
    dueno: DataTypes.STRING,
    chasis: DataTypes.STRING,
    motor: DataTypes.STRING,
    seguro: DataTypes.STRING,
    vtoVtv: DataTypes.STRING
});

// Endpoint GET: Trae toda la base de datos unificada para el Frontend
app.get('/api/data', async (req, res) => {
    try {
        const operarios = await Operario.findAll();
        const clientes = await Cliente.findAll();
        const personal = await PersonalOficial.findAll();
        const proveedores = await Proveedor.findAll();
        const numeros = await NumeroArt.findAll();
        const vehiculos = await Vehiculo.findAll();

        res.json({
            db: {
                operarios,
                clientes,
                personal,
                proveedores,
                numeros,
                vehiculos
            }
        });
    } catch (e) {
        console.error("Error al obtener datos:", e);
        res.status(500).json({ error: "Error al leer de la base de datos" });
    }
});

// Endpoint POST: Recibe el estado completo de la app y actualiza/crea en la BD
app.post('/api/data', async (req, res) => {
    try {
        const { db } = req.body;
        if (!db) return res.status(400).json({ error: "Faltan datos en el body" });

        // Sincronizar Operarios
        await Operario.destroy({ truncate: true });
        if (db.operarios && db.operarios.length > 0) {
            await Operario.bulkCreate(db.operarios, { ignoreDuplicates: true });
        }

        // Sincronizar Clientes
        await Cliente.destroy({ truncate: true });
        if (db.clientes && db.clientes.length > 0) {
            await Cliente.bulkCreate(db.clientes, { ignoreDuplicates: true });
        }

        // Sincronizar Personal Oficial
        await PersonalOficial.destroy({ truncate: true });
        if (db.personal && db.personal.length > 0) {
            await PersonalOficial.bulkCreate(db.personal, { ignoreDuplicates: true });
        }

        // Sincronizar Proveedores
        await Proveedor.destroy({ truncate: true });
        if (db.proveedores && db.proveedores.length > 0) {
            await Proveedor.bulkCreate(db.proveedores, { ignoreDuplicates: true });
        }

        // Sincronizar Números y ART
        await NumeroArt.destroy({ truncate: true });
        if (db.numeros && db.numeros.length > 0) {
            await NumeroArt.bulkCreate(db.numeros, { ignoreDuplicates: true });
        }

        // Sincronizar Vehículos
        await Vehiculo.destroy({ truncate: true });
        if (db.vehiculos && db.vehiculos.length > 0) {
            await Vehiculo.bulkCreate(db.vehiculos, { ignoreDuplicates: true });
        }

        res.json({ success: true, message: "Datos guardados permanentemente en PostgreSQL" });
    } catch (error) {
        console.error("Error al guardar:", error);
        res.status(500).json({ error: "Error al guardar en la base de datos" });
    }
});

// Inicializar Servidor y Base de Datos
sequelize.sync().then(async () => {
    console.log("🗄️ Base de datos PostgreSQL conectada y sincronizada.");
    
    // Si la tabla de operarios está vacía, cargamos datos iniciales de prueba
    const count = await Operario.count();
    if (count === 0) {
        await Operario.create({ leg: 5, nombre: "VARGAS LEANO IRMA", cuil: "27188000000", domicilio: "Av. Córdoba 5255 CABA", ingreso: "2005-10-01", egreso: "", categoria: "Oficial" });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor en la nube activo en el puerto ${PORT}`);
    });
}).catch(err => {
    console.error("❌ No se pudo conectar a la base de datos:", err);
});
