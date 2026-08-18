import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [rol, setRol] = useState(localStorage.getItem('rol') || null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const [medicoId, setMedicoId] = useState('22222222-2222-2222-2222-222222222222');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [citas, setCitas] = useState([]);

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
    setMensaje({ texto: '', tipo: '' });
  };

  const cargarCitas = async () => {
    if (!token) return;
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
        setMensaje({ texto: 'Cita cancelada correctamente', tipo: 'exito' });
        cargarCitas();
      }
    } catch (error) {
      setMensaje({ texto: 'Error al cancelar', tipo: 'error' });
    }
  };

  const atenderCita = async (citaId) => {
    const diagnostico = window.prompt("Ingrese el diagnóstico u observaciones de la consulta:");
    if (!diagnostico) return; 

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

  return (
    <div className="app-layout">
      {/* 1. BARRA DE NAVEGACIÓN FIJA */}
      <nav className="navbar">
        <h2>
          {!token ? 'Clínica Médica Digital' : (rol === 'medico' ? 'Panel Médico' : 'Portal del Paciente')}
        </h2>
        {token && <button onClick={handleLogout} className="btn btn-danger">Cerrar Sesión</button>}
      </nav>

      {/* 2. CONTENEDOR CENTRALIZADO */}
      <div className="main-wrapper">
        
        {!token ? (
          /* --- VISTA LOGIN / REGISTRO --- */
          <div className="login-container">
            <div className="card">
              <h2 className="card-title" style={{textAlign: 'center', border: 'none'}}>
                {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </h2>
              
              {mensaje.texto && (
                <div className={`alert ${mensaje.tipo === 'error' ? 'alert-error' : 'alert-success'}`}>
                  {mensaje.texto}
                </div>
              )}
              
              <form onSubmit={handleAuth}>
                {isRegistering && (
                  <div className="form-group">
                    <input type="text" className="form-control" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required />
                  </div>
                )}
                <div className="form-group">
                  <input type="email" className="form-control" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} required />
                </div>
                <div className="form-group">
                  <input type="password" className="form-control" placeholder="Contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} required />
                </div>
                <button type="submit" className={`btn ${isRegistering ? 'btn-primary' : 'btn-success'}`}>
                  {isRegistering ? 'Registrarme' : 'Entrar al Sistema'}
                </button>
              </form>
              
              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
                {isRegistering ? '¿Ya tienes cuenta? ' : '¿Eres nuevo paciente? '}
                <button type="button" className="btn btn-link" onClick={() => {setIsRegistering(!isRegistering); setMensaje({texto:'', tipo:''});}}>
                  {isRegistering ? 'Inicia sesión aquí' : 'Regístrate aquí'}
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* --- VISTA DASHBOARD (MÉDICO O PACIENTE) --- */
          <div className="container">
            {mensaje.texto && (
              <div className={`alert ${mensaje.tipo === 'error' ? 'alert-error' : 'alert-success'}`}>
                {mensaje.texto}
              </div>
            )}
            
            {rol === 'paciente' && (
              <div className="card">
                <h3 className="card-title">Agendar Nueva Cita</h3>
                <form onSubmit={reservarCita}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{fontSize: '14px', color: '#64748b', fontWeight: '600'}}>Fecha</label>
                      <input type="date" className="form-control" value={fecha} onChange={e => setFecha(e.target.value)} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{fontSize: '14px', color: '#64748b', fontWeight: '600'}}>Hora</label>
                      <input type="time" className="form-control" value={hora} onChange={e => setHora(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{fontSize: '14px', color: '#64748b', fontWeight: '600'}}>Motivo de Consulta</label>
                    <textarea className="form-control" placeholder="Describe brevemente tus síntomas..." value={motivo} onChange={e => setMotivo(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary">Confirmar Reservación</button>
                </form>
              </div>
            )}

            <div className="card">
              <h3 className="card-title">{rol === 'medico' ? 'Agenda del Día' : 'Historial de Citas'}</h3>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>{rol === 'medico' ? 'Paciente' : 'Motivo'}</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citas.map(cita => (
                      <tr key={cita.id}>
                        <td><strong>{new Date(cita.fecha).toLocaleDateString()}</strong></td>
                        <td>{cita.hora}</td>
                        <td>{rol === 'medico' ? cita.paciente_nombre : cita.motivo_consulta}</td>
                        <td>
                          <span className={`badge badge-${cita.estado.toLowerCase()}`}>
                            {cita.estado}
                          </span>
                        </td>
                        <td>
                          {rol === 'paciente' && cita.estado === 'programada' && (
                            <button onClick={() => cancelarCita(cita.id)} className="btn btn-warning" style={{fontSize: '12px', padding: '6px 12px'}}>Cancelar</button>
                          )}
                          {rol === 'medico' && cita.estado === 'programada' && (
                            <button onClick={() => atenderCita(cita.id)} className="btn btn-info" style={{fontSize: '12px', padding: '6px 12px'}}>Atender</button>
                          )}
                          {cita.estado !== 'programada' && (
                            <span style={{fontSize: '12px', color: '#94a3b8'}}>Sin acciones</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {citas.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{textAlign: 'center', color: '#64748b', padding: '30px'}}>
                          No hay citas registradas en este momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}