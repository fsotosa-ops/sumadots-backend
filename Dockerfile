# Usamos una imagen oficial de Node.js
FROM node:20-alpine

# Establecemos el directorio de trabajo
WORKDIR /usr/src/app

# Copiamos el package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código (solo server.js)
COPY . .

# Exponemos el puerto 8080 (que usa tu server.js)
EXPOSE 8080

# El comando para iniciar la app
CMD [ "npm", "start" ]