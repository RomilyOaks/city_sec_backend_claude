# 🚔 Sistema de Seguridad Ciudadana - Backend API

Backend API para gestión integral de seguridad ciudadana con autenticación JWT, control de acceso basado en roles (RBAC) y gestión de incidentes.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Sistema RBAC](#sistema-rbac)
- [Contribución](#contribución)

## ✨ Características

### 🔐 Autenticación y Seguridad

- ✅ Autenticación JWT con access y refresh tokens
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Permisos granulares por módulo/recurso/acción
- ✅ Hasheo seguro de contraseñas con bcrypt
- ✅ Protección contra intentos de login fallidos
- ✅ Bloqueo temporal de cuentas
- 🔜 Autenticación de dos factores (2FA)
- 🔜 OAuth2 (Google, Microsoft, Azure AD)

### 👥 Gestión de Usuarios

- ✅ CRUD completo de usuarios
- ✅ Asignación dinámica de roles
- ✅ Permisos directos a usuarios
- ✅ Gestión de estados (activo, inactivo, bloqueado)
- ✅ Soft delete (eliminación lógica)
- ✅ Reseteo de contraseñas por administrador
- ✅ Cambio de contraseña por usuario

### 📊 Gestión Operativa

- ✅ Registro de novedades e incidentes
- ✅ Gestión de vehículos y abastecimiento
- ✅ Control de personal de seguridad
- ✅ Sectores y cuadrantes de patrullaje
- ✅ Unidades operativas
- ✅ Catálogos configurables

### 📝 Auditoría

- ✅ Historial de cambios de usuarios
- ✅ Registro de intentos de login
- ✅ Tracking de estados de novedades
- 🔜 Auditoría completa de acciones

## 🛠️ Tecnologías

- **Node.js** v18+
- **Express.js** - Framework web
- **Sequelize ORM** - Modelado de datos
- **MySQL** 8.0+ - Base de datos
- **JWT** - Autenticación
- **Passport.js** - for Google and Microsoft OAuth
- **bcryptjs** - Hasheo de contraseñas
- **CORS** - Control de acceso cross-origin
- **Swagger** - API Documentation
- **Jest** - Testing
- **Supertest** - Testing
- **Helmet** - Security
- **Winston** - Logging
- **Nodemon** - Development
- **ESLint** - Linter

## 📜 Scripts

In the project directory, you can run:

- `npm start`: Runs the app in production mode.
- `npm run dev`: Runs the app in development mode with Nodemon.
- `npm test`: Runs tests with Jest.
- `npm run test:watch`: Runs tests in watch mode.
- `npm run swagger`: Generates Swagger documentation.
- `npm run lint`: Lints the codebase.
- `npm run lint:fix`: Lints and fixes the codebase.
- `npm run db:seed`: Runs all seeders.
- `npm run seed:rbac`: Seeds RBAC data.
- `npm run seed:estados`: Seeds `estados` data.
- `npm run db:migrate`: Runs database migrations.
- `npm run db:migrate:undo`: Reverts database migrations.

## 📜 Scripts

In the project directory, you can run:

- `npm start`: Runs the app in production mode.
- `npm run dev`: Runs the app in development mode with Nodemon.
- `npm test`: Runs tests with Jest.
- `npm run test:watch`: Runs tests in watch mode.
- `npm run swagger`: Generates Swagger documentation.
- `npm run lint`: Lints the codebase.
- `npm run lint:fix`: Lints and fixes the codebase.
- `npm run db:seed`: Runs all seeders.
- `npm run seed:rbac`: Seeds RBAC data.
- `npm run seed:estados`: Seeds `estados` data.
- `npm run db:migrate`: Runs database migrations.
- `npm run db:migrate:undo`: Reverts database migrations.

## 📁 Estructura del Proyecto

```
city_sec_backend/
├── src/
│   ├── config/
│   │   └── database.js           # Configuración de Sequelize
│   │
│   ├── models/                   # Modelos de Sequelize
│   │   ├── index.js              # Asociaciones entre modelos
│   │   ├── Usuario.js
│   │   ├── Rol.js
│   │   ├── Permiso.js
│   │   ├── Vehiculo.js
│   │   ├── TipoVehiculo.js
│   │   ├── PersonalSeguridad.js
│   │   ├── Cargo.js
│   │   ├── Sector.js
│   │   ├── Cuadrante.js
│   │   ├── UnidadOficina.js
│   │   ├── TipoNovedad.js
│   │   ├── SubtipoNovedad.js
│   │   ├── EstadoNovedad.js
│   │   └── Ubigeo.js
│   │
│   ├── controllers/              # Controladores
│   │   ├── authController.js
│   │   ├── usuariosController.js
│   │   ├── catalogosController.js
│   │   ├── novedadesController.js
│   │   ├── personalController.js
│   │   ├── sectoresController.js
│   │   └── vehiculosController.js
│   │
│   ├── middlewares/              # Middlewares
│   │   └── authMiddleware.js
│   │
│   ├── routes/                   # Rutas
│   │   ├── auth.routes.js
│   │   ├── usuarios.routes.js
│   │   ├── catalogos.routes.js
│   │   ├── novedades.routes.js
│   │   ├── personal.routes.js
│   │   ├── sectores.routes.js
│   │   └── vehiculos.routes.js
│   │
│   ├── seeders/                  # Seeds de datos
│   │   └── seedRBAC.js
│   │
│   └── app.js                    # Archivo principal
│
├── .env                          # Variables de entorno (no versionar)
├── .env.example                  # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Instalación

### Prerrequisitos

- Node.js v18 o superior
- MySQL 8.0 o superior
- npm o yarn

### Pasos

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/RomilyOaks/city_sec_backend_claude.git
   cd city_sec_backend_claude
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Crear base de datos**
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE citizen_security_v2;
   ```
4. **Restaurar dump de la base de datos**

   ```bash
   mysql -u root -p citizen_security_v2 < Dump20251204.sql
   ```

5. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con tus credenciales

6. **Inicializar RBAC (roles y permisos)**

   ```bash
   npm run seed:rbac
   ```

7. **Iniciar servidor**

   ```bash
   # Desarrollo (con nodemon)
   npm run dev

   # Producción
   npm start
   ```

## ⚙️ Configuración

### Variables de Entorno Principales

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=citizen_security_v2
DB_PORT=3306

# JWT Secrets (cambiar en producción)
JWT_SECRET=tu_secret_super_seguro
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro

# Servidor
PORT=3000
NODE_ENV=development
```

### Credenciales del Usuario Administrador Inicial

Después de ejecutar `npm run seed:rbac`:

```
Username: admin
Email: admin@citysec.com
Password: Admin123!
```

⚠️ **IMPORTANTE:** Cambiar esta contraseña inmediatamente después del primer login.

## 📖 Uso

### 1. Autenticación

**Login:**

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username_or_email": "admin",
  "password": "Admin123!"
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": {
      "id": 1,
      "username": "admin",
      "email": "admin@citysec.com",
      "roles": [...],
      "permisos": [...]
    }
  }
}
```

### 2. Usar Token en Peticiones

```bash
GET http://localhost:3000/api/usuarios
Authorization: Bearer {accessToken}
```

### 3. Renovar Token Expirado

```bash
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "tu_refresh_token"
}
```

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint           | Descripción              | Auth |
| ------ | ------------------ | ------------------------ | ---- |
| POST   | `/register`        | Registrar usuario        | No   |
| POST   | `/login`           | Iniciar sesión           | No   |
| POST   | `/refresh`         | Renovar token            | No   |
| POST   | `/logout`          | Cerrar sesión            | Sí   |
| POST   | `/change-password` | Cambiar contraseña       | Sí   |
| GET    | `/me`              | Datos del usuario actual | Sí   |
| POST   | `/forgot-password` | Recuperar contraseña     | No   |

### Usuarios (`/api/usuarios`)

| Método | Endpoint              | Descripción         | Permiso                    |
| ------ | --------------------- | ------------------- | -------------------------- |
| GET    | `/`                   | Listar usuarios     | `usuarios.usuarios.read`   |
| GET    | `/:id`                | Obtener usuario     | `usuarios.usuarios.read`   |
| POST   | `/`                   | Crear usuario       | `usuarios.usuarios.create` |
| PUT    | `/:id`                | Actualizar usuario  | `usuarios.usuarios.update` |
| DELETE | `/:id`                | Eliminar usuario    | `usuarios.usuarios.delete` |
| POST   | `/:id/reset-password` | Resetear contraseña | `usuarios.reset_password`  |
| PUT    | `/:id/estado`         | Cambiar estado      | `usuarios.update_estado`   |

### Otros Módulos

- `/api/catalogos` - Tipos de novedad, vehículos, etc.
- `/api/novedades` - Gestión de incidentes
- `/api/vehiculos` - Gestión de vehículos
- `/api/personal` - Gestión de personal
- `/api/sectores` - Sectores y cuadrantes

Ver documentación completa de cada módulo en sus respectivos archivos.

## 🎭 Sistema RBAC

### Roles Predefinidos

1. **Super Administrador** (`super_admin`)

   - Acceso total sin restricciones
   - Nivel jerárquico: 0

2. **Administrador** (`admin`)

   - Gestión completa excepto ciertos permisos de sistema
   - Nivel jerárquico: 1

3. **Operador** (`operador`)

   - Registro y gestión de novedades
   - Nivel jerárquico: 2

4. **Supervisor** (`supervisor`)

   - Supervisión y cierre de casos
   - Nivel jerárquico: 3

5. **Consulta** (`consulta`)

   - Solo lectura
   - Nivel jerárquico: 4

6. **Usuario Básico** (`usuario_basico`)
   - Acceso mínimo
   - Nivel jerárquico: 5

### Estructura de Permisos

Formato: `modulo.recurso.accion`

Ejemplos:

- `usuarios.usuarios.read`
- `novedades.incidentes.create`
- `vehiculos.combustible.read`

### Usar Middlewares de Autorización

```javascript
import {
  authenticate,
  requireRole,
  requirePermission,
} from "../middlewares/authMiddleware.js";

// Solo usuarios autenticados
router.get("/ruta", authenticate, controller);

// Solo admin o super_admin
router.delete(
  "/ruta",
  authenticate,
  requireRole(["super_admin", "admin"]),
  controller
);

// Solo con permiso específico
router.post(
  "/ruta",
  authenticate,
  requirePermission("modulo.recurso.create"),
  controller
);
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código

- Usar ES6+ modules (`import/export`)
- Comentarios en español
- JSDoc para funciones públicas
- Nombres descriptivos en inglés para código
- Commits en español con prefijos:
  - `Add:` - Nueva funcionalidad
  - `Fix:` - Corrección de bug
  - `Update:` - Actualización de código existente
  - `Refactor:` - Refactorización
  - `Docs:` - Documentación

## 📝 Próximas Características

- [ ] Autenticación 2FA (TOTP)
- [ ] OAuth2 completo (Google, Microsoft)
- [ ] Sistema de notificaciones
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Gestión de archivos adjuntos
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Geolocalización y mapas interactivos
- [ ] App móvil (React Native)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Tu Nombre**

- GitHub: [@RomilyOaks](https://github.com/RomilyOaks)

## 🙏 Agradecimientos

- Claude AI por asistencia en desarrollo
- Comunidad de Express.js
- Documentación de Sequelize

---

**¿Problemas o sugerencias?** Abre un [issue](https://github.com/RomilyOaks/city_sec_backend_claude/issues) en GitHub.

---

Hecho con ❤️ para mejorar la seguridad ciudadana
