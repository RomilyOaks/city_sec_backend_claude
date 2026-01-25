# 📻 Documentación Frontend - Radios TETRA

## 📋 Índice

1. [Información General](#información-general)
2. [Endpoints del Backend](#endpoints-del-backend)
3. [Interfaces TypeScript](#interfaces-typescript)
4. [Servicio API (Axios)](#servicio-api-axios)
5. [Custom Hook React](#custom-hook-react)
6. [Componentes Principales](#componentes-principales)
7. [Permisos RBAC](#permisos-rbac)
8. [Casos de Uso](#casos-de-uso)

---

## 🔍 Información General

**Módulo**: Radios TETRA
**Ruta Base**: `/api/v1/radios-tetra`
**Descripción**: Sistema de gestión de radios TETRA de comunicaciones para personal de seguridad ciudadana.

### Características

- ✅ CRUD completo de radios TETRA
- ✅ Asignación/desasignación a personal de seguridad
- ✅ Control de estado (activo/inactivo)
- ✅ Soft delete con auditoría
- ✅ Filtros avanzados (estado, asignación, búsqueda)
- ✅ Paginación
- ✅ Validaciones robustas
- ✅ RBAC integrado

### Datos del Radio

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `number` | ID único |
| `radio_tetra_code` | `string` | Código único del radio (max 10 chars) |
| `descripcion` | `string` | Descripción o modelo (max 50 chars) |
| `personal_seguridad_id` | `number \| null` | ID del personal asignado |
| `fecha_fabricacion` | `string` | Fecha de fabricación (YYYY-MM-DD) |
| `estado` | `boolean` | true=Activo, false=Inactivo |
| `created_at` | `string` | Fecha de creación |
| `updated_at` | `string` | Fecha de última actualización |
| `deleted_at` | `string \| null` | Fecha de eliminación (soft delete) |
| `created_by` | `number \| null` | ID del usuario creador |
| `updated_by` | `number \| null` | ID del usuario que actualizó |
| `deleted_by` | `number \| null` | ID del usuario que eliminó |

### Relaciones

```typescript
interface RadioTetra {
  // ... campos base
  personalAsignado?: {
    id: number;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    codigo_personal: string;
    rango?: string;
    telefono?: string;
  };
}
```

---

## 🔗 Endpoints del Backend

### 1. Listar Radios (Paginado con Filtros)

```http
GET /api/v1/radios-tetra
```

**Query Params**:
- `page` (number, default: 1): Número de página
- `limit` (number, default: 10, max: 100): Registros por página
- `search` (string): Búsqueda por código o descripción
- `estado` (boolean): Filtrar por estado (true/false)
- `asignado` (string): Filtrar por asignación (`true`, `false`, `all`)
- `personal_seguridad_id` (number): Filtrar por personal específico

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radios": [
      {
        "id": 1,
        "radio_tetra_code": "RT-001",
        "descripcion": "Motorola XTS 5000",
        "personal_seguridad_id": 5,
        "fecha_fabricacion": "2020-05-15",
        "estado": true,
        "created_at": "2025-01-01T10:00:00.000Z",
        "updated_at": "2025-01-05T14:30:00.000Z",
        "personalAsignado": {
          "id": 5,
          "nombres": "Carlos",
          "apellido_paterno": "Rodríguez",
          "apellido_materno": "Pérez",
          "codigo_personal": "SEG-001"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10
    }
  },
  "message": null
}
```

**Permisos Requeridos**: `radios_tetra.read`

---

### 2. Listar Radios Disponibles (Para Dropdowns)

```http
GET /api/v1/radios-tetra/disponibles
```

**Descripción**: Retorna solo radios sin asignar y activos.

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radios": [
      {
        "id": 3,
        "radio_tetra_code": "RT-003",
        "descripcion": "Hytera PD785",
        "estado": true,
        "personal_seguridad_id": null
      }
    ],
    "total": 12
  }
}
```

**Permisos Requeridos**: `radios_tetra.read` o `radios_tetra.create`

---

### 3. Obtener Radio por ID

```http
GET /api/v1/radios-tetra/:id
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radio": {
      "id": 1,
      "radio_tetra_code": "RT-001",
      "descripcion": "Motorola XTS 5000",
      "personal_seguridad_id": 5,
      "fecha_fabricacion": "2020-05-15",
      "estado": true,
      "personalAsignado": {
        "id": 5,
        "nombres": "Carlos",
        "apellido_paterno": "Rodríguez",
        "apellido_materno": "Pérez",
        "codigo_personal": "SEG-001",
        "rango": "Suboficial",
        "telefono": "987654321"
      }
    }
  }
}
```

**Errores**:
- `404`: Radio no encontrado

**Permisos Requeridos**: `radios_tetra.read`

---

### 4. Crear Radio

```http
POST /api/v1/radios-tetra
```

**Body**:
```json
{
  "radio_tetra_code": "RT-010",
  "descripcion": "Motorola DP4800",
  "personal_seguridad_id": null,
  "fecha_fabricacion": "2023-08-20",
  "estado": true
}
```

**Validaciones**:
- `radio_tetra_code`: opcional, 1-10 caracteres, alfanumérico + guiones
- `descripcion`: opcional, máx 50 caracteres
- `personal_seguridad_id`: opcional, entero positivo (debe existir)
- `fecha_fabricacion`: opcional, formato YYYY-MM-DD, no puede ser futura
- `estado`: opcional, boolean (default: true)

**Respuesta Exitosa** (201):
```json
{
  "success": true,
  "data": {
    "radio": {
      "id": 10,
      "radio_tetra_code": "RT-010",
      "descripcion": "Motorola DP4800",
      "personal_seguridad_id": null,
      "fecha_fabricacion": "2023-08-20",
      "estado": true,
      "created_at": "2026-01-06T18:00:00.000Z"
    }
  },
  "message": "Radio TETRA creado exitosamente"
}
```

**Errores**:
- `400`: Ya existe radio con ese código
- `400`: Error de validación
- `404`: Personal no encontrado

**Permisos Requeridos**: `radios_tetra.create`

---

### 5. Actualizar Radio

```http
PUT /api/v1/radios-tetra/:id
```

**Body** (todos los campos opcionales):
```json
{
  "radio_tetra_code": "RT-010-A",
  "descripcion": "Motorola DP4800 (Actualizado)",
  "personal_seguridad_id": 7,
  "fecha_fabricacion": "2023-08-20",
  "estado": true
}
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radio": {
      "id": 10,
      "radio_tetra_code": "RT-010-A",
      "descripcion": "Motorola DP4800 (Actualizado)",
      "personal_seguridad_id": 7,
      "personalAsignado": {
        "id": 7,
        "nombres": "Ana",
        "apellido_paterno": "García"
      }
    }
  },
  "message": "Radio TETRA actualizado exitosamente"
}
```

**Errores**:
- `404`: Radio no encontrado
- `400`: Código duplicado
- `404`: Personal no encontrado

**Permisos Requeridos**: `radios_tetra.update`

---

### 6. Eliminar Radio (Soft Delete)

```http
DELETE /api/v1/radios-tetra/:id
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": null,
  "message": "Radio TETRA eliminado exitosamente"
}
```

**Errores**:
- `404`: Radio no encontrado

**Permisos Requeridos**: `radios_tetra.delete`

---

### 7. Asignar Radio a Personal

```http
PATCH /api/v1/radios-tetra/:id/asignar
```

**Body**:
```json
{
  "personal_seguridad_id": 12
}
```

**Validaciones**:
- El radio NO debe estar ya asignado
- El radio debe estar activo
- El personal debe existir

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radio": {
      "id": 5,
      "radio_tetra_code": "RT-005",
      "personal_seguridad_id": 12,
      "personalAsignado": {
        "id": 12,
        "nombres": "Juan",
        "apellido_paterno": "Pérez"
      }
    }
  },
  "message": "Radio asignado exitosamente"
}
```

**Errores**:
- `400`: Radio ya asignado
- `400`: Radio inactivo
- `404`: Personal no encontrado

**Permisos Requeridos**: `radios_tetra.update` o `radios_tetra.asignar`

---

### 8. Desasignar Radio

```http
PATCH /api/v1/radios-tetra/:id/desasignar
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radio": {
      "id": 5,
      "radio_tetra_code": "RT-005",
      "personal_seguridad_id": null
    }
  },
  "message": "Radio desasignado exitosamente"
}
```

**Errores**:
- `400`: Radio no está asignado

**Permisos Requeridos**: `radios_tetra.update` o `radios_tetra.asignar`

---

### 9. Activar Radio

```http
PATCH /api/v1/radios-tetra/:id/activar
```

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radio": {
      "id": 8,
      "radio_tetra_code": "RT-008",
      "estado": true
    }
  },
  "message": "Radio activado exitosamente"
}
```

**Errores**:
- `400`: Radio ya está activo

**Permisos Requeridos**: `radios_tetra.update`

---

### 10. Desactivar Radio

```http
PATCH /api/v1/radios-tetra/:id/desactivar
```

**Validaciones**:
- El radio NO debe estar asignado a personal

**Respuesta Exitosa** (200):
```json
{
  "success": true,
  "data": {
    "radio": {
      "id": 8,
      "radio_tetra_code": "RT-008",
      "estado": false
    }
  },
  "message": "Radio desactivado exitosamente"
}
```

**Errores**:
- `400`: Radio está asignado (debe desasignarse primero)
- `400`: Radio ya está inactivo

**Permisos Requeridos**: `radios_tetra.update`

---

## 🔷 Interfaces TypeScript

```typescript
/**
 * ===================================================
 * INTERFACES - Radios TETRA
 * ===================================================
 */

/**
 * Interface principal del Radio TETRA
 */
export interface RadioTetra {
  id: number;
  radio_tetra_code: string;
  descripcion: string | null;
  personal_seguridad_id: number | null;
  fecha_fabricacion: string | null; // YYYY-MM-DD
  estado: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // Relación (opcional)
  personalAsignado?: PersonalAsignado;
}

/**
 * Datos del personal asignado
 */
export interface PersonalAsignado {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  codigo_personal: string;
  rango?: string;
  telefono?: string;
}

/**
 * Datos para crear un radio
 */
export interface CreateRadioTetraDTO {
  radio_tetra_code?: string;
  descripcion?: string;
  personal_seguridad_id?: number | null;
  fecha_fabricacion?: string; // YYYY-MM-DD
  estado?: boolean;
}

/**
 * Datos para actualizar un radio
 */
export interface UpdateRadioTetraDTO {
  radio_tetra_code?: string;
  descripcion?: string;
  personal_seguridad_id?: number | null;
  fecha_fabricacion?: string;
  estado?: boolean;
}

/**
 * Parámetros de filtro para listar radios
 */
export interface RadioTetraFilters {
  page?: number;
  limit?: number;
  search?: string;
  estado?: boolean;
  asignado?: 'true' | 'false' | 'all';
  personal_seguridad_id?: number;
}

/**
 * Respuesta paginada
 */
export interface RadioTetraPaginatedResponse {
  radios: RadioTetra[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Respuesta del backend
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

/**
 * Datos para asignar a personal
 */
export interface AsignarRadioDTO {
  personal_seguridad_id: number;
}
```

---

## 🔌 Servicio API (Axios)

```typescript
/**
 * ===================================================
 * SERVICIO API - Radios TETRA
 * ===================================================
 *
 * Archivo: src/services/radioTetraService.ts
 */

import axios, { AxiosInstance } from 'axios';
import {
  RadioTetra,
  RadioTetraFilters,
  RadioTetraPaginatedResponse,
  CreateRadioTetraDTO,
  UpdateRadioTetraDTO,
  AsignarRadioDTO,
  ApiResponse,
} from '@/types/radioTetra';

class RadioTetraService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token de autenticación
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Listar radios con filtros y paginación
   */
  async getRadios(filters?: RadioTetraFilters): Promise<RadioTetraPaginatedResponse> {
    const response = await this.api.get<ApiResponse<RadioTetraPaginatedResponse>>(
      '/radios-tetra',
      { params: filters }
    );
    return response.data.data;
  }

  /**
   * Listar radios disponibles (sin asignar y activos)
   */
  async getRadiosDisponibles(): Promise<RadioTetra[]> {
    const response = await this.api.get<ApiResponse<{ radios: RadioTetra[] }>>(
      '/radios-tetra/disponibles'
    );
    return response.data.data.radios;
  }

  /**
   * Obtener radio por ID
   */
  async getRadioById(id: number): Promise<RadioTetra> {
    const response = await this.api.get<ApiResponse<{ radio: RadioTetra }>>(
      `/radios-tetra/${id}`
    );
    return response.data.data.radio;
  }

  /**
   * Crear un nuevo radio
   */
  async createRadio(data: CreateRadioTetraDTO): Promise<RadioTetra> {
    const response = await this.api.post<ApiResponse<{ radio: RadioTetra }>>(
      '/radios-tetra',
      data
    );
    return response.data.data.radio;
  }

  /**
   * Actualizar un radio existente
   */
  async updateRadio(id: number, data: UpdateRadioTetraDTO): Promise<RadioTetra> {
    const response = await this.api.put<ApiResponse<{ radio: RadioTetra }>>(
      `/radios-tetra/${id}`,
      data
    );
    return response.data.data.radio;
  }

  /**
   * Eliminar un radio (soft delete)
   */
  async deleteRadio(id: number): Promise<void> {
    await this.api.delete(`/radios-tetra/${id}`);
  }

  /**
   * Asignar radio a personal
   */
  async asignarRadio(id: number, data: AsignarRadioDTO): Promise<RadioTetra> {
    const response = await this.api.patch<ApiResponse<{ radio: RadioTetra }>>(
      `/radios-tetra/${id}/asignar`,
      data
    );
    return response.data.data.radio;
  }

  /**
   * Desasignar radio
   */
  async desasignarRadio(id: number): Promise<RadioTetra> {
    const response = await this.api.patch<ApiResponse<{ radio: RadioTetra }>>(
      `/radios-tetra/${id}/desasignar`
    );
    return response.data.data.radio;
  }

  /**
   * Activar radio
   */
  async activarRadio(id: number): Promise<RadioTetra> {
    const response = await this.api.patch<ApiResponse<{ radio: RadioTetra }>>(
      `/radios-tetra/${id}/activar`
    );
    return response.data.data.radio;
  }

  /**
   * Desactivar radio
   */
  async desactivarRadio(id: number): Promise<RadioTetra> {
    const response = await this.api.patch<ApiResponse<{ radio: RadioTetra }>>(
      `/radios-tetra/${id}/desactivar`
    );
    return response.data.data.radio;
  }
}

export default new RadioTetraService();
```

---

## 🪝 Custom Hook React

```typescript
/**
 * ===================================================
 * CUSTOM HOOK - useRadiosTetra
 * ===================================================
 *
 * Archivo: src/hooks/useRadiosTetra.ts
 */

import { useState, useEffect, useCallback } from 'react';
import radioTetraService from '@/services/radioTetraService';
import {
  RadioTetra,
  RadioTetraFilters,
  CreateRadioTetraDTO,
  UpdateRadioTetraDTO,
  AsignarRadioDTO,
} from '@/types/radioTetra';
import { toast } from 'react-toastify';

export const useRadiosTetra = () => {
  const [radios, setRadios] = useState<RadioTetra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Cargar radios con filtros
   */
  const loadRadios = useCallback(async (filters?: RadioTetraFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await radioTetraService.getRadios(filters);
      setRadios(response.radios);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar radios';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar radios disponibles
   */
  const loadRadiosDisponibles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const radiosDisponibles = await radioTetraService.getRadiosDisponibles();
      return radiosDisponibles;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar radios disponibles';
      setError(errorMsg);
      toast.error(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener radio por ID
   */
  const getRadioById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const radio = await radioTetraService.getRadioById(id);
      return radio;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al obtener radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear radio
   */
  const createRadio = useCallback(async (data: CreateRadioTetraDTO) => {
    setLoading(true);
    setError(null);

    try {
      const nuevoRadio = await radioTetraService.createRadio(data);
      toast.success('Radio TETRA creado exitosamente');
      return nuevoRadio;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al crear radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar radio
   */
  const updateRadio = useCallback(async (id: number, data: UpdateRadioTetraDTO) => {
    setLoading(true);
    setError(null);

    try {
      const radioActualizado = await radioTetraService.updateRadio(id, data);
      toast.success('Radio TETRA actualizado exitosamente');
      return radioActualizado;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar radio
   */
  const deleteRadio = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      await radioTetraService.deleteRadio(id);
      toast.success('Radio TETRA eliminado exitosamente');
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Asignar radio a personal
   */
  const asignarRadio = useCallback(async (id: number, data: AsignarRadioDTO) => {
    setLoading(true);
    setError(null);

    try {
      const radioAsignado = await radioTetraService.asignarRadio(id, data);
      toast.success('Radio asignado exitosamente');
      return radioAsignado;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al asignar radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Desasignar radio
   */
  const desasignarRadio = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const radioDesasignado = await radioTetraService.desasignarRadio(id);
      toast.success('Radio desasignado exitosamente');
      return radioDesasignado;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al desasignar radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Activar radio
   */
  const activarRadio = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const radioActivado = await radioTetraService.activarRadio(id);
      toast.success('Radio activado exitosamente');
      return radioActivado;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al activar radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Desactivar radio
   */
  const desactivarRadio = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const radioDesactivado = await radioTetraService.desactivarRadio(id);
      toast.success('Radio desactivado exitosamente');
      return radioDesactivado;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al desactivar radio';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    radios,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    loadRadios,
    loadRadiosDisponibles,
    getRadioById,
    createRadio,
    updateRadio,
    deleteRadio,
    asignarRadio,
    desasignarRadio,
    activarRadio,
    desactivarRadio,
  };
};
```

---

## 🧩 Componentes Principales

### 1. Tabla de Radios TETRA

```tsx
/**
 * ===================================================
 * COMPONENTE - RadiosTetraTable
 * ===================================================
 */

import React from 'react';
import { RadioTetra } from '@/types/radioTetra';
import { Pencil, Trash2, UserPlus, UserMinus, Power, PowerOff } from 'lucide-react';

interface RadiosTetraTableProps {
  radios: RadioTetra[];
  onEdit: (radio: RadioTetra) => void;
  onDelete: (id: number) => void;
  onAsignar: (radio: RadioTetra) => void;
  onDesasignar: (radio: RadioTetra) => void;
  onToggleEstado: (radio: RadioTetra) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export const RadiosTetraTable: React.FC<RadiosTetraTableProps> = ({
  radios,
  onEdit,
  onDelete,
  onAsignar,
  onDesasignar,
  onToggleEstado,
  canUpdate,
  canDelete,
}) => {
  const getNombreCompleto = (personal: any) => {
    if (!personal) return '-';
    return `${personal.nombres} ${personal.apellido_paterno} ${personal.apellido_materno}`;
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full bg-white dark:bg-gray-800">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Código
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Personal Asignado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Fecha Fabricación
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {radios.map((radio) => (
            <tr key={radio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                  {radio.radio_tetra_code}
                </span>
              </td>
              <td className="px-6 py-4">
                {radio.descripcion || <span className="text-gray-400">Sin descripción</span>}
              </td>
              <td className="px-6 py-4">
                {radio.personalAsignado ? (
                  <div>
                    <p className="font-medium">{getNombreCompleto(radio.personalAsignado)}</p>
                    <p className="text-sm text-gray-500">{radio.personalAsignado.codigo_personal}</p>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No asignado</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {radio.fecha_fabricacion || '-'}
              </td>
              <td className="px-6 py-4 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    radio.estado
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {radio.estado ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  {/* Editar */}
                  {canUpdate && (
                    <button
                      onClick={() => onEdit(radio)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                  )}

                  {/* Asignar/Desasignar */}
                  {canUpdate && (
                    radio.personal_seguridad_id ? (
                      <button
                        onClick={() => onDesasignar(radio)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded transition"
                        title="Desasignar"
                      >
                        <UserMinus size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onAsignar(radio)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                        title="Asignar a personal"
                        disabled={!radio.estado}
                      >
                        <UserPlus size={18} />
                      </button>
                    )
                  )}

                  {/* Activar/Desactivar */}
                  {canUpdate && (
                    radio.estado ? (
                      <button
                        onClick={() => onToggleEstado(radio)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded transition"
                        title="Desactivar"
                        disabled={!!radio.personal_seguridad_id}
                      >
                        <PowerOff size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleEstado(radio)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                        title="Activar"
                      >
                        <Power size={18} />
                      </button>
                    )
                  )}

                  {/* Eliminar */}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(radio.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {radios.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron radios TETRA
        </div>
      )}
    </div>
  );
};
```

### 2. Formulario de Radio

```tsx
/**
 * ===================================================
 * COMPONENTE - RadioTetraForm
 * ===================================================
 */

import React, { useState, useEffect } from 'react';
import { CreateRadioTetraDTO, UpdateRadioTetraDTO, RadioTetra } from '@/types/radioTetra';

interface RadioTetraFormProps {
  initialData?: RadioTetra | null;
  onSubmit: (data: CreateRadioTetraDTO | UpdateRadioTetraDTO) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const RadioTetraForm: React.FC<RadioTetraFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<CreateRadioTetraDTO>({
    radio_tetra_code: '',
    descripcion: '',
    fecha_fabricacion: '',
    estado: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        radio_tetra_code: initialData.radio_tetra_code || '',
        descripcion: initialData.descripcion || '',
        fecha_fabricacion: initialData.fecha_fabricacion || '',
        estado: initialData.estado ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      // Reset form si es creación
      if (!isEdit) {
        setFormData({
          radio_tetra_code: '',
          descripcion: '',
          fecha_fabricacion: '',
          estado: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Código del Radio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Código del Radio *
        </label>
        <input
          type="text"
          name="radio_tetra_code"
          value={formData.radio_tetra_code}
          onChange={handleChange}
          maxLength={10}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
          placeholder="RT-001"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Máximo 10 caracteres (letras, números, guiones)</p>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción
        </label>
        <input
          type="text"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          maxLength={50}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
          placeholder="Motorola XTS 5000"
        />
        <p className="text-xs text-gray-500 mt-1">Máximo 50 caracteres</p>
      </div>

      {/* Fecha de Fabricación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Fecha de Fabricación
        </label>
        <input
          type="date"
          name="fecha_fabricacion"
          value={formData.fecha_fabricacion || ''}
          onChange={handleChange}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Estado */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="estado"
          checked={formData.estado}
          onChange={handleChange}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Radio Activo
        </label>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
```

---

## 🔐 Permisos RBAC

### Permisos Disponibles

| Permiso | Descripción | Roles con Acceso |
|---------|-------------|------------------|
| `radios_tetra.read` | Ver listado y detalles | Todos autenticados |
| `radios_tetra.create` | Crear nuevos radios | Supervisor, Super Admin |
| `radios_tetra.update` | Actualizar, asignar, activar/desactivar | Supervisor, Super Admin |
| `radios_tetra.delete` | Eliminar radios (soft delete) | Super Admin |
| `radios_tetra.asignar` | Permiso especial para asignación | Supervisor, Super Admin |

### Uso en Componentes

```typescript
// Verificar permisos del usuario
const userPermissions = useUserPermissions(); // Hook personalizado

const canRead = userPermissions.includes('radios_tetra.read');
const canCreate = userPermissions.includes('radios_tetra.create');
const canUpdate = userPermissions.includes('radios_tetra.update');
const canDelete = userPermissions.includes('radios_tetra.delete');
const canAsignar = userPermissions.includes('radios_tetra.asignar') || canUpdate;

// Condicionar renderizado
{canCreate && (
  <button onClick={handleCreate}>Crear Radio</button>
)}

{canUpdate && (
  <button onClick={() => asignarRadio(radio.id, personalId)}>Asignar</button>
)}
```

---

## 💼 Casos de Uso

### 1. Listar Radios con Filtros

```typescript
import { useRadiosTetra } from '@/hooks/useRadiosTetra';

const RadiosPage = () => {
  const { radios, loading, loadRadios, currentPage, totalPages } = useRadiosTetra();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    estado: true,
    asignado: 'all',
  });

  useEffect(() => {
    loadRadios(filters);
  }, [filters, loadRadios]);

  return (
    // ... JSX
  );
};
```

### 2. Crear Nuevo Radio

```typescript
const handleCreateRadio = async () => {
  const newRadio = await createRadio({
    radio_tetra_code: 'RT-015',
    descripcion: 'Hytera PD785',
    estado: true,
  });

  if (newRadio) {
    // Recargar lista
    loadRadios();
  }
};
```

### 3. Asignar Radio a Personal

```typescript
const handleAsignarRadio = async (radioId: number, personalId: number) => {
  const result = await asignarRadio(radioId, { personal_seguridad_id: personalId });

  if (result) {
    // Actualizar lista
    loadRadios();
  }
};
```

### 4. Dropdown de Radios Disponibles

```typescript
const AsignarRadioModal = () => {
  const { loadRadiosDisponibles } = useRadiosTetra();
  const [radiosDisponibles, setRadiosDisponibles] = useState<RadioTetra[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const radios = await loadRadiosDisponibles();
      setRadiosDisponibles(radios);
    };
    cargar();
  }, []);

  return (
    <select>
      <option value="">Seleccione un radio</option>
      {radiosDisponibles.map((radio) => (
        <option key={radio.id} value={radio.id}>
          {radio.radio_tetra_code} - {radio.descripcion}
        </option>
      ))}
    </select>
  );
};
```

---

## ✅ Checklist de Implementación

### Backend
- [x] Modelo RadioTetra
- [x] Controller con todos los endpoints
- [x] Validadores
- [x] Rutas con RBAC
- [x] Registro en index.routes.js
- [x] Documentación

### Frontend
- [ ] Interfaces TypeScript
- [ ] Servicio API (Axios)
- [ ] Custom Hook
- [ ] Componente de tabla
- [ ] Componente de formulario
- [ ] Modal de asignación
- [ ] Filtros avanzados
- [ ] Paginación
- [ ] Gestión de permisos

---

## 📝 Notas Adicionales

### Validaciones Importantes

1. **No se puede asignar un radio inactivo** → Activar primero
2. **No se puede desactivar un radio asignado** → Desasignar primero
3. **Código único** → Validar antes de crear/actualizar
4. **Fecha de fabricación no puede ser futura**

### Mejores Prácticas

- Usar toast para feedback al usuario
- Confirmar eliminaciones con modal
- Validar permisos antes de mostrar botones
- Implementar loading states
- Manejar errores de API gracefully
- Usar debounce en búsquedas

### Próximas Mejoras

- Exportar a Excel/PDF
- Historial de asignaciones
- Integración con sistema de mantenimiento
- Dashboard de disponibilidad
- Alertas de radios sin uso prolongado

---

**Versión**: 1.0.0
**Fecha**: 2026-01-06
**Autor**: Sistema de Seguridad Ciudadana
