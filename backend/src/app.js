const express = require('express');
const cors = require('cors');
const citaController = require('./controllers/citaController');
const authMiddleware = require('./middlewares/authMiddleware');
const authRoutes = require('./routes/authRoutes'); // <-- 1. Agrega esta línea
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); // <-- 2. Agrega esta línea

app.post('/api/citas', authMiddleware, citaController.crearCita);
app.get('/api/citas', authMiddleware, citaController.obtenerCitas);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));