const express = require('express');
const cors = require('cors');
const citaController = require('./controllers/citaController');
const authMiddleware = require('./middlewares/authMiddleware');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/citas', authMiddleware, citaController.crearCita);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));