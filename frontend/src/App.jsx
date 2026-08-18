import React, { useState, useEffect } from 'react';

export default function App() {
  // Estados Generales
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [rol, setRol] = useState(localStorage.getItem('rol') || null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Estados de Login / Registro
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  // Estados de Agenda (Paciente)
  const [medicoId, setMedicoId] = useState('22222222-2222-2222-2222-222222222222');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [citas, setCitas] = useState([]);

  // --- LÓGICA DE AUTENTICACIÓN ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const url = isRegistering ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/login';
    const body = isRegistering ? { nombre, correo, contrasena } : { correo, contrasena };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      
      if (data.error) {
        setMensaje({ texto: data.error, tipo: 'error' });
      } else {
        if (isRegistering) {
          setMensaje({ texto: data.mensaje, tipo: 'exito' });
          setIsRegistering(false);
        } else {
          // Guardamos token y rol en memoria
          setToken(data.token);
          setRol(data.usuario.rol);
          localStorage.setItem('token', data.token);
          localStorage.setItem('rol', data.usuario.rol);
          setMensaje({ texto: '', tipo: '' });
        }
      }
    } catch (error) {
      setMensaje({ texto: 'Error al conectar con el servidor', tipo: 'error' });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRol(null);
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    setCitas([]);
  };

  // --- LÓGICA DE CITAS ---
  const cargarCitas = async () => {
    if (!token) return;
    // El servidor usará una ruta distinta dependiendo de quién consulte
    const url = rol === 'medico' ? 'http://localhost:5000/api/citas/medico' : 'http://localhost:5000/api/citas';
    try {
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!data.error) setCitas(data);
    } catch (error) {
      console.error("Error al cargar citas");
    }
  };

  useEffect(() => { cargarCitas(); }, [token, rol]);

  const reservarCita = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ medico_id: medicoId, fecha, hora, motivo_consulta: motivo })
      });
      const data = await response.json();
      if (data.error) setMensaje({ texto: data.error, tipo: 'error' });
      else {
         setMensaje({ texto: '¡Cita agendada con éxito!', tipo: 'exito' });
         cargarCitas();
         setFecha(''); setHora(''); setMotivo('');
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión', tipo: 'error' });
    }
  };

  const cancelarCita = async (citaId) => {
    if (!window.confirm("¿Deseas cancelar esta cita?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/citas/${citaId}/cancelar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.error) {
        setMensaje({ texto: 'Cita cancelada', tipo: 'exito' });
        cargarCitas();
      }
    } catch (error) {
      setMensaje({ texto: 'Error al cancelar', tipo: 'error' });
    }
  };

  const atenderCita = async (citaId) => {
    const diagnostico = window.prompt("Ingrese el diagnóstico u observaciones de la consulta:");
    if (!diagnostico) return; // Si cancela el recuadro, no hacemos nada

    try {
      const response = await fetch(`http://localhost:5000/api/citas/${citaId}/atender`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ diagnostico })
      });
      const data = await response.json();
      if (!data.error) {
        setMensaje({ texto: 'Cita completada y guardada en el historial', tipo: 'exito' });
        cargarCitas();
      }
    } catch (error) {
      setMensaje({ texto: 'Error al guardar el diagnóstico', tipo: 'error' });
    }
  };

  // --- VISTA 1: LOGIN / REGISTRO ---
  if (!token) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center' }}>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        {mensaje.texto && <div style={{ background: mensaje.tipo === 'error' ? '#f8d7da' : '#d1e7dd', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{mensaje.texto}</div>}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isRegistering && <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required style={{ padding: '10px' }} />}
          <input type="email" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} required style={{ padding: '10px' }} />
          <input type="password" placeholder="Contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} required style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '12px', background: isRegistering ? '#0d6efd' : '#198754', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
            {isRegistering ? 'Registrarme' : 'Entrar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <span style={{ color: '#0d6efd', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Ya tengo cuenta (Iniciar sesión)' : 'Soy nuevo paciente (Registrarme)'}
          </span>
        </p>
        <p style={{ fontSize: '12px', marginTop: '20px', color: '#666' }}>
          *Probar como médico:<br/><b>doctor@test.com</b> / <b>hash_simulado</b>
        </p>
      </div>
    );
  }

  // --- VISTA 2: DASHBOARD (MÉDICO O PACIENTE) ---
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{rol === 'medico' ? 'Panel de Control Médico' : 'Agenda Médica Digital'}</h2>
        <button onClick={handleLogout} style={{ padding: '8px 12px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>Cerrar Sesión</button>
      </div>
      
      {mensaje.texto && <div style={{ background: mensaje.tipo === 'error' ? '#f8d7da' : '#d1e7dd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>{mensaje.texto}</div>}
      
      {/* Solo los pacientes ven el formulario para reservar */}
      {rol === 'paciente' && (
        <form onSubmit={reservarCita} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required style={{ padding: '10px' }} />
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} required style={{ padding: '10px' }} />
          <textarea placeholder="Motivo de Consulta" value={motivo} onChange={e => setMotivo(e.target.value)} style={{ padding: '10px', height: '80px' }} required />
          <button type="submit" style={{ padding: '12px', background: '#0d6efd', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>Reservar Cita</button>
        </form>
      )}

      <h3>{rol === 'medico' ? 'Mi Agenda de Consultas' : 'Mis Citas Agendadas'}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#e9ecef', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Fecha</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Hora</th>
            {/* Cambiamos la columna dependiendo del rol */}
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>{rol === 'medico' ? 'Paciente' : 'Motivo'}</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Estado</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {citas.map(cita => (
            <tr key={cita.id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{new Date(cita.fecha).toLocaleDateString()}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{cita.hora}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{rol === 'medico' ? cita.paciente_nombre : cita.motivo_consulta}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                <span style={{ background: cita.estado === 'cancelada' ? '#f8d7da' : cita.estado === 'atendida' ? '#cff4fc' : '#d1e7dd', padding: '5px 10px', borderRadius: '15px', fontSize: '12px' }}>
                  {cita.estado.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', display: 'flex', gap: '5px' }}>
                {rol === 'paciente' && cita.estado === 'programada' && (
                  <button onClick={() => cancelarCita(cita.id)} style={{ padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
                )}
                {rol === 'medico' && cita.estado === 'programada' && (
                  <button onClick={() => atenderCita(cita.id)} style={{ padding: '5px 10px', background: '#0dcaf0', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>Atender Paciente</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}