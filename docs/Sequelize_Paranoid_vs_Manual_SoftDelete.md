# 📚 Guía Completa: Sequelize Paranoid Mode vs Soft Delete Manual

## 🎯 **Introducción**

Esta guía explica las diferencias entre el modo `paranoid` automático de Sequelize y el soft delete manual, basada en la experiencia real implementando el CRUD de `horarios_turnos`.

---

## 🔧 **Configuración Ideal para Paranoid Mode**

### **📝 Estructura de Tabla Correcta**

```sql
CREATE TABLE `horarios_turnos` (
  `turno` enum('MAÑANA','TARDE','NOCHE') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `cruza_medianoche` tinyint NOT NULL DEFAULT '0',
  `estado` tinyint NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` int DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,  -- ✅ Campo para paranoid
  PRIMARY KEY (`turno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### **🎯 Configuración del Modelo Sequelize**

```javascript
const HorariosTurnos = sequelize.define("HorariosTurnos", {
  turno: {
    type: DataTypes.ENUM("MAÑANA", "TARDE", "NOCHE"),
    primaryKey: true,
    allowNull: false,
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  cruza_medianoche: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
  },
  estado: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  deleted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: "horarios_turnos",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  paranoid: true,        // ✅ Habilitar paranoid
  deletedAt: "deleted_at", // ✅ Mapear campo deleted_at
  underscored: true,     // ✅ Para snake_case
  hooks: {
    // ✅ Hook para deleted_by automático
    beforeDestroy: async (instance, options) => {
      if (options.user && !options.force) {
        instance.deleted_by = options.user.id;
        instance.deleted_at = new Date();
        await instance.save({ silent: true });
      }
    },
    // ✅ Hook para restore automático
    afterRestore: async (instance) => {
      instance.deleted_by = null;
      await instance.save({ silent: true });
    }
  }
});
```

---

## 🔄 **Cómo Funciona Paranoid Mode**

### **1. Soft Delete Automático**

```javascript
// Con paranoid: true, esto es suficiente:
await horario.destroy(); // Automáticamente establece deleted_at

// Sequelize internamente hace:
// UPDATE horarios_turnos SET deleted_at = NOW() WHERE turno = 'MAÑANA'
```

### **2. Restore Automático**

```javascript
// Restaurar registro eliminado:
await horario.restore(); // Automáticamente limpia deleted_at

// Sequelize internamente hace:
// UPDATE horarios_turnos SET deleted_at = NULL WHERE turno = 'MAÑANA'
```

### **3. Consultas Automáticas**

```javascript
// FindAll automáticamente excluye eliminados:
await HorariosTurnos.findAll(); // WHERE deleted_at IS NULL

// Para incluir eliminados:
await HorariosTurnos.findAll({ paranoid: false }); // Incluir todos

// Find específico con paranoid:
await HorariosTurnos.findByPk('MAÑANA'); // Solo si deleted_at IS NULL
await HorariosTurnos.findByPk('MAÑANA', { paranoid: false }); // Incluir eliminados
```

---

## 🎯 **Problema Real: Nuestro Caso**

### **❌ Configuración que Causó el Problema**

**Tabla (Simple):**
```sql
CREATE TABLE `horarios_turnos` (
  `turno` enum('MAÑANA','TARDE','NOCHE') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `cruza_medianoche` tinyint NOT NULL DEFAULT '0',
  `estado` tinyint NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_by` int DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,  -- ✅ Campo existe
  PRIMARY KEY (`turno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

**Modelo (Con Paranoid):**
```javascript
{
  paranoid: true,        // ✅ Habilitado
  deletedAt: "deleted_at", // ✅ Mapeado
}
```

**Resultado:** ❌ Conflicto entre ORM y base de datos

### **🔍 ¿Qué Pasaba Exactamente?**

1. **DELETE con `destroy()`:**
   ```javascript
   await horario.destroy(); // Intentaba soft delete automático
   ```
   - Sequelize esperaba manejar `deleted_at` automáticamente
   - Pero la tabla no tenía configuración paranoid a nivel DB
   - Resultado: `deleted_at` no se establecía correctamente

2. **REACTIVAR con `restore()`:**
   ```javascript
   await horario.restore(); // Intentaba limpiar deleted_at automáticamente
   ```
   - Sequelize esperaba limpiar `deleted_at` automáticamente
   - Pero no funcionaba con la configuración actual
   - Resultado: `deleted_at` mantenía la fecha

---

## ✅ **Solución Implementada: Soft Delete Manual**

### **🎯 Configuración Final**

**Modelo (Sin Paranoid):**
```javascript
{
  paranoid: false, // ❌ Desactivado - manejo manual
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
}
```

**Controlador (Manual):**
```javascript
// DELETE - Soft Delete Manual
export const deleteHorarioTurno = async (req, res) => {
  const { id: userId } = req.user;
  const { turno } = req.params;

  const horario = await HorariosTurnos.findByPk(turno);
  
  // Soft delete manual
  await horario.update({
    estado: 0,
    deleted_at: new Date(),    // ✅ Manual
    deleted_by: userId,        // ✅ Manual
    updated_by: userId,
    updated_at: new Date(),
  });
};

// REACTIVAR - Manual
HorariosTurnos.reactivar = async function (turno, userId) {
  const horario = await this.findByPk(turno);
  
  // Reactivar manualmente
  await horario.update({
    estado: 1,
    deleted_at: null,         // ✅ Manual
    deleted_by: null,         // ✅ Manual
    updated_by: userId,
    updated_at: new Date(),
  });
  
  return horario;
};
```

---

## 📚 **Mejores Prácticas Paranoid**

### **Hooks Avanzados para Auditoría**

```javascript
hooks: {
  beforeDestroy: async (instance, options) => {
    // Guardar quién elimina
    if (options.user && !options.force) {
      instance.deleted_by = options.user.id;
      instance.deleted_at = new Date();
      await instance.save({ silent: true });
    }
  },
  afterRestore: async (instance) => {
    // Limpiar auditoría al restaurar
    instance.deleted_by = null;
    await instance.save({ silent: true });
  },
  beforeBulkDestroy: async (options) => {
    // Para eliminaciones masivas
    options.individualHooks = true;
  }
}
```

### **Configuración Completa Recomendada**

```javascript
{
  paranoid: true,
  deletedAt: "deleted_at",
  underscored: true,
  freezeTableName: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_0900_ai_ci',
  indexes: [
    {
      unique: true,
      fields: ["turno"],
      name: "uq_horarios_turnos_turno",
    },
    {
      fields: ["deleted_at"],
      name: "idx_horarios_turnos_deleted_at",
    },
  ]
}
```

---

## 🆚 **Comparación: Paranoid vs Manual**

| Característica | Paranoid Mode | Soft Delete Manual |
|----------------|---------------|-------------------|
| **Configuración** | Simple en modelo | Requiere código extra |
| **Control** | Automático | Total control |
| **Flexibilidad** | Limitada | Máxima |
| **Consultas** | Automáticas | Manuales |
| **Auditoría** | Requiere hooks | Directa |
| **Debugging** | Difícil | Fácil |
| **Performance** | Optimizada | Similar |
| **Mantenimiento** | Bajo | Medio |

---

## 🎓 **Lecciones Aprendidas**

### **✅ Ventajas de Paranoid:**
1. **Automatización:** No necesitas recordar establecer `deleted_at`
2. **Consultas inteligentes:** Excluye eliminados automáticamente
3. **Restore nativo:** Método `restore()` incorporado
4. **Consistencia:** Mismo comportamiento en todos los modelos

### **❌ Desventajas de Paranoid:**
1. **Menos control:** No puedes customizar fácilmente
2. **Debugging difícil:** No ves qué pasa internamente
3. **Dependencia:** Requiere configuración específica
4. **Hooks complejos:** Auditoría requiere hooks avanzados

### **✅ Ventajas de Manual:**
1. **Control total:** Decides exactamente qué hacer
2. **Debugging fácil:** Ves cada paso
3. **Flexibilidad:** Puedes customizar completamente
4. **Independencia:** No depende de configuración específica

### **❌ Desventajas de Manual:**
1. **Más código:** Requiere implementación explícita
2. **Error humano:** Fácil olvidar algo
3. **Consultas manuales:** Debes recordar `paranoid: false`
4. **Mantenimiento:** Más código que mantener

---

## 🎯 **Recomendaciones Finales**

### **📈 Cuándo Usar Paranoid:**
- **Proyectos simples:** Con auditoría básica
- **Equipos grandes:** Para consistencia
- **CRUD estándar:** Sin customizaciones especiales
- **Rapidez:** Para desarrollo rápido

### **📊 Cuándo Usar Manual:**
- **Auditoría compleja:** Con múltiples campos de auditoría
- **Customizaciones:** Cuando necesitas control total
- **Debugging:** Cuando necesitas visibilidad completa
- **Integraciones:** Con sistemas externos

### **🎯 Nuestra Elección:**
Para `horarios_turnos`, elegimos **manual** porque:
- Necesitábamos control total sobre `deleted_by`
- La tabla ya existía sin configuración paranoid
- Queríamos debugging claro
- La auditoría era específica del negocio

---

## 🚀 **Implementación Híbrida (Opción Avanzada)**

Puedes combinar ambos enfoques:

```javascript
// Modelo con paranoid desactivado
{ paranoid: false }

// Helper class para soft delete
class SoftDeleteManager {
  static async softDelete(model, id, userId) {
    await model.update({
      estado: 0,
      deleted_at: new Date(),
      deleted_by: userId,
      updated_by: userId,
      updated_at: new Date(),
    }, { where: { id } });
  }
  
  static async restore(model, id, userId) {
    await model.update({
      estado: 1,
      deleted_at: null,
      deleted_by: null,
      updated_by: userId,
      updated_at: new Date(),
    }, { where: { id } });
  }
}

// Uso en controlador
await SoftDeleteManager.softDelete(HorariosTurnos, turno, userId);
await SoftDeleteManager.restore(HorariosTurnos, turno, userId);
```

---

## 📝 **Conclusión**

**Paranoid mode** es excelente para casos simples y estándar, pero **soft delete manual** te da control total cuando lo necesitas.

La clave es entender tus requisitos:
- **Simpleza → Paranoid**
- **Control → Manual**
- **Mantenimiento → Elige consistencia**

En nuestro caso, el soft delete manual fue la mejor elección por la necesidad de control total y debugging claro.

---

**📚 Recursos Adicionales:**
- [Sequelize Paranoid Documentation](https://sequelize.org/docs/v6/core-concepts/paranoid/)
- [Sequelize Hooks Guide](https://sequelize.org/docs/v6/other-topics/hooks/)
- [Soft Delete Best Practices](https://github.com/sequelize/sequelize/issues/8412)

---

*Documento creado por: Windsurf AI*  
*Supervisor: Romily Oaks*  
*Fecha: 2026-01-20*  
*Versión: 1.0.0*  
*Basado en experiencia real con horarios_turnos*
