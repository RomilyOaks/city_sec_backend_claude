# Postman Collection - CitySecure Abastecimiento Combustible

## Archivo creado:
- `CitySecure - Abastecimiento Combustible.postman_collection.json`

## Importar en Postman:

1. Abrir Postman
2. Click en **Import**
3. Seleccionar **File**
4. Elegir el archivo: `CitySecure - Abastecimiento Combustible.postman_collection.json`
5. Click en **Import**

## Configuración:

### Variables de Entorno:
- `baseUrl`: `http://localhost:3000/api/v1` (automática)
- `auth_token`: Se obtiene automáticamente al ejecutar el login
- `user_id`: ID del usuario (automático)
- `user_name`: Nombre de usuario (automático)

## Flujo de Uso:

### 1. Autenticación:
- Ejecutar **Login - Get Token** primero
- El token se guardará automáticamente en las variables de entorno

### 2. CRUD Operations:
- **GET - Listar Abastecimientos**: Lista todos los abastecimientos
- **GET - Obtener por ID**: Obtiene un abastecimiento específico
- **POST - Crear Abastecimiento**: Crea un nuevo registro
- **PUT - Actualizar Abastecimiento**: Actualiza un registro existente
- **DELETE - Eliminar Abastecimiento**: Soft delete de un registro

### 3. Tests y Filtros:
- **Filtrar por Vehículo**: `?vehiculo_id=1`
- **Filtrar por Fecha**: `?fecha_inicio=2026-04-01&fecha_fin=2026-04-30`
- **Filtrar por Personal**: `?personal_id=8`

## Campos del Modelo:

### Campos Obligatorios:
- `vehiculo_id`: ID del vehículo
- `fecha_hora`: Fecha y hora del abastecimiento
- `km_actual`: Kilometraje actual
- `cantidad`: Cantidad de combustible
- `precio_unitario`: Precio por unidad
- `importe_total`: Importe total
- `grifo_nombre`: Nombre del grifo

### Campos Opcionales:
- `tipo_combustible`: Tipo de combustible (GASOLINA_REGULAR, GASOLINA_PREMIUM, etc.)
- `unidad`: Unidad (LITROS o GALONES)
- `grifo_ruc`: RUC del grifo
- `factura_boleta`: Número de comprobante
- `moneda`: Moneda (PEN o USD)
- `observaciones`: Observaciones adicionales
- `comprobante_adjunto`: URL del comprobante

## Tipos de Combustible Disponibles:
- GASOLINA_REGULAR
- GASOLINA_PREMIUM
- GASOHOL_REGULAR
- GASOHOL_PREMIUM
- DIESEL_B2
- DIESEL_B5
- DIESEL_S50
- GLP
- GNV

## Ejemplo de Creación:
```json
{
    "vehiculo_id": 1,
    "fecha_hora": "2026-04-14T12:00:00.000Z",
    "tipo_combustible": "GASOLINA_REGULAR",
    "km_actual": 15000.50,
    "cantidad": 45.50,
    "precio_unitario": 18.50,
    "importe_total": 841.75,
    "grifo_nombre": "GRIFO REPSOL",
    "grifo_ruc": "20100070270",
    "factura_boleta": "F001-123456",
    "moneda": "PEN",
    "observaciones": "Abastecimiento de prueba"
}
```

## Notas:
- Todos los endpoints requieren autenticación con token JWT
- El token se obtiene automáticamente al ejecutar el login
- Los filtros se pueden combinar en la URL
- El DELETE es un soft delete (no elimina permanentemente)
