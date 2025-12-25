/**
 * ===================================================
 * ROUTER PRINCIPAL - ÍNDICE DE RUTAS
 * ===================================================
 *
 * Ruta: src/routes/index.js
 *
 * Descripción:
 * Configuración principal de rutas del Sistema de Seguridad Ciudadana.
 * Centraliza todos los módulos y sus respectivas rutas con prefijos,
 * middlewares globales, y manejo de errores.
 *
 * VERSIÓN: 2.4.0
 * ÚLTIMA ACTUALIZACIÓN: 2025-12-23
 *
 * HISTORIAL DE CAMBIOS:
 * =====================
 *
 * v2.4.0 (2025-12-23):
 *   - ✅ Agregado módulo completo /tipos-via, /calles, /calles-cuadrantes, /direcciones
 *   - ✅ Sistema dual de direccionamiento (numeración municipal + Mz/Lote)
 *   - ✅ Auto-asignación de cuadrante y sector
 *   - ✅ Geocodificación GPS
 *   - ✅ 40+ nuevos endpoints
 *   - ✅ Documentación detallada de permisos RBAC
 *   - ✅ Actualizado availableRoutes en 404 handler
 * v2.3.0 (2025-12-14):
 *   - ✅ Agregado módulo /estados-novedad, /tipos-novedad, /subtipos-novedad
 * v2.2.0 (2025-12-12):
 *   - ✅ Agregado módulo /cargos
 *   - ✅ Mejorada documentación JSDoc
 *   - ✅ Agregado sistema de versionado
 *   - ✅ Mejorado middleware de logging
 *   - ✅ Agregado health check expandido
 * v2.1.0 (2025-12-11):
 *   - ✅ Agregado módulo /cuadrantes
 *   - ✅ Mejorada estructura de módulos
 * v2.0.0 (2025-12-10):
 *   - ✅ Agregado módulo /personal
 *   - ✅ Refactorización completa
 * v1.0.0 (2025-11-01):
 *   - 🎉 Versión inicial
 *
 * MÓDULOS DISPONIBLES:
 * ====================
 * 🔐 Autenticación:       /auth
 * 👥 Usuarios:            /usuarios
 * 🎭 Roles:               /roles
 * 🔑 Permisos:            /permisos
 * 📋 Novedades:           /novedades
 * 🚗 Vehículos:           /vehiculos
 * 👨‍✈️ Personal:            /personal
 * 🗺️ Sectores:            /sectores
 * 📍 Cuadrantes:          /cuadrantes
 * 📚 Catálogos:           /catalogos
 * 💼 Cargos:              /cargos
 * 🛣️ Tipos de Vía:       /tipos-via        ✨ NUEVO v2.4.0
 * 🏘️ Calles:             /calles           ✨ NUEVO v2.4.0
 * 📐 Calles-Cuadrantes:  /calles-cuadrantes ✨ NUEVO v2.4.0
 * 📍 Direcciones:        /direcciones      ✨ NUEVO v2.4.0
 * 📊 Auditoría:           /auditoria
 * 📈 Reportes:            /reportes (futuro)
 *
 * @module routes/index
 * @requires express
 * @author Sistema de Seguridad Ciudadana
 * @version 2.4.0
 * @date 2025-12-23
 */

import express from "express";
const router = express.Router();

//=============================================
// IMPORTAR ROUTERS DE MÓDULOS
//=============================================

// 🔐 Autenticación (público)
import authRoutes from "./auth.routes.js";

// 👥 Gestión de Usuarios y Permisos
import usuariosRoutes from "./usuarios.routes.js";
import rolesRoutes from "./roles.routes.js";
import permisosRoutes from "./permisos.routes.js";

// 📋 Módulos Operativos
import novedadesRoutes from "./novedades.routes.js";
import vehiculosRoutes from "./vehiculos.routes.js";
import mantenimientosRoutes from "./mantenimientos.routes.js";
import personalRoutes from "./personal.routes.js";
import sectoresRoutes from "./sectores.routes.js";
import cuadrantesRoutes from "./cuadrantes.routes.js";

