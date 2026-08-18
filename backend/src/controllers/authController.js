const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // 1. Buscamos al usuario por su correo
    const result = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const usuario = result.rows[0];

    // 2. Verificamos la contraseña (simulada para este MVP)
    if (contrasena !== usuario.contrasena) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // 3. Generamos el Token JWT dinámico
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol }, 
      process.env.JWT_SECRET, 
      { expiresIn: '12h' }
    );

    res.status(200).json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};