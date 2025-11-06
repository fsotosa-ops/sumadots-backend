// Archivo: server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const app = express();

// --- Configuración de Middlewares ---

// --- ¡SECCIÓN MODIFICADA PARA PERMITIR LOCALHOST! ---
const allowedOrigins = [
  'https://sumadots-frontend-website-eimnykyv5q-ew.a.run.app', // Tu frontend en producción
  'http://localhost:5173', // Tu frontend local de Vite
  'http://localhost:3000'  // Otro puerto de desarrollo común
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite peticiones si están en la lista (o si no tienen origen, como Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  }
}));
// --- FIN DE LA SECCIÓN MODIFICADA ---

app.use(express.json());

// --- Lectura de Variables de Entorno (¡ESTO USA LAS DE CLOUD RUN!) ---
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID; 

// --- El Endpoint ---
app.post('/api/submit-form', async (req, res) => {
  
  console.log('Petición recibida en /api/submit-form. Body:', req.body);
  const data = req.body;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    console.error('Error: Faltan variables de entorno de Airtable (API_KEY, BASE_ID o TABLE_ID)');
    return res.status(500).json({ message: 'Error de configuración del servidor' });
  }

  const airtableData = {
    "records": [
      {
        "fields": {
          "email": data.email,
          "phone": data.phone,
          "services": data.servicio,
          "description": data.proyecto,
          "industry": data.rubro,
          "digital maturity": data['digital-level'],
          "lead source": "Formulario Web Sumadots", 
          "source url": data.source_url 
        }
      }
    ]
  };

  try {
    const airtableRes = await fetch(
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

    if (!airtableRes.ok) {
      const errorBody = await airtableRes.json();
      console.error('Error de Airtable:', errorBody);
      throw new Error(`Error ${airtableRes.status} de Airtable. Revisa los nombres de los campos.`);
    }

    console.log('Datos guardados en Airtable con éxito.');
    res.status(200).json({ message: 'Datos guardados exitosamente' });

  } catch (error) {
    console.error('Error en el endpoint /api/submit-form:', error.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor de formularios escuchando en el puerto ${PORT}`);
});