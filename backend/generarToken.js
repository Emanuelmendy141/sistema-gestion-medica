const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '11111111-1111-1111-1111-111111111111', rol: 'paciente' },
  'ClaveSecretaSuperSeguraTFM2026',
  { expiresIn: '365d' }
);

console.log("\n--- COPIA EL TOKEN DE ABAJO ---\n");
console.log(token);
console.log("\n-------------------------------\n");