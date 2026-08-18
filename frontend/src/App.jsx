import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [rol, setRol] = useState(localStorage.getItem('rol') || null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Estados Generales
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  // Estados de Agenda
  const [medicoId, setMedicoId] = useState('22222222-2222-2222-2222-222222222222');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [citas, setCitas] = useState([]);

  // Estados del Administrador (Nuevos)
  const [cedula, setCedula] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  // Estados para las Tablas del Administrador
  const [listaMedicos, setListaMedicos] = useState([]);
  const [listaPacientes, setListaPacientes] = useState([]);

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
    setToken(null); setRol(null); setCitas([]);
    localStorage.removeItem('token'); localStorage.removeItem('rol');
    setMensaje({ texto: '', tipo: '' });
  };

  // --- LÓGICA DE ADMINISTRADOR ---
  const registrarNuevoMedico = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register-medico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, correo, contrasena, cedula_profesional: cedula, especialidad })
      });
      const data = await response.json();
      if (data.error) setMensaje({ texto: data.error, tipo: 'error' });
      else {
        setMensaje({ texto: data.mensaje, tipo: 'exito' });
        setNombre(''); setCorreo(''); setContrasena(''); setCedula(''); setEspecialidad('');
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión', tipo: 'error' });
    }
  };

  // --- LÓGICA DE CITAS ---
  // --- LÓGICA DE CARGA DE DATOS ---
  const cargarCitas = async () => {
    if (!token || rol === 'administrador') return;
    const url = rol === 'medico' ? 'http://localhost:5000/api/citas/medico' : 'http://localhost:5000/api/citas';
    try {
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!data.error) setCitas(data);
    } catch (error) { console.error("Error al cargar citas"); }
  };

  const cargarDatosAdmin = async () => {
    if (!token || rol !== 'administrador') return;
    try {
      // CORRECCIÓN: Se agregó "/auth" a la ruta de médicos
      const resMedicos = await fetch('http://localhost:5000/api/auth/medicos', { headers: { 'Authorization': `Bearer ${token}` } });
      const dataMedicos = await resMedicos.json();
      if (!dataMedicos.error) setListaMedicos(dataMedicos);

      // CORRECCIÓN: Se agregó "/auth" a la ruta de pacientes
      const resPacientes = await fetch('http://localhost:5000/api/auth/pacientes', { headers: { 'Authorization': `Bearer ${token}` } });
      const dataPacientes = await resPacientes.json();
      if (!dataPacientes.error) setListaPacientes(dataPacientes);
    } catch (error) { console.error("Error al cargar directorios"); }
  };

  useEffect(() => { 
    cargarCitas(); 
    if (rol === 'administrador') cargarDatosAdmin();
  }, [token, rol]);

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
         cargarCitas(); setFecha(''); setHora(''); setMotivo('');
      }
    } catch (error) { setMensaje({ texto: 'Error de conexión', tipo: 'error' }); }
  };

  const cancelarCita = async (citaId) => {
    if (!window.confirm("¿Deseas cancelar esta cita?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/citas/${citaId}/cancelar`, {
        method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.error) { setMensaje({ texto: 'Cita cancelada correctamente', tipo: 'exito' }); cargarCitas(); }
    } catch (error) { setMensaje({ texto: 'Error al cancelar', tipo: 'error' }); }
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
      if (!data.error) { setMensaje({ texto: 'Cita completada', tipo: 'exito' }); cargarCitas(); }
    } catch (error) { setMensaje({ texto: 'Error al guardar', tipo: 'error' }); }
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <h2>
          {!token ? 'Clínica Médica Digital' : 
           rol === 'administrador' ? 'Centro de Administración' : 
           rol === 'medico' ? 'Panel Médico' : 'Portal del Paciente'}
        </h2>
        {token && <button onClick={handleLogout} className="btn btn-danger">Cerrar Sesión</button>}
      </nav>

      <div className="main-wrapper">
        
        {!token ? (
          <div className="login-container">
            <div className="card">
              <h2 className="card-title" style={{textAlign: 'center', border: 'none'}}>
                {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </h2>
              {mensaje.texto && <div className={`alert ${mensaje.tipo === 'error' ? 'alert-error' : 'alert-success'}`}>{mensaje.texto}</div>}
              <form onSubmit={handleAuth}>
                {isRegistering && (
                  <div className="form-group"><input type="text" className="form-control" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
                )}
                <div className="form-group"><input type="email" className="form-control" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} required /></div>
                <div className="form-group"><input type="password" className="form-control" placeholder="Contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} required /></div>
                <button type="submit" className={`btn ${isRegistering ? 'btn-primary' : 'btn-success'}`}>{isRegistering ? 'Registrarme' : 'Entrar al Sistema'}</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
                <button type="button" className="btn btn-link" onClick={() => {setIsRegistering(!isRegistering); setMensaje({texto:'', tipo:''});}}>
                  {isRegistering ? 'Inicia sesión aquí' : 'Regístrate aquí'}
                </button>
              </p>
              <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '10px', color: '#94a3b8' }}>
                *Admin: admin@test.com / hash_simulado
              </p>
            </div>
          </div>
        ) : (
          <div className="container">
            {mensaje.texto && <div className={`alert ${mensaje.tipo === 'error' ? 'alert-error' : 'alert-success'}`}>{mensaje.texto}</div>}
            
            {/* VISTA DEL ADMINISTRADOR */}
            {rol === 'administrador' && (
              <>
                <div className="card">
                  <h3 className="card-title">Dar de Alta a Nuevo Médico</h3>
                  <form onSubmit={registrarNuevoMedico}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}><input type="text" className="form-control" placeholder="Nombre del Doctor" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
                      <div style={{ flex: 1 }}><input type="email" className="form-control" placeholder="Correo de acceso" value={correo} onChange={e => setCorreo(e.target.value)} required /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}><input type="text" className="form-control" placeholder="Cédula Profesional" value={cedula} onChange={e => setCedula(e.target.value)} required /></div>
                      <div style={{ flex: 1 }}><input type="text" className="form-control" placeholder="Especialidad" value={especialidad} onChange={e => setEspecialidad(e.target.value)} required /></div>
                    </div>
                    <div className="form-group"><input type="password" className="form-control" placeholder="Contraseña Temporal" value={contrasena} onChange={e => setContrasena(e.target.value)} required /></div>
                    <button type="submit" className="btn btn-primary">Registrar Médico en el Sistema</button>
                  </form>
                </div>

                {/* NUEVO: Tabla de Directorio Médico */}
                <div className="card">
                  <h3 className="card-title">Directorio Médico Activo</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nombre del Médico</th><th>Cédula</th><th>Especialidad</th><th>Correo (Acceso)</th><th>Gestión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listaMedicos.map(med => (
                          <tr key={med.id}>
                            <td><strong>{med.nombre}</strong></td>
                            <td>{med.cedula_profesional}</td>
                            <td>{med.especialidad}</td>
                            <td>{med.correo}</td>
                            <td style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => alert("Función 'Editar' programada para la Fase 2.")} className="btn btn-info" style={{fontSize: '11px', padding: '4px 8px'}}>Editar</button>
                              <button onClick={() => alert("Función 'Dar de baja' programada para la Fase 2.")} className="btn btn-danger" style={{fontSize: '11px', padding: '4px 8px'}}>Borrar</button>
                            </td>
                          </tr>
                        ))}
                        {listaMedicos.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', color: '#64748b', padding: '20px'}}>No hay médicos registrados.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NUEVO: Tabla de Pacientes */}
                <div className="card">
                  <h3 className="card-title">Registro de Pacientes</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nombre del Paciente</th><th>Correo Electrónico</th><th>Gestión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listaPacientes.map(pac => (
                          <tr key={pac.id}>
                            <td><strong>{pac.nombre}</strong></td>
                            <td>{pac.correo}</td>
                            <td style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => alert("Función 'Editar' programada para la Fase 2.")} className="btn btn-info" style={{fontSize: '11px', padding: '4px 8px'}}>Editar</button>
                              <button onClick={() => alert("Función 'Dar de baja' programada para la Fase 2.")} className="btn btn-danger" style={{fontSize: '11px', padding: '4px 8px'}}>Borrar</button>
                            </td>
                          </tr>
                        ))}
                        {listaPacientes.length === 0 && <tr><td colSpan="3" style={{textAlign: 'center', color: '#64748b', padding: '20px'}}>No hay pacientes registrados.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* VISTA DEL PACIENTE */}
            {rol === 'paciente' && (
              <div className="card">
                <h3 className="card-title">Agendar Nueva Cita</h3>
                <form onSubmit={reservarCita}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}><label style={{fontSize: '14px', color: '#64748b', fontWeight: '600'}}>Fecha</label><input type="date" className="form-control" value={fecha} onChange={e => setFecha(e.target.value)} required /></div>
                    <div style={{ flex: 1 }}><label style={{fontSize: '14px', color: '#64748b', fontWeight: '600'}}>Hora</label><input type="time" className="form-control" value={hora} onChange={e => setHora(e.target.value)} required /></div>
                  </div>
                  <div className="form-group"><label style={{fontSize: '14px', color: '#64748b', fontWeight: '600'}}>Motivo de Consulta</label><textarea className="form-control" placeholder="Describe brevemente tus síntomas..." value={motivo} onChange={e => setMotivo(e.target.value)} required /></div>
                  <button type="submit" className="btn btn-primary">Confirmar Reservación</button>
                </form>
              </div>
            )}

            {/* TABLA DE CITAS (SOLO MÉDICO Y PACIENTE) */}
            {rol !== 'administrador' && (
              <div className="card">
                <h3 className="card-title">{rol === 'medico' ? 'Agenda del Día' : 'Historial de Citas'}</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th><th>Hora</th><th>{rol === 'medico' ? 'Paciente' : 'Motivo'}</th><th>Estado</th><th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citas.map(cita => (
                        <tr key={cita.id}>
                          <td><strong>{new Date(cita.fecha).toLocaleDateString()}</strong></td>
                          <td>{cita.hora}</td>
                          <td>{rol === 'medico' ? cita.paciente_nombre : cita.motivo_consulta}</td>
                          <td><span className={`badge badge-${cita.estado.toLowerCase()}`}>{cita.estado}</span></td>
                          <td>
                            {rol === 'paciente' && cita.estado === 'programada' && (<button onClick={() => cancelarCita(cita.id)} className="btn btn-warning" style={{fontSize: '12px', padding: '6px 12px'}}>Cancelar</button>)}
                            {rol === 'medico' && cita.estado === 'programada' && (<button onClick={() => atenderCita(cita.id)} className="btn btn-info" style={{fontSize: '12px', padding: '6px 12px'}}>Atender</button>)}
                            {cita.estado !== 'programada' && (<span style={{fontSize: '12px', color: '#94a3b8'}}>Sin acciones</span>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}