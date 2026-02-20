FROM node:20-slim

WORKDIR /app

# Copiamos package.json primero (si existe) para aprovechar caché
COPY package*.json ./

# Si existe package.json, instalamos dependencias. Si no (primera vez), no pasa nada.
RUN if [ -f package.json ]; then npm install; fi

COPY . .

# Exponemos el puerto de Vite (por defecto 5173)
EXPOSE 5173

# Comando para desarrollo (host 0.0.0.0 es necesario para Docker)
CMD ["npm", "run", "dev", "--", "--host"]