# MCP Server (MySQL Local)

Este directorio contiene un servidor ligero que implementa el "Model Context
Protocol" conectado a una base de datos MySQL local. No modifica el proyecto
`city_sec_backend_claude`; es un servicio independiente.

## Preparación

1. En una terminal, cambia al directorio:

   ```bash
   cd mcp-server
   ```

2. Instala dependencias:

   ```bash
   npm install
   ```

3. Crea un fichero de configuración de entorno:

   ```bash
   cp .env.sample .env
   # o manualmente crea .env y copia los valores
   ```

   Ajusta `DB_*` para apuntar a tu MySQL local (por defecto `root@127.0.0.1:3306`).
   - **DB_PASSWORD** debe contener la contraseña que uses en tu DB local
     (por ejemplo `Effata` si estás usando el mismo `.env` del backend).
     Si dispones de una cadena URL, define `DATABASE_URL`.

4. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   Se imprimirá `MCP server listening on port 3001` cuando arranque.

## Endpoints disponibles

- `GET /health` – valida que la base de datos responde (`SELECT 1`).
- `POST /mcp/query` – ejecuta la sentencia SQL recibida en el cuerpo JSON:
  ```json
  { "query": "SELECT NOW()" }
  ```
  -> responde con filas devueltas o error de sintaxis/permiso.

> **Importante**: `/mcp/query` es solo un ejemplo de cómo invocar lógica
> hacia la base de datos; reescribe este endpoint con la lógica real del
> protocolo que uses.

## Añadiendo lógica MCP

Puedes añadir rutas adicionales en `index.js` o extraer la lógica de consulta
a un módulo aparte (`db.js`, servicios, etc.).

Ejemplo de exportar el pool:

```js
// db.js
const mysql = require('mysql2/promise');
const pool = mysql.createPool(...config...);
module.exports = { pool };
```

## Migraciones / Seeds (opcional)

Si quieres manejar esquemas y datos con Sequelize, añade las dependencias e
inicializa el CLI:

```bash
npm install sequelize sequelize-cli mysql2
npx sequelize-cli init
```

El resto sería igual que en el proyecto principal; el propósito de este servidor
es ser ligero y fácil de desplegar.

## Despliegue a Railway

1. `railway init` dentro de `mcp-server` o crea un proyecto desde la UI.
2. Añade el plugin MySQL en Railway y copia la variable `DATABASE_URL`.
3. Sube el repo (o usa `railway up`) y Railway detectará el `package.json`.

Recuerda configurar la variable `PORT` si no deseas usar el valor por
predeterminado.

---

Este MCP está diseñado para trabajar en **localhost** en conjunto con tu
instancia de MySQL. No afecta ninguna otra parte del proyecto principal.
