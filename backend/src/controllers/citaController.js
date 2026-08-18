const db = require('../config/db');

exports.crearCita = async (req, res) => {
  const { medico_id, fecha, hora, motivo_consulta } = req.body;
  const paciente_id = req.usuario.id;

  try {
    const nuevaCita = await db.query(
      'INSERT INTO citas (paciente_id, medico_id, fecha, hora, motivo_consulta) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [paciente_id, medico_id, fecha, hora, motivo_consulta]
    );
    res.status(201).json(nuevaCita.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'El horario seleccionado ya está ocupado.' });
    res.status(500).json({ error: error.message });
  }
};
exports.obtenerCitas = async (req, res) => {
  try {
    const paciente_id = req.usuario.id;
    const citas = await db.query(
      `SELECT c.id, c.fecha, c.hora, c.motivo_consulta, c.estado, m.especialidad
       FROM citas c
       JOIN medicos m ON c.medico_id = m.usuario_id
       WHERE c.paciente_id = $1
       ORDER BY c.fecha, c.hora`,
      [paciente_id]
    );
    res.status(200).json(citas.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.cancelarCita = async (req, res) => {
  const { id } = req.params;
  const paciente_id = req.usuario.id; // Por seguridad, verificamos que el paciente cancele SU propia cita

  try {
    const result = await db.query(
      "UPDATE citas SET estado = 'cancelada' WHERE id = $1 AND paciente_id = $2 RETURNING *",
      [id, paciente_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada o no tienes permisos para cancelarla.' });
    
    res.status(200).json({ mensaje: 'Cita cancelada con éxito.', cita: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener la agenda exclusiva del médico
exports.obtenerCitasMedico = async (req, res) => {
  try {
    const medico_id = req.usuario.id; // Extraemos el ID del token del doctor
    const citas = await db.query(
      `SELECT c.id, c.fecha, c.hora, c.motivo_consulta, c.estado, c.diagnostico, u.nombre AS paciente_nombre
       FROM citas c
       JOIN usuarios u ON c.paciente_id = u.id
       WHERE c.medico_id = $1
       ORDER BY c.fecha, c.hora`,
      [medico_id]
    );
    res.status(200).json(citas.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cambiar el estado de la cita a 'atendida' y guardar el diagnóstico
exports.atenderCita = async (req, res) => {
  const { id } = req.params;
  const { diagnostico } = req.body;
  const medico_id = req.usuario.id; // Validamos que el doctor modifique su propia cita

  try {
    const result = await db.query(
      "UPDATE citas SET estado = 'atendida', diagnostico = $1 WHERE id = $2 AND medico_id = $3 RETURNING *",
      [diagnostico, id, medico_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada o no tienes permisos.' });
    
    res.status(200).json({ mensaje: 'Cita marcada como atendida exitosamente.', cita: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};