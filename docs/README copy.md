# 🚨 Sistema de Seguridad Ciudadana - Backend API

API RESTful para sistema de gestión de seguridad ciudadana con control de novedades, incidentes, personal, vehículos y recursos operativos.

## 📋 Características

✅ **Autenticación JWT** con control RBAC (Role-Based Access Control)  
✅ **CRUD completo** de Novedades, Vehículos, Personal, Sectores  
✅ **Control de acceso** por roles (Administrador, Supervisor, Operador, Visualizador)  
✅ **Auditoría completa** de todas las acciones  
✅ **Soft Delete** para mantener integridad de datos  
✅ **Rate Limiting** para prevenir ataques  
✅ **Documentación API** incluida  
✅ **Validaciones** y manejo robusto de errores

## 🛠️ Stack Tecnológico

- **Node.js** v16+
- **Express.js** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL** 8.0+ - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Helmet** - Seguridad HTTP
- **Morgan** - Logger de peticiones

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/citizen-security-backend.git
cd citizen-security-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos

#### 3.1 Crear base de datos

```sql
CREATE DATABASE citizen_security_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3.2 Importar estructura principal

```bash
mysql -u root -p citizen_security_v2 < database/citizen_security_2a.sql
```

#### 3.3 Importar tablas de autenticación

```bash
mysql -u root -p citizen_security_v2 < database/usuarios_roles_permisos.sql
```

### 4. Configurar variables de entorno

Copiar el archivo de ejemplo y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Base de datos
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=citizen_security_v2
DB_USER=root
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=genera_un_secreto_seguro_aqui
JWT_EXPIRE=24h

# Servidor
PORT=3000
NODE_ENV=development
```

#### Generar JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Iniciar servidor

#### Modo desarrollo (con nodemon):

```bash
npm run dev
```

#### Modo producción:

```bash
npm start
```

El servidor estará corriendo en: `http://localhost:3000`

## 🔐 Usuario Administrador por Defecto

```
Username: admin
Email: admin@seguridadciudadana.gob.pe
Password: Admin123!
```

**⚠️ IMPORTANTE:** Cambiar la contraseña inmediatamente después del primer login.

## 📚 Documentación de la API

Una vez iniciado el servidor, accede a:

- **Documentación completa:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/health`

### Endpoints principales:

#### Autenticación

```
POST   /api/auth/login           - Iniciar sesión
POST   /api/auth/register         - Registrar usuario (admin)
POST   /api/auth/logout           - Cerrar sesión
GET    /api/auth/me               - Perfil del usuario
POST   /api/auth/change-password  - Cambiar contraseña
POST   /api/auth/forgot-password  - Recuperar contraseña
POST   /api/auth/reset-password   - Restablecer contraseña
```

#### Novedades/Incidentes

```
GET    /api/novedades              - Listar novedades
POST   /api/novedades              - Crear novedad
GET    /api/novedades/:id          - Obtener novedad
PUT    /api/novedades/:id          - Actualizar novedad
DELETE /api/novedades/:id          - Eliminar novedad
POST   /api/novedades/:id/asignar  - Asignar recursos
GET    /api/novedades/:id/historial - Historial de estados
GET    /api/novedades/dashboard/stats - Estadísticas
```

#### Vehículos

```
GET    /api/vehiculos              - Listar vehículos
POST   /api/vehiculos              - Crear vehículo
GET    /api/vehiculos/:id          - Obtener vehículo
PUT    /api/vehiculos/:id          - Actualizar vehículo
DELETE /api/vehiculos/:id          - Eliminar vehículo
GET    /api/vehiculos/disponibles  - Vehículos disponibles
POST   /api/vehiculos/:id/abastecimiento - Registrar combustible
GET    /api/vehiculos/:id/abastecimientos - Historial combustible
```

#### Personal

```
GET    /api/personal               - Listar personal
POST   /api/personal               - Crear personal
GET    /api/personal/:id           - Obtener personal
PUT    /api/personal/:id           - Actualizar personal
DELETE /api/personal/:id           - Eliminar personal
PATCH  /api/personal/:id/estado    - Cambiar estado
GET    /api/personal/disponibles   - Personal disponible
GET    /api/personal/stats         - Estadísticas
```

#### Sectores y Cuadrantes

```
GET    /api/sectores               - Listar sectores
POST   /api/sectores               - Crear sector
GET    /api/sectores/:id           - Obtener sector
PUT    /api/sectores/:id           - Actualizar sector
DELETE /api/sectores/:id           - Eliminar sector
GET    /api/sectores/cuadrantes    - Listar cuadrantes
POST   /api/sectores/cuadrantes    - Crear cuadrante
```

#### Catálogos

```
GET    /api/catalogos/tipos-novedad      - Tipos de novedad
GET    /api/catalogos/subtipos-novedad   - Subtipos de novedad
GET    /api/catalogos/estados-novedad    - Estados de novedad
GET    /api/catalogos/tipos-vehiculo     - Tipos de vehículo
GET    /api/catalogos/cargos             - Cargos
GET    /api/catalogos/unidades           - Unidades/Oficinas
GET    /api/catalogos/ubigeo             - Búsqueda de ubigeo
GET    /api/catalogos/departamentos      - Departamentos
```

## 🔒 Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer {token}
```

