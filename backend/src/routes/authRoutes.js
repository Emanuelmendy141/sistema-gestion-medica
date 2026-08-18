const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); // Importamos el cerrojo de seguridad

router.post('/login', authController.login);
router.post('/register', authController.registrar);
// Ruta protegida: Solo pasa si tiene un token válido
router.post('/register-medico', authMiddleware, authController.registrarMedico);
router.get('/medicos', authMiddleware, authController.obtenerDirectorioMedicos);
router.get('/pacientes', authMiddleware, authController.obtenerDirectorioPacientes);

module.exports = router;