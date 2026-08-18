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
exports.registrarMedico = async (req, res) => {
  const { nombre, correo, contrasena, cedula_profesional, especialidad } = req.body;
  
  // Seguridad extra: Validamos que quien hace la petición sea el Root
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Solo el administrador puede registrar médicos.' });
  }

  try {
    // 1. Insertamos al médico en la tabla de usuarios
    const userResult = await db.query(
      "INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, 'medico') RETURNING id",
      [nombre, correo, contrasena]
    );
    const nuevoMedicoId = userResult.rows[0].id;

    // 2. Guardamos sus datos profesionales en la tabla de médicos
    await db.query(
      "INSERT INTO medicos (usuario_id, cedula_profesional, especialidad) VALUES ($1, $2, $3)",
      [nuevoMedicoId, cedula_profesional, especialidad]
    );

    res.status(201).json({ mensaje: 'Profesional médico registrado con éxito en el sistema.' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'El correo o la cédula ya están registrados.' });
    res.status(500).json({ error: error.message });
  }
};
// Obtener todos los médicos registrados
exports.obtenerDirectorioMedicos = async (req, res) => {
  if (req.usuario.rol !== 'administrador') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    // CORRECCIÓN: Usamos u.id en lugar de m.id para evitar errores de columnas inexistentes
    const medicos = await db.query(
      `SELECT u.id, m.cedula_profesional, m.especialidad, u.nombre, u.correo 
       FROM medicos m 
       JOIN usuarios u ON m.usuario_id = u.id`
    );
    res.status(200).json(medicos.rows);
  } catch (error) {
    // Imprimimos el error exacto en la consola de Docker para un diagnóstico rápido
    console.error("🔴 Error SQL en directorio de médicos:", error.message);
    res.status(500).json({ error: error.message });
  }
};
// Obtener todos los pacientes (usuarios con rol 'paciente')
exports.obtenerDirectorioPacientes = async (req, res) => {
  if (req.usuario.rol !== 'administrador') return res.status(403).json({ error: 'Acceso denegado.' });
  try {
    const pacientes = await db.query(
      "SELECT id, nombre, correo FROM usuarios WHERE rol = 'paciente'"
    );
    res.status(200).json(pacientes.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};