// 📚 Catálogos y Configuración
import catalogosRoutes from "./catalogos.routes.js";
import cargosRoutes from "./cargos.routes.js";
import tipoNovedadRoutes from "./tipo-novedad.routes.js";
import subtipoNovedadRoutes from "./subtipo-novedad.routes.js";
import estadoNovedadRoutes from "./estado-novedad.routes.js";
// import ubigeoRoutes from "./ubigeoRoutes.js"; // ⚠️ TEMPORAL - Comentado para debug

// 📊 Auditoría y Reportes
import auditoriaAccionRoutes from "./auditoriaAcciones.routes.js";
// import reportesRoutes from "./reportes.routes.js"; // TODO: Implementar

// ============================================================================
// 🛣️ MÓDULO CALLES Y DIRECCIONES v2.4.0 ✨
// ============================================================================
/**
 * Módulo completo para gestión de calles y direcciones normalizadas
 *
 * CARACTERÍSTICAS:
 * ===============
 * ✅ Sistema dual de direccionamiento:
 *    - Numeración municipal (Av. Ejército 450)
 *    - Sistema Mz/Lote (Mz M Lote 15)
 *    - Soporte para ambos sistemas simultáneos
 *
 * ✅ Auto-asignación inteligente:
 *    - Cuadrante automático según número
 *    - Sector automático derivado del cuadrante
 *    - Validación de rangos antes de guardar
 *
 * ✅ Geocodificación:
 *    - Coordenadas GPS (latitud/longitud)
 *    - Registro de fuente de geocodificación
 *    - Endpoint especializado para actualizar coordenadas
 *
 * ✅ Seguridad RBAC:
 *    - 17 permisos granulares
 *    - Control por módulo.recurso.acción
 *    - Integrado con seedRBAC v2.2.1
 *
 * PERMISOS RBAC:
 * =============
 * Módulo: calles
 *
 * Recurso: tipos_via (4 permisos)
 *   - calles.tipos_via.read
 *   - calles.tipos_via.create
 *   - calles.tipos_via.update
 *   - calles.tipos_via.delete
 *
 * Recurso: calles (4 permisos)
 *   - calles.calles.read
 *   - calles.calles.create
 *   - calles.calles.update
 *   - calles.calles.delete
 *
 * Recurso: calles_cuadrantes (4 permisos)
 *   - calles.calles_cuadrantes.read
 *   - calles.calles_cuadrantes.create
 *   - calles.calles_cuadrantes.update
 *   - calles.calles_cuadrantes.delete
 *
 * Recurso: direcciones (5 permisos)
 *   - calles.direcciones.read
 *   - calles.direcciones.create
 *   - calles.direcciones.update
 *   - calles.direcciones.delete
 *   - calles.direcciones.geocodificar  ⭐ ESPECIAL
 *
 * ESTADÍSTICAS:
 * ============
 * - 4 recursos
 * - 17 permisos
 * - 40+ endpoints
 * - 4 modelos de BD
 * - 4 controladores
 * - 4 validadores
 *
 * @version 2.4.0
 * @date 2025-12-23
 */
import tiposViaRoutes from "./tipos-via.routes.js";
import callesRoutes from "./calles.routes.js";
import callesCuadrantesRoutes from "./calles-cuadrantes.routes.js";
import direccionesRoutes from "./direcciones.routes.js";

//=============================================
// MIDDLEWARE GLOBAL DE LOGGING
//=============================================

/**
 * Middleware para registrar todas las peticiones HTTP
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware
 */
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"] || "Unknown";

  console.log(`
┌──────────────────────────────────────────────
│ 📡 REQUEST
├──────────────────────────────────────────────
│ Timestamp: ${timestamp}
│ Method:    ${method}
│ URL:       ${url}
│ IP:        ${ip}
│ Agent:     ${userAgent.substring(0, 50)}...
└───────────────────────────────────────────────
  `);

  next();
});

//=============================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
//=============================================

/**
 * @route   /auth
 * @desc    Rutas de autenticación y gestión de sesiones
 * @access  Público
 * @endpoints
 *   - POST   /auth/register          - Registrar nuevo usuario
 *   - POST   /auth/login             - Iniciar sesión
 *   - POST   /auth/refresh           - Renovar access token
 *   - POST   /auth/logout            - Cerrar sesión
 *   - POST   /auth/change-password   - Cambiar contraseña
 *   - GET    /auth/profile           - Obtener perfil
 *   - POST   /auth/forgot-password   - Solicitar recuperación
 *   - GET    /auth/debug-token       - Debug token (dev only)
 */
