// Archivo: server.js
// Descripción: Backend local para recibir datos de un formulario React
//              y enviarlos de forma segura a la API de Airtable.

// Carga las variables de entorno del archivo .env al process.env
// ¡Debe estar en la PRIMERA línea!
require('dotenv').config();

const express = require('express');
// No necesitamos 'node-fetch' porque Node v24+ ya lo incluye
const cors = require('cors'); // Para permitir peticiones desde tu frontend local
const app = express();

// --- Configuración de Middlewares ---

// 1. Habilita CORS (Cross-Origin Resource Sharing)
app.use(cors({
  // Esta debe ser la URL exacta donde corre tu app de React
  origin: 'https://sumadots-frontend-website-eimnykyv5q-ew.a.run.app/' 
}));

// 2. Habilita que Express pueda "leer" JSON del body de las peticiones
app.use(express.json());

// --- Lectura de Variables de Entorno ---
// Lee las variables que configuraste en tu archivo .env
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID; 

// --- El Endpoint (Punto de Conexión) ---
app.post('/api/submit-form', async (req, res) => {
  
  // Log 1: Verifica que la petición llegó al backend
  console.log('Petición recibida en /api/submit-form. Body:', req.body);

  const data = req.body;

  // 1. Validación de Seguridad: Verifica que las variables del servidor estén cargadas
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Error: Faltan variables de entorno de Airtable (API_KEY, BASE_ID o TABLE_ID)');
    return res.status(500).json({ message: 'Error de configuración del servidor' });
  }

  // 2. Formateo de Datos: Prepara el objeto para la API de Airtable
  //    (AJUSTADO CON LOS NUEVOS CAMPOS DE SEGUIMIENTO)
  const airtableData = {
    "records": [
      {
        "fields": {
          // --- Datos que vienen del formulario ---
          // (Asegúrate de que estos nombres coincidan con tus columnas de Airtable)
          "email": data.email,
          "phone": data.phone,
          "services": data.servicio,
          "description": data.proyecto,
          "industry": data.rubro,
          "digital maturity": data['digital-level'],
          
          // --- ¡CAMPOS DE SEGUIMIENTO AÑADIDOS! ---
          
          // 1. El nombre fijo (hardcodeado)
          //    (Tu columna en Airtable debe llamarse "lead_source")
          "lead source": "Formulario Web Sumadots", 
          
          // 2. La URL que viene desde React (en data.source_url)
          //    (Tu columna en Airtable debe llamarse "source_url")
          "source url": data.source_url 
        }
      }
    ]
  };

  try {
    // 3. Llamada a la API de Airtable
    const airtableRes = await fetch(
      // Usamos el ID de la tabla desde el .env
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_ID)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableData),
      }
    );

    // 4. Manejo de Errores de Airtable
    if (!airtableRes.ok) {
      const errorBody = await airtableRes.json();
      console.error('Error de Airtable:', errorBody);
      // El error 'UNKNOWN_FIELD_NAME' (422) ocurrirá aquí si los nombres no coinciden
      throw new Error(`Error ${airtableRes.status} de Airtable. Revisa los nombres de los campos.`);
    }

    // 5. Éxito
    console.log('Datos guardados en Airtable con éxito.');
    res.status(200).json({ message: 'Datos guardados exitosamente' });

  } catch (error) {
    // 6. Manejo de Error General
    console.error('Error en el endpoint /api/submit-form:', error.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor de formularios (local) escuchando en http://localhost:${PORT}`);
});