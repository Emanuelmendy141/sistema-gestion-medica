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