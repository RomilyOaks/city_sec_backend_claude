# 📊 Frontend: Tiempo de Respuesta de Novedades

## 🎯 **Objetivo**
Comparar el tiempo de respuesta real vs el tiempo estimado para cada novedad.

## 📋 **Datos Disponibles**

### **🔢 Campos recibidos del backend:**

```javascript
novedad: {
  // ... otros campos
  novedadSubtipoNovedad: {
    id: 15,
    nombre: "Robo con violencia",
    tiempo_respuesta_min: 30,  // ⭐ Tiempo estimado en minutos
    // ... otros campos
  },
  fecha_reporte: "2026-03-08 12:30:00",    // 🕐 Cuando se reportó
  fecha_despacho: "2026-03-08 12:32:00",    // 🚀 Cuando se despachó
  fecha_llegada: "2026-03-08 12:45:00",     // 📍 Cuando llegó al lugar
  fecha_atencion: "2026-03-08 13:15:00",    // ✅ Cuando se resolvió
}
```

## ⏱️ **Cálculo de Tiempos**

### **1. Tiempo de Respuesta Real:**
```javascript
const calcularTiempoRespuestaReal = (novedad) => {
  if (!novedad.fecha_reporte || !novedad.fecha_llegada) return null;
  
  const reporte = new Date(novedad.fecha_reporte);
  const llegada = new Date(novedad.fecha_llegada);
  
  return Math.floor((llegada - reporte) / (1000 * 60)); // minutos
};
```

### **2. Tiempo de Respuesta Estimado:**
```javascript
const getTiempoEstimado = (novedad) => {
  return novedad.novedadSubtipoNovedad?.tiempo_respuesta_min || null;
};
```

### **3. Comparación:**
```javascript
const analizarTiempoRespuesta = (novedad) => {
  const tiempoReal = calcularTiempoRespuestaReal(novedad);
  const tiempoEstimado = getTiempoEstimado(novedad);
  
  if (!tiempoReal || !tiempoEstimado) return null;
  
  const diferencia = tiempoReal - tiempoEstimado;
  const porcentajeExceso = (diferencia / tiempoEstimado) * 100;
  
  return {
    tiempo_real: tiempoReal,
    tiempo_estimado: tiempoEstimado,
    diferencia_min: diferencia,
    porcentaje_exceso: porcentajeExceso,
    estado: diferencia <= 0 ? '✅ A tiempo' : '⏰ Retrasado',
    color: diferencia <= 0 ? 'green' : 
           porcentajeExceso > 50 ? 'red' : 'orange'
  };
};
```

## 🎨 **Implementación UI**

### **Componente de Indicador:**
```jsx
const IndicadorTiempoRespuesta = ({ novedad }) => {
  const analisis = analizarTiempoRespuesta(novedad);
  
  if (!analisis) return null;
  
  return (
    <div className={`tiempo-indicador ${analisis.color}`}>
      <div className="tiempo-real">{analisis.tiempo_real} min</div>
      <div className="tiempo-estimado">vs {analisis.tiempo_estimado} min est.</div>
      {analisis.diferencia_min > 0 && (
        <div className="retraso">+{analisis.diferencia_min} min</div>
      )}
      <div className="estado">{analisis.estado}</div>
    </div>
  );
};
```

### **Estilos CSS:**
```css
.tiempo-indicador {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.tiempo-indicador.green {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.tiempo-indicador.orange {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.tiempo-indicador.red {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.tiempo-real {
  font-size: 16px;
  font-weight: bold;
}

.tiempo-estimado {
  font-size: 11px;
  opacity: 0.8;
}

.retraso {
  font-size: 11px;
  margin-top: 2px;
}
```

## 📊 **Casos de Uso**

### **1. En lista de novedades:**
```jsx
const ListaNovedades = ({ novedades }) => {
  return (
    <table>
      {novedades.map(novedad => (
        <tr key={novedad.id}>
          <td>{novedad.novedadSubtipoNovedad.nombre}</td>
          <td>
            <IndicadorTiempoRespuesta novedad={novedad} />
          </td>
          {/* ... otras columnas */}
        </tr>
      ))}
    </table>
  );
};
```

### **2. En detalle de novedad:**
```jsx
const DetalleNovedad = ({ novedad }) => {
  const analisis = analizarTiempoRespuesta(novedad);
  
  return (
    <div className="detalle-novedad">
      {/* ... otros detalles */}
      
      {analisis && (
        <div className="seccion-tiempo">
          <h3>⏱️ Análisis de Tiempo de Respuesta</h3>
          <div className="metricas">
            <div className="metrica">
              <span className="label">Tiempo Real:</span>
              <span className="valor">{analisis.tiempo_real} min</span>
            </div>
            <div className="metrica">
              <span className="label">Tiempo Estimado:</span>
              <span className="valor">{analisis.tiempo_estimado} min</span>
            </div>
            <div className="metrica">
              <span className="label">Diferencia:</span>
              <span className={`valor ${analisis.color}`}>
                {analisis.diferencia_min > 0 ? '+' : ''}{analisis.diferencia_min} min
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### **3. En dashboard de estadísticas:**
```javascript
const calcularEstadisticasTiempo = (novedades) => {
  const analisis = novedades
    .map(n => analizarTiempoRespuesta(n))
    .filter(Boolean);
    
  const aTiempo = analisis.filter(a => a.diferencia_min <= 0).length;
  const retrasadas = analisis.filter(a => a.diferencia_min > 0).length;
  
  return {
    total: analisis.length,
    a_tiempo: aTiempo,
    retrasadas: retrasadas,
    porcentaje_a_tiempo: (aTiempo / analisis.length) * 100,
    retraso_promedio: retrasadas > 0 
      ? retrasadas.reduce((sum, a) => sum + a.diferencia_min, 0) / retrasadas 
      : 0
  };
};
```

## ⚠️ **Consideraciones Importantes**

### **1. Fechas Requeridas:**
- `fecha_reporte` y `fecha_llegada` son necesarias para el cálculo
- Si alguna fecha es `null`, el indicador no se mostrará

### **2. Tiempo Estimado Opcional:**
- Algunos subtipos pueden no tener `tiempo_respuesta_min`
- Manejar estos casos con fallbacks

### **3. Timezone:**
- Todas las fechas vienen en formato Perú (UTC-5)
- No se necesita conversión de timezone

### **4. Estados de Novedad:**
- Considerar solo novedades con estado `DESPACHADA` o superior
- Novedades `PENDIENTE` no tienen tiempo de respuesta completo

## 🎯 **Mejoras Futuras**

### **1. Gráficos de Tendencia:**
- Histórico de tiempos de respuesta por tipo de novedad
- Comparación entre diferentes cuadrantes

### **2. Alertas:**
- Notificaciones cuando se excede el tiempo estimado
- Priorización visual de novedades críticas

### **3. Filtros:**
- Filtrar por rango de tiempo de respuesta
- Ordenar por mayor retraso

---

**📝 Nota:** Este campo `tiempo_respuesta_min` ahora está disponible en TODOS los endpoints que devuelven información de novedades y sus subtipos.
