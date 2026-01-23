# Fix: Creación de Turnos Operativos

## 🐛 Problema

El frontend recibía errores 400 al intentar crear turnos operativos desde la modal de despacho de novedades.

### Errores del Frontend
```javascript
// Error 1: supervisor_id null
{
  type: 'field',
  value: null,
  msg: 'El ID del supervisor es requerido.',
  path: 'supervisor_id',
  location: 'body'
}

// Error 2: estado inválido
{
  type: 'field',
  value: 1,
  msg: 'El estado no es válido.',
  path: 'estado',
  location: 'body'
}
```

## 🔍 Causa Raíz

### 1. **supervisor_id Faltante**
- El frontend no enviaba `supervisor_id` en el body
- El backend lo requería obligatoriamente
- El supervisor_id pertenece al sector, no al operativo

### 2. **Confusión de Campos estado**
- **`estado`**: ENUM("ACTIVO", "CERRADO", "ANULADO") - Estado operativo del turno
- **`estado_registro`**: TINYINT (1=activo, 0=soft-deleted) - Estado de registro
- Frontend enviaba `estado: 1` cuando debería enviar un valor del enum

## ✅ Solución Implementada

### 1. **Obtener supervisor_id Automáticamente**
```javascript
// En operativosTurnoController.js
let supervisorIdFinal = supervisor_id;
if (!supervisor_id && sector_id) {
  const sector = await Sector.findByPk(sector_id, {
    attributes: ['supervisor_id']
  });
  if (sector) {
    supervisorIdFinal = sector.supervisor_id;
  }
}
```

### 2. **Validación Flexible para supervisor_id**
```javascript
// En operativos-turno.routes.js
body("supervisor_id")
  .optional()  // ← Ahora es opcional
  .isInt()
  .withMessage("El ID del supervisor debe ser un número entero."),
```

### 3. **Validación Personalizada**
```javascript
// Asegurar que el sector tenga supervisor si no se proporciona
body("sector_id").custom(async (sector_id, { req }) => {
  if (!req.body.supervisor_id) {
    const sector = await Sector.findByPk(sector_id);
    if (!sector.supervisor_id) {
      throw new Error("El sector no tiene un supervisor asignado.");
    }
  }
  return true;
});
```

### 4. **Corrección de Validación estado**
```javascript
// Hacer estado opcional con mensaje claro
body("estado")
  .optional()
  .isIn(["ACTIVO", "CERRADO", "ANULADO"])
  .withMessage("El estado debe ser uno de: ACTIVO, CERRADO, ANULADO."),
```

## 📊 Estructura de Datos

### Modelo OperativosTurno
```javascript
{
  // Campos principales
  operador_id: INTEGER,           // Personal asignado
  supervisor_id: INTEGER,         // Supervisor del sector
  sector_id: INTEGER,             // Sector de patrullaje
  
  // Estado operativo
  estado: ENUM("ACTIVO", "CERRADO", "ANULADO"),  // ← ESTE CAMPO
  
  // Estado de registro
  estado_registro: TINYINT,       // 1=activo, 0=soft-deleted
  
  // Fechas
  fecha: DATEONLY,
  fecha_hora_inicio: DATE,
  fecha_hora_fin: DATE,
  
  // Otros
  turno: ENUM("MAÑANA", "TARDE", "NOCHE"),
  observaciones: STRING(500)
}
```

## 🎯 Impacto

### Antes del Fix
```javascript
// Frontend enviaba:
{
  sector_id: 1,
  estado: 1,  // ← INCORRECTO
  // supervisor_id: null  // ← FALTANTE
}

// Backend respondía:
{
  success: false,
  message: "Errores de validación",
  errors: [
    "El ID del supervisor es requerido.",
    "El estado no es válido."
  ]
}
```

### Después del Fix
```javascript
// Frontend puede enviar:
{
  sector_id: 1,
  // supervisor_id: opcional (se obtiene del sector)
  // estado: opcional (default "ACTIVO")
}

// Backend procesa:
{
  supervisor_id: 5,  // ← Obtenido del sector
  estado: "ACTIVO",  // ← Default del modelo
  // ... resto de campos
}
```

## 🚀 Testing

### Casos de Prueba

1. **Con supervisor_id explícito**
```bash
POST /api/v1/operativos
{
  "operador_id": 10,
  "supervisor_id": 5,  // ← Explícito
  "sector_id": 1,
  "fecha": "2026-01-22",
  "fecha_hora_inicio": "2026-01-22T08:00:00-05:00",
  "estado": "ACTIVO"
}
```

2. **Sin supervisor_id (sector con supervisor)**
```bash
POST /api/v1/operativos
{
  "operador_id": 10,
  // supervisor_id: omitido
  "sector_id": 1,  // ← Tiene supervisor_id = 5
  "fecha": "2026-01-22",
  "fecha_hora_inicio": "2026-01-22T08:00:00-05:00"
  // estado: omitido (default "ACTIVO")
}
```

3. **Sin supervisor_id (sector SIN supervisor)**
```bash
POST /api/v1/operativos
{
  "operador_id": 10,
  // supervisor_id: omitido
  "sector_id": 2,  // ← supervisor_id = null
  "fecha": "2026-01-22",
  "fecha_hora_inicio": "2026-01-22T08:00:00-05:00"
}
// Respuesta: 400 - "El sector no tiene un supervisor asignado"
```

## 📝 Notas Técnicas

- **Relación**: Sector → OperativosTurno (One-to-Many)
- **Auto-resolución**: supervisor_id se obtiene del sector_id
- **Defaults**: estado = "ACTIVO", estado_registro = 1
- **Validación**: Asegura integridad referencial
- **Frontend**: Puede omitir campos opcionales

---

**Fix implementado y probado exitosamente** ✅
**Fecha de implementación: 2026-01-22**
