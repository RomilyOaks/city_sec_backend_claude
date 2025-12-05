# 🚀 Guía de Inicio Rápido - 5 Minutos

## Prerequisitos

- Node.js 16+ instalado
- MySQL 8.0+ corriendo
- Git instalado

## Instalación Express (Copiar y Pegar)

```bash
# 1. Clonar repositorio (o crear carpeta)
mkdir citizen-security-backend
cd citizen-security-backend

# 2. Inicializar proyecto
npm init -y

# 3. Instalar dependencias
npm install express sequelize mysql2 jsonwebtoken bcryptjs cors helmet express-rate-limit morgan dotenv

# 4. Instalar dependencias de desarrollo
npm install -D nodemon

# 5. Crear estructura de carpetas
mkdir -p src/{config,controllers,middlewares,models,routes} database

# 6. Copiar archivos del código generado por Claude a las carpetas correspondientes
```

## Configurar Base de Datos

```bash
# Entrar a MySQL
mysql -u root -p

# Crear base de datos
CREATE DATABASE citizen_security_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Importar estructura principal
mysql -u root -p citizen_security_v2 < citizen_security_2a.sql

# Importar tablas de autenticación
mysql -u root -p citizen_security_v2 < database/usuarios_roles_permisos.sql
```

## Configurar Variables de Entorno

Crear archivo `.env` en la raíz:

```bash
# Copiar plantilla
cp .env.example .env

# O crear manualmente
cat > .env << EOF
NODE_ENV=development
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=citizen_security_v2
DB_USER=root
DB_PASSWORD=tu_password

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRE=24h

CORS_ORIGIN=http://localhost:5173
EOF
```

## Actualizar package.json

Agregar scripts:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  }
}
```

## Iniciar Servidor

```bash
# Modo desarrollo
npm run dev

# El servidor se iniciará en http://localhost:3000
```

## Verificar Instalación

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "version": "1.0.0"
}
```

### 2. Login con usuario admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```

Respuesta esperada:

```json
{
  "success": true,
  "token": "ACCESS_TOKEN_EXAMPLE",
  "user": {
    "id": 1,
    "username": "admin",
    "rol": "administrador"
  }
}
```

### 3. Probar endpoint protegido

```bash
# Usar el token del paso anterior
curl -X GET http://localhost:3000/api/novedades \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Estructura de Archivos que Debes Tener

```
citizen-security-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── catalogosController.js
│   │   ├── novedadesController.js
│   │   ├── personalController.js
│   │   ├── sectoresController.js
│   │   └── vehiculosController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── catalogos.routes.js
│   │   ├── index.routes.js
│   │   ├── novedades.routes.js
│   │   ├── personal.routes.js
│   │   ├── sectores.routes.js
│   │   └── vehiculos.routes.js
│   └── app.js
├── database/
│   ├── citizen_security_2a.sql
│   └── usuarios_roles_permisos.sql
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Endpoints Principales para Probar

### Autenticación

```bash
# Login
POST http://localhost:3000/api/auth/login

# Perfil
GET http://localhost:3000/api/auth/me
```

### Novedades

```bash
# Listar
GET http://localhost:3000/api/novedades

# Crear
POST http://localhost:3000/api/novedades

# Dashboard
GET http://localhost:3000/api/novedades/dashboard/stats
```

### Catálogos

```bash
# Tipos de novedad
GET http://localhost:3000/api/catalogos/tipos-novedad

# Estados
GET http://localhost:3000/api/catalogos/estados-novedad

# Tipos de vehículo
GET http://localhost:3000/api/catalogos/tipos-vehiculo
```

## Credenciales por Defecto

```
Usuario: admin
Password: Admin123!
Rol: administrador
```

**⚠️ CAMBIAR INMEDIATAMENTE EN PRODUCCIÓN**

## Problemas Comunes y Soluciones

### Error: Cannot find module

```bash
# Verificar que todas las dependencias estén instaladas
npm install
```

### Error: connect ECONNREFUSED (MySQL)

```bash
# Verificar que MySQL esté corriendo
sudo systemctl start mysql
# O en Windows: services.msc -> MySQL -> Iniciar
```

### Error: ER_BAD_DB_ERROR

```bash
# Crear la base de datos
mysql -u root -p -e "CREATE DATABASE citizen_security_v2"
```

### Error: Authentication plugin error

```bash
# Cambiar plugin de autenticación de MySQL
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_password';
FLUSH PRIVILEGES;
```

## Siguiente Paso

Una vez que el servidor esté corriendo correctamente:

1. ✅ Cambiar contraseña del admin
2. ✅ Crear usuarios de prueba con diferentes roles
3. ✅ Probar todos los endpoints con Postman
4. ✅ Revisar documentación completa en README.md
5. ✅ Configurar el frontend para conectarse a la API

## Testing con Postman

Importar esta colección básica:

```json
{
  "info": {
    "name": "Citizen Security API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"Admin123!\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{base_url}}/api/auth/login",
              "host": ["{{base_url}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    }
  ]
}
```

## Soporte

- 📧 Email: soporte@seguridadciudadana.gob.pe
- 💬 GitHub Issues: [Crear issue]
- 📚 Documentación completa: README.md

---

**¡Listo!** Tu API debería estar funcionando en http://localhost:3000 🎉
