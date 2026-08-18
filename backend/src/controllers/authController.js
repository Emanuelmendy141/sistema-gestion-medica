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
exports.registrar = async (req, res) => {
  const { nombre, correo, contrasena } = req.body;
  try {
    // Insertamos al usuario forzando el rol de 'paciente'
    const result = await db.query(
      "INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, 'paciente') RETURNING id, nombre, correo, rol",
      [nombre, correo, contrasena]
    );
    res.status(201).json({ mensaje: 'Usuario registrado con éxito. Ya puedes iniciar sesión.', usuario: result.rows[0] });
  } catch (error) {
    // Código 23505 significa "Violación de índice único" (correo duplicado)
    if (error.code === '23505') return res.status(409).json({ error: 'Este correo electrónico ya está registrado.' });
    res.status(500).json({ error: error.message });
  }
};