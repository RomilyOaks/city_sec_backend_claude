# 📊 Estadísticas por Prioridades - Novedades No Atendidas

## 🎯 **Resumen**

El endpoint `/api/v1/reportes-operativos/no-atendidas` ahora incluye estadísticas detalladas por prioridades con sus colores asociados para facilitar la visualización en el frontend.

## 📋 **Endpoint**

```
GET /api/v1/reportes-operativos/no-atendidas
```

### **Parámetros Opcionales:**
- `page`: Número de página (default: 1)
- `limit`: Límite de resultados por página (default: 50, max: 1000)
- `fecha_inicio`: Fecha de inicio (formato: YYYY-MM-DD)
- `fecha_fin`: Fecha de fin (formato: YYYY-MM-DD)
- `sort`: Campo de ordenamiento (default: fecha_hora_ocurrencia)
- `order`: Dirección de ordenamiento (default: DESC)

## 🎨 **Estructura de Respuesta**

### **Campo Nuevo: `estadisticas_prioridades`**

```json
{
  "success": true,
  "message": "Novedades no atendidas obtenidas exitosamente",
  "data": [...],
  "timestamp": "2026-05-02T18:01:58.550Z",
  "pagination": {...},
  "filters_applied": {...},
  "query_info": {...},
  "total_records": 2,
  "estadisticas_prioridades": {
    "ALTA": {
      "count": 5,
      "color": "rojo",
      "novedades": [
        {
          "id": 89,
          "novedad_code": "0000000015",
          "tipo_subtipo_novedad": "HURTO AGRAVADO / ROBO",
          "fecha_hora_ocurrencia": "2026-04-29 14:57:00",
          "nombre_sector": "SECTOR 3 - MATEO PUMACAHUA",
          "localizacion": "Calle Belen Mz. J Lt. 10"
        }
        // ... más novedades ALTA
      ]
    },
    "MEDIA": {
      "count": 2,
      "color": "ambar",
      "novedades": [
        // ... novedades MEDIA
      ]
    },
    "BAJA": {
      "count": 2,
      "color": "verde",
      "novedades": [
        // ... novedades BAJA
      ]
    }
  }
}
```

## 🎨 **Colores Asociados**

| Prioridad | Color | Código HEX | Uso Recomendado |
|-----------|--------|------------|------------------|
| **ALTA** | rojo | `#DC2626` | Prioridad crítica, acción inmediata |
| **MEDIA** | ambar | `#D97706` | Prioridad moderada, atención oportuna |
| **BAJA** | verde | `#16A34A` | Prioridad baja, atención programada |
| **SIN_PRIORIDAD** | gris | `#6B7280` | Sin prioridad definida |

## 📊 **Componentes Sugeridos para Frontend**

### **1. Tarjeta de Estadísticas**
```jsx
const EstadisticasCard = ({ estadisticas }) => {
  const total = Object.values(estadisticas).reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(estadisticas).map(([prioridad, data]) => (
        <div 
          key={prioridad}
          className={`p-4 rounded-lg border-2 ${
            data.color === 'rojo' ? 'border-red-600 bg-red-50' :
            data.color === 'ambar' ? 'border-amber-600 bg-amber-50' :
            data.color === 'verde' ? 'border-green-600 bg-green-50' :
            'border-gray-600 bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-lg ${
              data.color === 'rojo' ? 'text-red-700' :
              data.color === 'ambar' ? 'text-amber-700' :
              data.color === 'verde' ? 'text-green-700' :
              'text-gray-700'
            }`}>
              {prioridad}
            </h3>
            <span className={`text-2xl font-bold ${
              data.color === 'rojo' ? 'text-red-600' :
              data.color === 'ambar' ? 'text-amber-600' :
              data.color === 'verde' ? 'text-green-600' :
              'text-gray-600'
            }`}>
              {data.count}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {((data.count / total) * 100).toFixed(1)}% del total
          </div>
        </div>
      ))}
    </div>
  );
};
```

