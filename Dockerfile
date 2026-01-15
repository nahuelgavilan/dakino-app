# Dockerfile para desarrollo con hot-reload
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Configurar directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install && \
    npm uninstall @tailwindcss/postcss @tailwindcss/node 2>/dev/null || true && \
    npm install tailwindcss@3.4.17 --save-dev --force

# Copiar el resto de la aplicación
COPY . .

# Exponer puerto de Vite
EXPOSE 3000

# Comando para desarrollo con hot-reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