router.use("/auth", authRoutes);

//=============================================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
//=============================================

/**
 * @route   /usuarios
 * @desc    Gestión completa de usuarios del sistema
 * @access  Admin, Supervisor
 */
router.use("/usuarios", usuariosRoutes);

/**
 * @route   /roles
 * @desc    Gestión de roles y permisos (RBAC)
 * @access  Super Admin, Admin
 */
router.use("/roles", rolesRoutes);

/**
 * @route   /permisos
 * @desc    Gestión de permisos granulares
 * @access  Super Admin
 */
router.use("/permisos", permisosRoutes);

/**
 * @route   /novedades
 * @desc    Gestión de novedades e incidentes de seguridad
 * @access  Operador, Supervisor, Admin
 * @features
 *   - CRUD completo
 *   - Cambio de estados
 *   - Asignación de recursos
 *   - Dashboard y estadísticas
 */
router.use("/novedades", novedadesRoutes);

/**
 * @route   /vehiculos
 * @desc    Gestión de vehículos y flota municipal
 * @access  Operador, Supervisor, Admin
 * @features
 *   - CRUD completo
 *   - Control de kilometraje
 *   - Estados operativos
 *   - Historial de asignaciones
 */
router.use("/vehiculos", vehiculosRoutes);

/**
 * @route   /mantenimientos
 * @desc    Gestión de mantenimientos vehiculares
 * @access  Operador, Supervisor, Admin
 */
router.use("/mantenimientos", mantenimientosRoutes);

/**
 * @route   /personal
 * @desc    Gestión integral de personal de seguridad ciudadana
 * @access  Operador, Supervisor, Admin
 * @features
 *   - CRUD completo con soft delete
 *   - Gestión de licencias de conducir
 *   - Asignación de vehículos
 *   - Control de estados laborales
 *   - Generación de códigos de acceso
 *   - Estadísticas y reportes
 * @endpoints (20+)
 *   - GET    /personal                         - Listar con filtros
 *   - GET    /personal/stats                   - Estadísticas generales
 *   - GET    /personal/conductores             - Personal con licencia
 *   - GET    /personal/disponibles             - Sin vehículo asignado
 *   - GET    /personal/cargo/:cargoId          - Filtrar por cargo
 *   - GET    /personal/documento/:doc          - Buscar por documento
 *   - GET    /personal/status/:status          - Filtrar por status
 *   - GET    /personal/:id                     - Obtener detalle
 *   - POST   /personal                         - Crear nuevo
 *   - PUT    /personal/:id                     - Actualizar completo
 *   - DELETE /personal/:id                     - Eliminar (soft)
 *   - POST   /personal/:id/restore             - Restaurar eliminado
 *   - PATCH  /personal/:id/status              - Cambiar status laboral
 *   - PATCH  /personal/:id/asignar-vehiculo    - Asignar vehículo
 *   - DELETE /personal/:id/desasignar-vehiculo - Quitar vehículo
 *   - PATCH  /personal/:id/licencia            - Actualizar licencia
 *   - POST   /personal/:id/generar-codigo      - Generar código acceso
 *   - GET    /personal/:id/verificar-licencia  - Verificar vigencia
 *   - GET    /personal/:id/historial-novedades - Historial completo
 */
router.use("/personal", personalRoutes);

/**
 * @route   /sectores
 * @desc    Gestión de sectores de vigilancia y patrullaje
 * @access  Supervisor, Admin
 * @features
 *   - Definición de zonas de cobertura
 *   - Asignación de personal
 *   - Estadísticas por sector
 */
router.use("/sectores", sectoresRoutes);

/**
 * @route   /cuadrantes
 * @desc    Gestión de cuadrantes de patrullaje (subdivisiones de sectores)
 * @access  Supervisor, Admin
 * @features
 *   - Definición jerárquica por sectores
 *   - Códigos únicos de identificación
 *   - Coordenadas geográficas
 *   - Asignación de personal y vehículos
 */
router.use("/cuadrantes", cuadrantesRoutes);

/**
 * @route   /catalogos
 * @desc    Catálogos generales del sistema
 * @access  Autenticado
 */
router.use("/catalogos", catalogosRoutes);