### Ejemplo de login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```

Respuesta:

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

## 👥 Roles y Permisos

### Roles del Sistema

| Rol               | Nivel | Descripción                     |
| ----------------- | ----- | ------------------------------- |
| **Administrador** | 1     | Acceso total al sistema         |
| **Supervisor**    | 2     | Gestión operativa y supervisión |
| **Operador**      | 3     | Operación diaria del sistema    |
| **Visualizador**  | 4     | Solo lectura                    |

### Matriz de Permisos

| Acción             | Visualizador | Operador | Supervisor | Admin |
| ------------------ | ------------ | -------- | ---------- | ----- |
| Ver datos          | ✅           | ✅       | ✅         | ✅    |
| Crear registros    | ❌           | ✅       | ✅         | ✅    |
| Editar registros   | ❌           | ❌       | ✅         | ✅    |
| Eliminar registros | ❌           | ❌       | ❌         | ✅    |
| Gestionar usuarios | ❌           | ❌       | ❌         | ✅    |
| Configuración      | ❌           | ❌       | ❌         | ✅    |

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── database.js           # Configuración de Sequelize
├── controllers/
│   ├── authController.js     # Autenticación
│   ├── novedadesController.js
│   ├── vehiculosController.js
│   ├── personalController.js
│   ├── sectoresController.js
│   └── catalogosController.js
├── middlewares/
│   └── authMiddleware.js     # JWT y RBAC
├── models/
│   └── index.js              # Modelos Sequelize
├── routes/
│   ├── index.routes.js       # Router principal
│   ├── auth.routes.js
│   ├── novedades.routes.js
│   ├── vehiculos.routes.js
│   ├── personal.routes.js
│   ├── sectores.routes.js
│   └── catalogos.routes.js
└── app.js                     # Archivo principal

database/
├── citizen_security_2a.sql
└── usuarios_roles_permisos.sql

.env                           # Variables de entorno
.env.example                   # Plantilla de variables
package.json                   # Dependencias
README.md                      # Este archivo
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🔍 Logs y Debugging

Los logs se muestran en consola en modo desarrollo:

```bash
npm run dev
```

Formato de logs:

```
[2024-12-04T10:30:00.000Z] GET /api/novedades
✅ Conexión a la base de datos establecida
🚀 Servidor corriendo en: http://localhost:3000
```

## 🐛 Solución de Problemas

### Error: Cannot connect to MySQL

Verificar:

1. MySQL está corriendo: `sudo systemctl status mysql`
2. Credenciales correctas en `.env`
3. Base de datos existe: `SHOW DATABASES;`

### Error: JWT_SECRET is required

Configurar `JWT_SECRET` en `.env`:

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Error: Port 3000 already in use

Cambiar puerto en `.env`:

```env
PORT=3001
```

### Error: Sequelize validation errors

Revisar que los datos enviados cumplan con las validaciones de los modelos.

## 📈 Performance

- **Rate Limiting:** 100 req/15min por IP
- **Auth Rate Limiting:** 5 req/15min por IP
- **Connection Pool:** 10 conexiones máximas
- **Timeout:** 30 segundos

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT con expiración configurable
- ✅ Helmet.js para headers HTTP seguros
- ✅ Rate limiting contra fuerza bruta
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Protección SQL Injection (ORM)
- ✅ Logs de auditoría

## 🚀 Despliegue en Producción

### Variables de entorno importantes:

```env
NODE_ENV=production
JWT_SECRET=secreto_super_seguro_diferente_al_de_desarrollo
DB_PASSWORD=password_seguro_de_produccion
SYNC_DB=false
```

### Consideraciones:

1. **Cambiar contraseña del usuario admin**
2. **Habilitar HTTPS**
3. **Configurar firewall**
4. **Backups automáticos de BD**
5. **Monitoreo de logs**
6. **Rate limiting más estricto**

## 📝 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 👨‍💻 Desarrollador

Desarrollado por: [Tu Nombre]  
Email: tu.email@ejemplo.com  
GitHub: @tu-usuario

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades:

- Abrir un issue en GitHub
- Email: soporte@seguridadciudadana.gob.pe

---

**⚠️ IMPORTANTE:** Este sistema maneja datos sensibles de seguridad. Asegurar adecuadamente en producción.
