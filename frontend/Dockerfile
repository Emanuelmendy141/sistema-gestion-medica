# Usar una imagen ligera de Node.js
FROM node:18-alpine

# Definir el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Comando para encender el frontend exponiendo el host a la red de Docker
CMD ["npm", "run", "dev", "--", "--host"]