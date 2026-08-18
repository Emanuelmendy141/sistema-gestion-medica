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

# Exponer el puerto del servidor
EXPOSE 5000

# Comando para encender el backend
CMD ["node", "src/app.js"]