/**
 * @route   /cargos
 * @desc    Gestión de cargos del personal de seguridad
 * @access  Supervisor, Admin
 * @features
 *   - CRUD completo
 *   - Jerarquías organizacionales
 *   - Niveles de autoridad
 * @version 1.0.0
 * @new true
 */
router.use("/cargos", cargosRoutes);

/**
 * @route   /tipos-novedad
 * @desc    Gestión de tipos de novedades (categorías principales)
 * @access  Supervisor, Admin
 * @new true
 */
router.use("/tipos-novedad", tipoNovedadRoutes);

/**
 * @route   /subtipos-novedad
 * @desc    Gestión de subtipos de novedades (subcategorías)
 * @access  Supervisor, Admin
 * @new true
 */
router.use("/subtipos-novedad", subtipoNovedadRoutes);

/**
 * @route   /estados-novedad
 * @desc    Gestión de estados de workflow de novedades
 * @access  Supervisor, Admin
 * @new true
 */
router.use("/estados-novedad", estadoNovedadRoutes);

/**
 * @route   /ubigeo
 * @desc    Consulta de UBIGEO (Perú: departamentos, provincias, distritos)
 * @access  Autenticado
 */
// router.use("/ubigeo", ubigeoRoutes); // ⚠️ TEMPORAL - Comentado para debug

/**
 * @route   /auditoria
 * @desc    Registros de auditoría del sistema
 * @access  Admin, Super Admin
 * @features
 *   - Trazabilidad completa
 *   - Registro automático de acciones
 *   - Filtros avanzados
 */
router.use("/auditoria", auditoriaAccionRoutes);

// ============================================================================
// 🛣️ RUTAS DEL MÓDULO CALLES Y DIRECCIONES v2.4.0 ✨
// ============================================================================

/**
 * @route   /tipos-via
 * @desc    Gestión del catálogo de tipos de vía (Av, Jr, Ca, Pj, etc.)
 * @access  Mixto (público para /activos, protegido para CRUD)
 * @version 2.2.2
 *
 * @features
 *   ✅ Catálogo maestro de tipos de vía
 *   ✅ Códigos y abreviaturas estándar
 *   ✅ Ordenamiento personalizable
 *   ✅ Endpoint público para formularios
 *   ✅ Soft delete
 *
 * @permissions (4)
 *   - calles.tipos_via.read     → Todos autenticados
 *   - calles.tipos_via.create   → Supervisor, Super Admin
 *   - calles.tipos_via.update   → Supervisor, Super Admin
 *   - calles.tipos_via.delete   → Super Admin
 *
 * @endpoints (8)
 *   - GET    /tipos-via/activos           → PÚBLICO (sin auth)
 *   - GET    /tipos-via                   → Listar con filtros
 *   - GET    /tipos-via/:id               → Obtener por ID
 *   - POST   /tipos-via                   → Crear nuevo
 *   - PUT    /tipos-via/:id               → Actualizar
 *   - PATCH  /tipos-via/:id/activar       → Activar tipo
 *   - PATCH  /tipos-via/:id/desactivar    → Desactivar tipo
 *   - DELETE /tipos-via/:id               → Eliminar (soft)
 *
 * @examples
 *   GET  /api/v1/tipos-via/activos
 *   POST /api/v1/tipos-via
 *   Body: { "codigo": "AV", "nombre": "Avenida", "abreviatura": "Av." }
 */
router.use("/tipos-via", tiposViaRoutes);

