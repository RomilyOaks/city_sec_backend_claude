# 📋 AGENTS - Documentación del Proyecto

## 🎯 **Definición del Alcance del Backend**

### **Propósito Principal**
Backend API RESTful para el sistema de gestión de novedades y operativos de seguridad CitySec.

### **Funcionalidades Clave**
- **Gestión de Novedades:** Creación, seguimiento y resolución de incidentes de seguridad
- **Operativos:** Gestión de turnos, vehículos, personal y cuadrantes de patrullaje
- **Usuarios y Roles:** Sistema de autenticación y autorización basado en roles
- **Reportes y Estadísticas:** Análisis de tiempos de respuesta y métricas operativas
- **Integración Geográfica:** Manejo de ubigeos, sectores, cuadrantes y direcciones

### **Dominio de Negocio**
- **Seguridad Ciudadana:** Incidentes reportados por ciudadanos o personal
- **Operativos Policiales:** Patrullaje vehicular y a pie en zonas asignadas
- **Gestión de Recursos:** Vehículos, personal y equipamiento operativo
- **Tiempo de Respuesta:** Métricas críticas para evaluación de desempeño

---

## 🏗️ **Arquitectura**

### **Arquitectura General**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Base de Datos │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌────▼────┐            ┌────▼────┐
    │  Auth   │            │  Cache  │            │  Logs   │
    │  JWT    │            │ Redis   │            │ Winston │
    └─────────┘            └─────────┘            └─────────┘
```

### **Estructura de Capas**
```
src/
├── controllers/     # Capa de Presentación (Endpoints)
├── services/        # Capa de Negocio (Lógica de negocio)
├── models/          # Capa de Datos (Modelos Sequelize)
├── middlewares/     # Capa de Presentación (Autenticación)
├── utils/           # Utilidades compartidas
├── routes/          # Definición de rutas
├── validators/      # Validaciones de entrada
└── config/          # Configuración de la aplicación
```

### **Patrones Arquitectónicos**
- **MVC (Model-View-Controller):** Separación clara de responsabilidades
- **Repository Pattern:** Abstracción del acceso a datos
- **Middleware Pattern:** Procesamiento de requests
- **Factory Pattern:** Creación de instancias
- **Observer Pattern:** Eventos y notificaciones

---

## 🔄 **Patrones de Software Aplicados**

### **Patrones de Diseño**
- **Singleton:** Conexión a base de datos, configuración
- **Factory:** Creación de modelos y servicios
- **Strategy:** Diferentes estrategias de validación
- **Observer:** Eventos del sistema (logs, auditoría)
- **Decorator:** Middlewares de autenticación
- **Adapter:** Integración con diferentes servicios externos

### **Patrones de Arquitectura**
- **Layered Architecture:** Separación por capas funcionales
- **Dependency Injection:** Inyección de dependencias
- **CQRS:** Separación de lectura y escritura (en algunos módulos)
- **Event-Driven Architecture:** Emisión de eventos para auditoría

### **Patrones de Codificación**
- **Error Handling Pattern:** Manejo centralizado de errores
- **Validation Pattern:** Validaciones consistentes
- **Response Pattern:** Estructura uniforme de respuestas
- **Async/Await Pattern:** Manejo de operaciones asíncronas

---

## 💻 **Lenguajes y Librerías**

### **Lenguajes Principales**
- **JavaScript (ES2022+):** Lenguaje principal del backend
- **SQL:** Consultas y migraciones de base de datos

### **Framework Principal**
- **Node.js:** Runtime environment
- **Express.js:** Framework web para API RESTful

### **Base de Datos y ORM**
- **MySQL:** Base de datos relacional principal
- **Sequelize:** ORM para Node.js
- **mysql2:** Driver MySQL para Node.js

### **Autenticación y Seguridad**
- **jsonwebtoken (JWT):** Tokens de autenticación
- **bcryptjs:** Hashing de contraseñas
- **helmet:** Middleware de seguridad HTTP

### **Validación y Utilidades**
- **Joi:** Validación de datos de entrada
- **lodash:** Utilidades de programación funcional
- **moment.js / date-fns:** Manejo de fechas y timezones

### **Logging y Monitoreo**
- **Winston:** Sistema de logging estructurado
- **morgan:** HTTP request logger
- **cors:** Manejo de CORS

### **Testing**
- **Jest:** Framework de testing unitario
- **Supertest:** Testing de endpoints HTTP

### **Desarrollo y Productividad**
- **ESLint:** Linting y calidad de código
- **Prettier:** Formato de código consistente
- **nodemon:** Auto-reload en desarrollo

---

## 📝 **Estándares y Nomenclatura Usada**

### **Nomenclatura de Archivos y Carpetas**
- **Carpetas:** `snake_case` (ej: `operativos_vehiculos`)
- **Archivos:** `snake_case` (ej: `novedades_controller.js`)
- **Constantes:** `UPPER_SNAKE_CASE` (ej: `DEFAULT_TIMEZONE`)
- **Variables:** `camelCase` (ej: `usuarioId`, `fechaCreacion`)

### **Nomenclatura de Base de Datos**
- **Tablas:** `snake_case_plural` (ej: `novedades_incidentes`)
- **Columnas:** `snake_case` (ej: `fecha_hora_ocurrencia`)
- **Claves Primarias:** `id` (auto-incremental)
- **Claves Foráneas:** `tabla_id` (ej: `usuario_id`, `novedad_id`)

### **Nomenclatura de Código JavaScript**
- **Variables y Funciones:** `camelCase`
- **Clases:** `PascalCase`
- **Constantes:** `UPPER_SNAKE_CASE`
- **Privados:** `_prefijo` (ej: `_validateUser`)

### **Nomenclatura de API**
- **Endpoints:** `kebab-case` (ej: `/api/v1/novedades/{id}/historial`)
- **Métodos HTTP:** RESTful estándar (GET, POST, PUT, DELETE)
- **Parámetros:** `camelCase` (ej: `novedadId`, `turnoId`)
- **Response Keys:** `snake_case` (ej: `created_at`, `updated_by`)

### **Estándares de Código**
- **Indentación:** 2 espacios (JavaScript)
- **Comillas:** Comillas simples en JavaScript
- **Punto y coma:** Obligatorio al final de statements
- **Imports:** Alfabéticos y agrupados por tipo
- **Exports:** Named exports para módulos múltiples

### **Estándares de Documentación**
- **JSDoc:** Documentación de funciones y clases
- **Comentarios:** Descriptivos y en español
- **README.md:** Documentación de proyecto
- **Changelog:** Registro de cambios por versión

---

## 🎨 **Colores y Diseño**

### **Identidad Visual Principal**
- **Tono Principal:** Verde Oliva (militar/policial)
- **Contexto:** Seguridad ciudadana, operativos policiales

### **Colores del Sistema**
```css
/* Verde Oliva - Principal */
.bg-primary-700    /* Verde oliva oscuro - botones principales */
.bg-primary-800    /* Verde oliva muy oscuro - hover estados */