### **2. Gráfico de Pastel**
```jsx
const PrioridadesPieChart = ({ estadisticas }) => {
  const chartData = Object.entries(estadisticas).map(([prioridad, data]) => ({
    name: prioridad,
    value: data.count,
    color: data.color === 'rojo' ? '#DC2626' :
           data.color === 'ambar' ? '#D97706' :
           data.color === 'verde' ? '#16A34A' : '#6B7280'
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Distribución por Prioridades</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### **3. Lista Detallada por Prioridad**
```jsx
const ListaPorPrioridad = ({ estadisticas }) => {
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState(null);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Novedades por Prioridad</h3>
      </div>
      
      <div className="divide-y">
        {Object.entries(estadisticas).map(([prioridad, data]) => (
          <div key={prioridad} className="p-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setPrioridadSeleccionada(
                prioridadSeleccionada === prioridad ? null : prioridad
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  data.color === 'rojo' ? 'bg-red-600' :
                  data.color === 'ambar' ? 'bg-amber-600' :
                  data.color === 'verde' ? 'bg-green-600' :
                  'bg-gray-600'
                }`} />
                <span className="font-medium">{prioridad}</span>
                <span className="text-gray-500">({data.count} novedades)</span>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  prioridadSeleccionada === prioridad ? 'rotate-180' : ''
                }`}
              />
            </div>
            
            {prioridadSeleccionada === prioridad && (
              <div className="mt-4 space-y-2">
                {data.novedades.map((novedad) => (
                  <div key={novedad.id} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{novedad.novedad_code}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {novedad.tipo_subtipo_novedad}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {novedad.nombre_sector} • {novedad.localizacion}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {new Date(novedad.fecha_hora_ocurrencia).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎯 **Implementación Completa**

### **Componente Principal**
```jsx
import React, { useState, useEffect } from 'react';
import EstadisticasCard from './EstadisticasCard';
import PrioridadesPieChart from './PrioridadesPieChart';
import ListaPorPrioridad from './ListaPorPrioridad';

const NovedadesNoAtendidasPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/reportes-operativos/no-atendidas');
        setData(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (!data) return <div>Error al cargar datos</div>;

  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas */}
      <EstadisticasCard estadisticas={data.estadisticas_prioridades} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pastel */}
        <PrioridadesPieChart estadisticas={data.estadisticas_prioridades} />
        
        {/* Lista Detallada */}
        <ListaPorPrioridad estadisticas={data.estadisticas_prioridades} />
      </div>
    </div>
  );
};

export default NovedadesNoAtendidasPage;
```

## 📱 **Diseño Responsivo**

### **Mobile-First Approach**
- **Tarjetas:** Columna completa en mobile, 3 columnas en desktop
- **Gráfico:** Ancho completo, altura adaptable
- **Lista:** Collapsible para mejor UX en mobile

### **Accesibilidad**
- **Colores:** Complementados con texto y patrones
- **Contraste:** Mínimo 4.5:1 para WCAG AA
- **Navegación:** Keyboard-friendly

## 🔧 **Consideraciones Técnicas**

### **Performance**
```javascript
// Memoización para evitar re-renders innecesarios
const EstadisticasCard = React.memo(({ estadisticas }) => {
  // Component implementation
});

// useMemo para cálculos pesados
const total = useMemo(() => 
  Object.values(estadisticas).reduce((sum, item) => sum + item.count, 0),
  [estadisticas]
);
```

### **Error Handling**
```javascript
const useNovedadesNoAtendidas = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/reportes-operativos/no-atendidas');
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Error al cargar novedades');
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, refetch: fetchData };
};
```

## 🎨 **Guía de Estilos**

### **Tailwind CSS Classes**
```css
/* Colores de Prioridad */
.priority-alta { @apply bg-red-50 border-red-200 text-red-700; }
.priority-media { @apply bg-amber-50 border-amber-200 text-amber-700; }
.priority-baja { @apply bg-green-50 border-green-200 text-green-700; }

/* Estados */
.priority-alta-text { @apply text-red-600; }
.priority-media-text { @apply text-amber-600; }
.priority-baja-text { @apply text-green-600; }

/* Hover States */
.priority-card:hover { @apply shadow-md transform scale-105 transition-transform; }
```

## 📋 **Checklist de Implementación**

- [ ] **Tarjetas de estadísticas** con colores y porcentajes
- [ ] **Gráfico de pastel** interactivo con leyenda
- [ ] **Lista detallada** por prioridad con expand/collapse
- [ ] **Diseño responsivo** para mobile y desktop
- [ ] **Accesibilidad** con contrastes adecuados
- [ ] **Loading states** y error handling
- [ ] **Performance** con memoización
- [ ] **Testing** unitario y de integración

## 🚀 **Ejemplo de Uso**

```javascript
// Consumo del endpoint
const response = await fetch('/api/v1/reportes-operativos/no-atendidas?page=1&limit=10');
const data = await response.json();

// Acceso a estadísticas
console.log('Estadísticas:', data.estadisticas_prioridades);

// Ejemplo de resultado
{
  "ALTA": { "count": 5, "color": "rojo", "novedades": [...] },
  "MEDIA": { "count": 2, "color": "ambar", "novedades": [...] },
  "BAJA": { "count": 2, "color": "verde", "novedades": [...] }
}
```

---

**Última actualización:** Mayo 2026  
**Versión:** 1.0.0  
**Responsable:** Backend Team