/**
 * @route   /calles
 * @desc    Gestión del maestro de calles del distrito
 * @access  Protegido (requiere autenticación)
 * @version 2.2.2
 *
 * @features
 *   ✅ Registro completo de calles
 *   ✅ Características físicas (longitud, ancho, carriles)
 *   ✅ Tipo de pavimento y sentido de vía
 *   ✅ Clasificación (arterial, colectora, local)
 *   ✅ Búsqueda y autocomplete
 *   ✅ Filtros por urbanización
 *   ✅ Relación con cuadrantes
 *   ✅ Relación con direcciones
 *
 * @permissions (4)
 *   - calles.calles.read     → Todos autenticados
 *   - calles.calles.create   → Operador, Supervisor, Super Admin
 *   - calles.calles.update   → Supervisor, Super Admin
 *   - calles.calles.delete   → Super Admin
 *
 * @endpoints (10)
 *   - GET    /calles/activas                    → Calles activas (select)
 *   - GET    /calles/autocomplete?q=ejerc       → Búsqueda rápida
 *   - GET    /calles/urbanizacion/:nombre       → Por urbanización
 *   - GET    /calles                            → Listar con filtros
 *   - GET    /calles/:id                        → Obtener por ID
 *   - GET    /calles/:id/cuadrantes             → Cuadrantes de la calle
 *   - GET    /calles/:id/direcciones            → Direcciones de la calle
 *   - POST   /calles                            → Crear nueva
 *   - PUT    /calles/:id                        → Actualizar
 *   - DELETE /calles/:id                        → Eliminar (soft)
 *
 * @validations
 *   - Nombre único por tipo de vía
 *   - No eliminar si tiene direcciones activas
 *   - Autocomplete requiere mínimo 2 caracteres
 *
 * @examples
 *   GET  /api/v1/calles/autocomplete?q=ejerc&limit=10
 *   POST /api/v1/calles
 *   Body: {
 *     "tipo_via_id": 1,
 *     "nombre_via": "Ejército",
 *     "longitud_metros": 3500,
 *     "categoria_via": "ARTERIAL"
 *   }
 */
router.use("/calles", callesRoutes);

/**
 * @route   /calles-cuadrantes
 * @desc    Gestión de relaciones entre calles y cuadrantes con rangos de numeración
 * @access  Protegido (requiere autenticación)
 * @version 2.2.2
 *
 * @features
 *   ✅ Mapeo calle → cuadrante
 *   ✅ Rangos de numeración (inicio-fin)
 *   ✅ Especificación de lado (izquierda/derecha/ambos)
 *   ✅ Validación de solapamiento de rangos
 *   ✅ Prioridad en caso de múltiples cuadrantes
 *   ✅ Búsqueda de cuadrante por número (auto-asignación)
 *
 * @permissions (4)
 *   - calles.calles_cuadrantes.read     → Todos autenticados
 *   - calles.calles_cuadrantes.create   → Operador, Supervisor, Super Admin
 *   - calles.calles_cuadrantes.update   → Supervisor, Super Admin
 *   - calles.calles_cuadrantes.delete   → Super Admin
 *
 * @endpoints (7)
 *   - GET    /calles-cuadrantes                   → Listar todas
 *   - GET    /calles-cuadrantes/calle/:id         → Por calle
 *   - GET    /calles-cuadrantes/cuadrante/:id     → Por cuadrante
 *   - POST   /calles-cuadrantes/buscar-cuadrante  → Auto-asignación ⭐
 *   - GET    /calles-cuadrantes/:id               → Obtener por ID
 *   - POST   /calles-cuadrantes                   → Crear relación
 *   - PUT    /calles-cuadrantes/:id               → Actualizar
 *   - DELETE /calles-cuadrantes/:id               → Eliminar
 *
 * @endpoint_especial POST /buscar-cuadrante
 *   Función: Encuentra el cuadrante correcto dado una calle y número
 *   Uso: Auto-asignación en direcciones
 *   Input: { "calle_id": 1, "numero": 450 }
 *   Output: { "cuadrante_id": 12, "sector_id": 3, ... }
 *   Permisos: calles.calles_cuadrantes.read O calles.direcciones.create
 *
 * @validations
 *   - numero_fin >= numero_inicio
 *   - No solapamiento de rangos en misma calle
 *   - Relación calle+cuadrante única
 *
 * @examples
 *   POST /api/v1/calles-cuadrantes
 *   Body: {
 *     "calle_id": 1,
 *     "cuadrante_id": 12,
 *     "numero_inicio": 100,
 *     "numero_fin": 299,
 *     "lado": "AMBOS"
 *   }
 *
 *   POST /api/v1/calles-cuadrantes/buscar-cuadrante
 *   Body: { "calle_id": 1, "numero": 450 }
 *   Response: { "cuadrante_id": 12, "sector_id": 3 }
 */
router.use("/calles-cuadrantes", callesCuadrantesRoutes);