/* Paleta Complementaria */
.text-primary-700  /* Texto verde oliva */
.border-primary-700 /* Bordes verde oliva */
.hover\:bg-primary-800:hover /* Hover verde oliva más oscuro */

/* Colores de Estado */
.bg-green-600      /* Éxito, resuelto */
.bg-yellow-600     /* Advertencia, pendiente */
.bg-red-600        /* Error, crítico */
.bg-blue-600       /* Información, activo */
```

### **Aplicación en la UI**
- **Botones Primarios:** `bg-primary-700` con hover `bg-primary-800`
- **Botones de Acción:** Verde oliva para acciones principales
- **Indicadores de Estado:** Colores semánticos (verde=éxito, rojo=error)
- **Navegación:** Verde oliva para elementos activos

### **Consistencia Visual**
- **Botones:** Esquinas redondeadas, sombras sutiles
- **Formularios:** Bordes verde oliva en focus
- **Alertas:** Iconos + colores de estado
- **Tablas:** Headers verde oliva, filas alternadas

---

## 🔧 **Configuración y Entorno**

### **Variables de Entorno Clave**
```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=city_sec_db
DB_USER=root
DB_PASSWORD=password

# Autenticación
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Timezone
APP_TIMEZONE=America/Lima
DB_TIMEZONE=-05:00

# Entorno
NODE_ENV=production
PORT=3000
```

### **Estructura de Configuración**
- **Database.js:** Configuración de conexión MySQL
- **Constants.js:** Constantes de la aplicación
- **Environment:** Variables por entorno (dev/staging/prod)

---

## 📊 **Métricas y Monitoreo**

### **KPIs del Sistema**
- **Tiempo de Respuesta:** Promedio de atención de novedades
- **Disponibilidad:** Uptime del servicio (objetivo: 99.9%)
- **Rendimiento:** Tiempo de respuesta de endpoints (<200ms)
- **Errores:** Tasa de errores (<1%)

### **Logging Estructurado**
```javascript
{
  "timestamp": "2026-03-10T15:30:00.000Z",
  "level": "info",
  "message": "Novedad creada exitosamente",
  "userId": 123,
  "novedadId": 456,
  "action": "createNovedad",
  "duration": 150
}
```

---

## 🚀 **Despliegue y Producción**

### **Plataforma**
- **Railway:** Plataforma de despliegue principal
- **Docker:** Contenedores para consistencia
- **GitHub Actions:** CI/CD automatizado

### **Consideraciones de Producción**
- **Timezone:** Configurado para America/Lima (UTC-5)
- **Base de Datos:** MySQL con timezone configurado
- **Logs:** Centralizados y estructurados
- **Monitoreo:** Métricas en tiempo real

---

## 📝 **Notas para Agentes AI**

### **Contexto del Proyecto**
- **Dominio:** Seguridad ciudadana y operativos policiales
- **Usuario Principal:** Personal de seguridad y administradores
- **Prioridad:** Tiempos de respuesta y disponibilidad del servicio

### **Reglas de Desarrollo**
1. **Timezone crítico:** Todas las fechas deben manejar America/Lima
2. **Seguridad:** Validar permisos en cada endpoint sensible
3. **Performance:** Optimizar queries con índices adecuados
4. **Consistencia:** Mantener nomenclatura y patrones establecidos

### **Comunicación con Frontend**
- **Formato de fechas:** `YYYY-MM-DD HH:mm:ss` (hora Perú)
- **Respuestas:** Estructura consistente `{success, message, data}`
- **Errores:** Mensajes claros y códigos HTTP apropiados

---

*Última actualización: Marzo 2026*
*Versión: 1.0.0*