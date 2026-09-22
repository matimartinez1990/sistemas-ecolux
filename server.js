const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

let defaultDB = {
    operarios: [{ leg: 5, nombre: "VARGAS LEANO IRMA", cuil: "27188000000", domicilio: "Av. Córdoba 5255 CABA", ingreso: "2005-10-01", egreso: "", categoria: "Oficial" }],
    clientes: [{ nombre: "Acron Argentina S.R.L.", direccion: "Jerónimo Salguero 2731", mail: "victoriaf@acron.com", facturacion: "CUIT: 30-71605168-0" }],
    personal: [{ nombre: "AROMANDO RICARDO", celular: "11 4435-5616", modelo: "Samsung", cuil: "20-14951646-9" }],
    proveedores: [{ nombre: "A.R.B.A.", detalle: "General: 0800-321-2722" }],
    numeros: [{ concepto: "A.R.T. Provincia", numero: "N° Contrato 144206 - Usuario: ecolux@ecolux.com.ar" }],
    vehiculos: [{ vehiculo: "Peugeot Partner", patente: "AA499IC", dueno: "Ecolux", chasis: "8AEGR9HJCHG513828", motor: "10JBED0059154", seguro: "San Cristobal", vtoVtv: "2026-09-30" }]
};

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultDB, null, 2));
}

app.get('/api/data', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE));
        res.json(data);
    } catch(e) {
        res.json(defaultDB);
    }
});

app.post('/api/data', (req, res) => {
    const newData = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
    res.json({ success: true, message: "Datos actualizados en la nube" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en la nube activo en el puerto ${PORT}`);
});