/**
 * @route   /direcciones
 * @desc    Gestión de direcciones normalizadas con sistema dual de direccionamiento
 * @access  Protegido (requiere autenticación)
 * @version 2.2.2
 *
 * @features
 *   ✅ Sistema DUAL de direccionamiento:
 *      • Numeración municipal: "Av. Ejército 450"
 *      • Sistema Mz/Lote: "Mz M Lote 15"
 *      • Ambos simultáneos: "450 - Mz M Lote 15"
 *   ✅ Auto-asignación inteligente:
 *      • Cuadrante automático según calle + número
 *      • Sector automático derivado del cuadrante
 *   ✅ Geocodificación GPS:
 *      • Coordenadas (latitud/longitud)
 *      • Fuente de geocodificación
 *      • Endpoint especializado PATCH /geocodificar
 *   ✅ Complementos:
 *      • Departamento, interior, piso
 *      • Referencias adicionales
 *      • Urbanización opcional
 *   ✅ Validación sin guardar (endpoint /validar)
 *   ✅ Estadísticas de uso (hot spots)
 *
 * @permissions (5)
 *   - calles.direcciones.read          → Todos autenticados
 *   - calles.direcciones.create        → Operador, Supervisor, Super Admin
 *   - calles.direcciones.update        → Supervisor, Super Admin
 *   - calles.direcciones.delete        → Super Admin
 *   - calles.direcciones.geocodificar  → Operador, Supervisor, Super Admin ⭐
 *
 * @endpoints (13)
 *   - GET    /direcciones/activas              → Direcciones activas
 *   - GET    /direcciones/search               → Búsqueda avanzada
 *   - GET    /direcciones/stats/mas-usadas     → Hot spots (requiere supervisor)
 *   - POST   /direcciones/validar              → Validar sin guardar ⭐
 *   - GET    /direcciones                      → Listar con filtros
 *   - GET    /direcciones/:id                  → Obtener por ID
 *   - POST   /direcciones                      → Crear dirección ⭐
 *   - PUT    /direcciones/:id                  → Actualizar
 *   - PATCH  /direcciones/:id/geocodificar     → Actualizar GPS ⭐
 *   - DELETE /direcciones/:id                  → Eliminar (soft)
 *
 * @endpoints_especiales
 *
 *   1. POST /validar
 *      Valida dirección SIN guardar en BD
 *      Retorna cuadrante_id y sector_id que se asignarían
 *      Útil para formularios con preview
 *      Input: { "calle_id": 1, "numero_municipal": "450" }
 *      Output: { "valida": true, "cuadrante_id": 12, "sector_id": 3 }
 *
 *   2. PATCH /:id/geocodificar
 *      Actualiza SOLO coordenadas GPS
 *      No modifica otros campos de la dirección
 *      Requiere permiso especial: calles.direcciones.geocodificar
 *      Input: { "latitud": -12.046378, "longitud": -77.030664, "fuente": "Google Maps" }
 *
 *   3. GET /stats/mas-usadas
 *      Retorna direcciones con más novedades (hot spots)
 *      Requiere rol supervisor o super_admin
 *      Útil para análisis de zonas críticas
 *
 * @sistema_dual Numeración Municipal vs Mz/Lote
 *
 *   OPCIÓN 1: Solo numeración municipal
 *   {
 *     "calle_id": 1,
 *     "numero_municipal": "450",
 *     "tipo_complemento": "DEPTO",
 *     "numero_complemento": "201"
 *   }
 *   Resultado: "Av. Ejército 450 Depto 201"
 *   Auto-asignación: ✅ cuadrante + sector
 *
 *   OPCIÓN 2: Solo Mz/Lote
 *   {
 *     "calle_id": 1,
 *     "manzana": "M",
 *     "lote": "15",
 *     "urbanizacion": "AAHH Los Laureles"
 *   }
 *   Resultado: "Av. Ejército Mz M Lote 15 - AAHH Los Laureles"
 *   Auto-asignación: ⚠️ Requiere relación calle-cuadrante sin rango
 *
 *   OPCIÓN 3: Sistema dual (ambos)
 *   {
 *     "calle_id": 1,
 *     "numero_municipal": "250",
 *     "manzana": "M",
 *     "lote": "08",
 *     "urbanizacion": "Urb. San Martín"
 *   }
 *   Resultado: "Av. Ejército 250 - Mz M Lote 08 - Urb. San Martín"
 *   Auto-asignación: ✅ cuadrante + sector (usa numero_municipal)
 *
 * @validations
 *   - Debe tener numero_municipal O (manzana + lote)
 *   - Si tiene numero_municipal, debe existir relación calle-cuadrante con rango
 *   - Coordenadas GPS: -90 a 90 (lat), -180 a 180 (lon)
 *   - No eliminar si tiene novedades asociadas
 *
 * @auto_asignacion Flujo de auto-asignación
 *   1. Usuario crea dirección con calle_id + numero_municipal
 *   2. Sistema busca en calles_cuadrantes la relación que contenga ese número
 *   3. Sistema obtiene cuadrante_id de la relación
 *   4. Sistema obtiene sector_id del cuadrante
 *   5. Sistema guarda dirección con ambos IDs asignados
 *   6. Si se actualiza calle_id o numero_municipal, se recalcula automáticamente
 *
 * @examples
 *   # Crear con numeración municipal
 *   POST /api/v1/direcciones
 *   {
 *     "calle_id": 1,
 *     "numero_municipal": "450",
 *     "referencia": "Frente al parque"
 *   }
 *   Response: { "id": 123, "cuadrante_id": 12, "sector_id": 3, ... }
 *
 *   # Crear con Mz/Lote
 *   POST /api/v1/direcciones
 *   {
 *     "calle_id": 1,
 *     "manzana": "M",
 *     "lote": "15",
 *     "urbanizacion": "AAHH Los Laureles"
 *   }
 *
 *   # Geocodificar
 *   PATCH /api/v1/direcciones/123/geocodificar
 *   {
 *     "latitud": -12.046378,
 *     "longitud": -77.030664,
 *     "fuente": "Google Maps"
 *   }
 *
 *   # Validar antes de guardar
 *   POST /api/v1/direcciones/validar
 *   {
 *     "calle_id": 1,
 *     "numero_municipal": "450"
 *   }
 *   Response: {
 *     "valida": true,
 *     "cuadrante_id": 12,
 *     "sector_id": 3,
 *     "direccion_formateada": "Av. Ejército 450"
 *   }
 */
