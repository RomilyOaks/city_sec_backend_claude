# 📡 Plan de Trabajo — SSE Novedades en Tiempo Real
> **Fecha:** 04 de abril de 2026  
> **Proyecto:** CitySecure Backend + Frontend  
> **Tecnología:** Server-Sent Events (SSE)  
> **Objetivo:** El operador ve nuevas Novedades instantáneamente sin hacer refresh  
> **Tiempo estimado:** 2.5 horas

---

## 🎯 OBJETIVO
Implementar Server-Sent Events (SSE) para que las nuevas novedades aparezcan automáticamente en la página principal con estado PENDIENTE sin necesidad de refresh manual.

---

## 🏗️ ARQUITECTURA PROPUESTA
```
Voice Gateway/WhatsApp → POST /api/v1/novedades → MySQL
                ↓
        Backend emite evento SSE a todos los clientes conectados
                ↓
Frontend (React) recibe evento instantáneamente
                ↓
Lista de Novedades se actualiza automáticamente
```

---

## 📝 PLAN DE TRABAJO ESTRUCTURADO

### FASE 1 - BACKEND (Tiempo: ~45 min)

#### Paso 1.1: Crear SSE Manager (10 min)
- **Archivo:** `src/utils/sse-manager.js`
- **Función:** Gestionar conexiones SSE y broadcasting
- **Componentes:** addClient, removeClient, broadcastEvent

#### Paso 1.2: Agregar endpoint /stream (15 min)
- **Archivo:** `src/routes/v1/novedades.routes.js`
- **Función:** GET `/api/v1/novedades/stream`
- **Características:** Autenticación JWT, headers SSE, heartbeat

#### Paso 1.3: Integrar broadcast en controller (10 min)
- **Archivo:** `src/controllers/novedadesController.js`
- **Función:** Notificar después de crear novedad
- **Datos:** ID, código, tipo, descripción, prioridad, estado, ubicación

#### Paso 1.4: Ajustar autenticación SSE (10 min)
- **Middleware especial para token vía query param
- **Compatibilidad:** Header Authorization + query param

---

### FASE 2 - FRONTEND (Tiempo: ~60 min)

#### Paso 2.1: Crear hook useNovedadesStream (20 min)
- **Archivo:** `src/hooks/useNovedadesStream.js`
- **Función:** Conexión SSE con reconexión automática
- **Características:** Token JWT, reconexión, cleanup

#### Paso 2.2: Crear componente NovedadToast (20 min)
- **Archivo:** `src/components/novedades/NovedadToast.jsx`
- **Función:** Notificación visual de nueva novedad
- **Características:** Auto-cierre, colores por prioridad, animación

#### Paso 2.3: Integrar en NovedadesList (20 min)
- **Archivo:** `src/components/novedades/NovedadesList.jsx`
- **Función:** Usar hook y mostrar toast
- **Características:** Agregar al inicio de lista, notificación, sonido

---

### FASE 3 - TESTING Y CONFIGURACIÓN (Tiempo: ~30 min)

#### Paso 3.1: Testing Backend (10 min)
- Verificar endpoint `/stream` con curl
- Validar headers SSE y heartbeat
- Probar broadcastEvent

#### Paso 3.2: Testing Frontend (15 min)
- Verificar conexión SSE en consola
- Probar recepción de eventos
- Validar actualización de lista

#### Paso 3.3: Configuración Railway (5 min)
- Variables de entorno para SSE
- Configuración de proxy/timeout

---

## 🔧 ARCHIVOS A CREAR/MODIFICAR

### Backend:
```
city_sec_backend_claude/
├── src/utils/sse-manager.js                    ← CREAR
├── src/routes/v1/novedades.routes.js          ← MODIFICAR
└── src/controllers/novedadesController.js       ← MODIFICAR
```

### Frontend:
```
city_sec_frontend_v2/
├── src/hooks/useNovedadesStream.js           ← CREAR
├── src/components/novedades/NovedadToast.jsx  ← CREAR
└── src/components/novedades/NovedadesList.jsx  ← MODIFICAR
```

---

## ⏱️ CRONOGRAMA ESTIMADO

| Fase | Actividad | Tiempo |
|---|---|---|
| **Backend** | SSE Manager + Endpoint + Controller | 45 min |
| **Frontend** | Hook + Toast + Integración | 60 min |
| **Testing** | Pruebas completas + Config | 30 min |
| **Total** | **Implementación completa** | **~2.5 horas** |

---

## 🎯 RESULTADO ESPERADO

1. **Operador abre página de Novedades**
2. **Se conecta automáticamente al stream SSE**
3. **Llega nueva novedad por WhatsApp/Voice Gateway**
4. **Aparece instantáneamente en lista con estado PENDIENTE**
5. **Toast notifica visualmente al operador**
6. **Sin necesidad de refresh manual**

---

## 📝 NOTAS DE IMPLEMENTACIÓN

- **ESLint:** Aplicar después de cada paso
- **Testing:** Validar cada componente individualmente
- **Autenticación:** JWT via query param para EventSource
- **Reconexión:** Automática cada 5s si se pierde conexión
- **Heartbeat:** Cada 30s para mantener conexión viva

---

*Documento creado: 04 de abril de 2026*  
*CitySecure — Sistema de Gestión de Seguridad Ciudadana | Lima, Perú*
