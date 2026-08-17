const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token de seguridad.' });

  try {
    const verificado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};