router.use("/direcciones", direccionesRoutes);

//=============================================
// RUTA DE HEALTH CHECK
//=============================================

/**
 * @route   GET /health
 * @desc    Verificar estado del servidor y servicios
 * @access  Público
 * @returns {Object} Estado detallado del sistema
 */
router.get("/health", async (req, res) => {
  try {
    // Verificar conexión a base de datos
    const { sequelize } = await import("../models/index.js");
    await sequelize.authenticate();

    const dbStatus = {
      connected: true,
      type: sequelize.config.dialect,
      host: sequelize.config.host,
      database: sequelize.config.database,
    };

    res.status(200).json({
      success: true,
      message: "API funcionando correctamente",
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "v1",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime()), // En segundos
      database: dbStatus,
      memory: {
        usage:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        unit: "MB",
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Servicio no disponible",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

//=============================================
// RUTA RAÍZ - INFORMACIÓN DE LA API
//=============================================

/**
 * @route   GET /
 * @desc    Información general de la API y módulos disponibles
 * @access  Público
 * @returns {Object} Metadata de la API
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    name: "API de Seguridad Ciudadana",
    version: process.env.API_VERSION || "2.4.0",
    description: "Sistema integral de gestión de seguridad ciudadana municipal",
    environment: process.env.NODE_ENV || "development",
    documentation: "/api/v1/docs",
    timestamp: new Date().toISOString(),

    modules: {
      auth: {
        path: "/auth",
        description: "Autenticación y gestión de sesiones",
        public: true,
        endpoints: 8,
      },
      usuarios: {
        path: "/usuarios",
        description: "Gestión de usuarios del sistema",
        public: false,
        roles: ["admin", "supervisor"],
      },
      personal: {
        path: "/personal",
        description: "Gestión de personal de seguridad",
        public: false,
        endpoints: 20,
        features: ["CRUD", "Licencias", "Asignación Vehículos", "Estadísticas"],
      },
      novedades: {
        path: "/novedades",
        description: "Gestión de novedades e incidentes",
        public: false,
        endpoints: 8,
      },
      vehiculos: {
        path: "/vehiculos",
        description: "Gestión de vehículos y flota",
        public: false,
        endpoints: 8,
      },
      sectores: {
        path: "/sectores",
        description: "Gestión de sectores de vigilancia",
        public: false,
      },
      cuadrantes: {
        path: "/cuadrantes",
        description: "Gestión de cuadrantes de patrullaje",
        public: false,
      },
      cargos: {
        path: "/cargos",
        description: "Gestión de cargos del personal",
        public: false,
        endpoints: 9,
        version: "1.0.0",
      },
      // ✨ MÓDULO CALLES Y DIRECCIONES v2.4.0
      tiposVia: {
        path: "/tipos-via",
        description: "Catálogo de tipos de vía (Av, Jr, Ca, etc.)",
        public: false, // /activos es público, el resto requiere auth
        endpoints: 8,
        version: "2.2.2",
        new: true,
        features: ["Catálogo maestro", "Endpoint público", "Soft delete"],
      },
      calles: {
        path: "/calles",
        description: "Maestro de calles del distrito",
        public: false,
        endpoints: 10,
        version: "2.2.2",
        new: true,
        features: [
          "CRUD completo",
          "Autocomplete",
          "Filtros avanzados",
          "Relación con cuadrantes",
        ],
      },
      callesCuadrantes: {
        path: "/calles-cuadrantes",
        description: "Relaciones calle-cuadrante con rangos de numeración",
        public: false,
        endpoints: 7,
        version: "2.2.2",
        new: true,
        features: [
          "Rangos de numeración",
          "Auto-asignación",
          "Validación de solapamiento",
        ],
      },
      direcciones: {
        path: "/direcciones",
        description: "Direcciones normalizadas con sistema dual",
        public: false,
        endpoints: 13,
        version: "2.2.2",
        new: true,
        features: [
          "Sistema dual (Municipal + Mz/Lote)",
          "Auto-asignación cuadrante/sector",
          "Geocodificación GPS",
          "Validación previa",
          "Estadísticas (hot spots)",
        ],
      },
      catalogos: {
        path: "/catalogos",
        description: "Catálogos del sistema",
        public: false,
      },
      roles: {
        path: "/roles",
        description: "Gestión de roles (RBAC)",
        public: false,
      },
      permisos: {
        path: "/permisos",
        description: "Gestión de permisos granulares",
        public: false,
      },
      auditoria: {
        path: "/auditoria",
        description: "Registros de auditoría",
        public: false,
      },
    },

    stats: {
      totalModules: 16, // ✅ Actualizado: +4 módulos nuevos
      totalEndpoints: "140+", // ✅ Actualizado: +40 endpoints nuevos
      activeModules: 15,
      newModules: ["tipos-via", "calles", "calles-cuadrantes", "direcciones"], // ✨ NUEVO
      futureModules: ["reportes"],
    },

    // ✨ NUEVO: Información del módulo Calles
    moduloCalles: {
      version: "2.4.0",
      descripcion: "Módulo completo de calles y direcciones normalizadas",
      recursos: 4,
      permisos: 17,
      endpoints: 40,
      caracteristicas: [
        "Sistema dual de direccionamiento",
        "Auto-asignación de cuadrante y sector",
        "Geocodificación GPS",
        "Validación sin guardar",
        "Estadísticas de uso",
      ],
      documentacion: "/api/v1/docs#calles",
    },

    contact: {
      support: "soporte@serenazgo.gob.pe",
      documentation: "https://docs.serenazgo.gob.pe",
      repository: "https://github.com/RomilyOaks/city_sec_backend_claude",
    },
  });
});

//=============================================
// MANEJADOR DE RUTAS NO ENCONTRADAS (404)
//=============================================

/**
 * Middleware para capturar rutas no encontradas
 * DEBE estar DESPUÉS de todas las rutas válidas
 *
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: "Verifique la documentación en /api/v1",

    availableRoutes: [
      "/auth",
      "/usuarios",
      "/personal",
      "/novedades",
      "/vehiculos",
      "/sectores",
      "/cuadrantes",
      "/catalogos",
      "/cargos",
      "/tipos-novedad",
      "/subtipos-novedad",
      "/estados-novedad",
      "/tipos-via", // ✨ ✅ v2.4.0
      "/calles", // ✨ ✅ v2.4.0
      "/calles-cuadrantes", // ✨ ✅ v2.4.0
      "/direcciones", // ✨ ✅ v2.4.0
      "/roles",
      "/permisos",
      "/auditoria",
      "/health",
    ],

    helpLinks: {
      documentation: "/api/v1",
      health: "/api/v1/health",
    },
  });
});

//=============================================
// EXPORTAR ROUTER
//=============================================

export default router;
