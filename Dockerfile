FROM node:18-alpine

WORKDIR /app

# Copiar package files primero para aprovechar layer cache
# Si package.json/package-lock.json no cambian, npm ci se saltea
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
