import React, { useState } from 'react';

export default function App() {
  const [medicoId, setMedicoId] = useState('22222222-2222-2222-2222-222222222222');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Token simulado para desarrollo
  const tokenPrueba = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiUGFjaWVudGUgVGVzdCIsImlkIjoiMTExMTExMTEtMTExMS0xMTExLTExMTEtMTExMTExMTExMTExIiwicm9sIjoicGFjaWVudGUiLCJpYXQiOjE3MTY0MDAwMDB9.TuClaveGeneradaAqui";

  const reservarCita = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenPrueba}` },
        body: JSON.stringify({ medico_id: medicoId, fecha, hora, motivo_consulta: motivo })
      });
      const data = await response.json();
      if (data.error) setMensaje({ texto: data.error, tipo: 'error' });
      else setMensaje({ texto: '¡Cita médica agendada con éxito!', tipo: 'exito' });
    } catch (error) {
      setMensaje({ texto: 'Error al conectar con el servidor', tipo: 'error' });
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Agenda Médica Digital</h2>
      {mensaje.texto && (
        <div style={{ background: mensaje.tipo === 'error' ? '#f8d7da' : '#d1e7dd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          {mensaje.texto}
        </div>
      )}
      <form onSubmit={reservarCita} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required style={{ padding: '10px' }} />
        <input type="time" value={hora} onChange={e => setHora(e.target.value)} required style={{ padding: '10px' }} />
        <textarea placeholder="Motivo de Consulta" value={motivo} onChange={e => setMotivo(e.target.value)} style={{ padding: '10px', height: '80px' }} required />
        <button type="submit" style={{ padding: '12px', background: '#0d6efd', color: '#fff', border: 'none', cursor: 'pointer' }}>Reservar Cita</button>
      </form>
    </div>
  );
}
