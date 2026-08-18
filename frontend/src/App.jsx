import React, { useState, useEffect } from 'react';

export default function App() {
  // Estados para el Login
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // Estados para la Agenda
  const [medicoId, setMedicoId] = useState('22222222-2222-2222-2222-222222222222');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [citas, setCitas] = useState([]);

  // --- LÓGICA DE AUTENTICACIÓN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });
      const data = await response.json();
      
      if (data.error) {
        setErrorLogin(data.error);
      } else {
        setToken(data.token);
        localStorage.setItem('token', data.token); // Guardamos el token en el navegador
        setErrorLogin('');
      }
    } catch (error) {
      setErrorLogin('Error al conectar con el servidor');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  // --- LÓGICA DE LA AGENDA ---
  const cargarCitas = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/api/citas', {
        headers: { 'Authorization': `Bearer ${token}` } // Usamos el token real
      });
      const data = await response.json();
      if (!data.error) setCitas(data);
    } catch (error) {
      console.error("Error al cargar citas");
    }
  };

  useEffect(() => {
    cargarCitas();
  }, [token]);

  const reservarCita = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ medico_id: medicoId, fecha, hora, motivo_consulta: motivo })
      });
      const data = await response.json();
      if (data.error) {
         setMensaje({ texto: data.error, tipo: 'error' });
      } else {
         setMensaje({ texto: '¡Cita agendada con éxito!', tipo: 'exito' });
         cargarCitas();
         setFecha(''); setHora(''); setMotivo('');
      }
    } catch (error) {
      setMensaje({ texto: 'Error al conectar con el servidor', tipo: 'error' });
    }
  };

  // --- VISTA 1: PANTALLA DE LOGIN ---
  if (!token) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center' }}>Iniciar Sesión</h2>
        {errorLogin && <div style={{ background: '#f8d7da', padding: '10px', borderRadius: '5px', marginBottom: '15px', color: '#721c24' }}>{errorLogin}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} required style={{ padding: '10px' }} />
          <input type="password" placeholder="Contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} required style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '12px', background: '#198754', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>Entrar</button>
        </form>
        <p style={{ fontSize: '12px', marginTop: '20px', color: '#666' }}>
          *Usa el usuario de prueba:<br/>
          <b>Correo:</b> paciente@test.com<br/>
          <b>Clave:</b> hash_simulado
        </p>
      </div>
    );
  }

  // --- VISTA 2: PANTALLA DEL DASHBOARD ---
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Agenda Médica Digital</h2>
        <button onClick={handleLogout} style={{ padding: '8px 12px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>Cerrar Sesión</button>
      </div>
      
      {mensaje.texto && (
        <div style={{ background: mensaje.tipo === 'error' ? '#f8d7da' : '#d1e7dd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          {mensaje.texto}
        </div>
      )}
      
      <form onSubmit={reservarCita} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required style={{ padding: '10px' }} />
        <input type="time" value={hora} onChange={e => setHora(e.target.value)} required style={{ padding: '10px' }} />
        <textarea placeholder="Motivo de Consulta" value={motivo} onChange={e => setMotivo(e.target.value)} style={{ padding: '10px', height: '80px' }} required />
        <button type="submit" style={{ padding: '12px', background: '#0d6efd', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>Reservar Cita</button>
      </form>

      <h3>Mis Citas Agendadas</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#e9ecef', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Fecha</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Hora</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Motivo</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {citas.map(cita => (
            <tr key={cita.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{new Date(cita.fecha).toLocaleDateString()}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{cita.hora}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{cita.motivo_consulta}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                <span style={{ background: '#d1e7dd', padding: '5px 10px', borderRadius: '15px', fontSize: '12px' }}>{cita.estado}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}