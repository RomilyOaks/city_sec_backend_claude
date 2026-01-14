/**
 * ===================================================
 * RUTAS: OperativosVehiculosCuadrantes
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2026-01-09
 *
 * Descripcion:
 * Define las rutas para la gestión de cuadrantes asignados a vehículos operativos.
 *
 * Endpoints:
 * - GET /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes: Obtener todos los cuadrantes de un vehículo operativo.
 * - POST /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes: Asignar un nuevo cuadrante a un vehículo operativo.
 * - PUT /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes/:id: Actualizar la información de un cuadrante en un vehículo operativo.
 * - DELETE /api/v1/operativos/vehiculos/:operativoVehiculoId/cuadrantes/:id: Eliminar la asignación de un cuadrante de un vehículo operativo.
 */

import { Router } from "express";
import { body, param } from "express-validator";
console.log("🚨🚨🚨 operativos-vehiculos-cuadrantes.routes.js CARGADO 🚨🚨🚨");

import {
  getAllCuadrantesByVehiculo,
  createCuadranteInVehiculo,
  updateCuadranteInVehiculo,
  deleteCuadranteInVehiculo,
} from "../controllers/operativosVehiculosCuadrantesController.js";

console.log("🚨🚨🚨 CONTROLLERS IMPORTADOS:");
console.log("🚨🚨🚨 createCuadranteInVehiculo:", typeof createCuadranteInVehiculo);

// 🎯 Importar modelo directamente para solución
import OperativosVehiculosCuadrantes from "../models/OperativosVehiculosCuadrantes.js";
import {
  verificarToken,
  requireAnyPermission,
} from "../middlewares/authMiddleware.js";
import { registrarAuditoria } from "../middlewares/auditoriaAccionMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";

const router = Router();

const permisos = {
  read: "operativos.vehiculos.cuadrantes.read",
  create: "operativos.vehiculos.cuadrantes.create",
  update: "operativos.vehiculos.cuadrantes.update",
  delete: "operativos.vehiculos.cuadrantes.delete",
};

// Rutas para OperativosVehiculosCuadrantes
router.get(
  "/cuadrantes",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.read])(req, res, next),
  getAllCuadrantesByVehiculo
);

// 🔥 RUTA TEMPORAL BYPASSEANDO TODO PARA DEBUG
router.post(
  "/cuadrantes-debug",
  verificarToken,
  async (req, res) => {
    console.log("🔥🔥🔥🔥🔥 RUTA DEBUG BYPASSEANDO TODO 🔥🔥🔥🔥🔥");
    console.log("🔥🔥🔥🔥🔥 req.body:", JSON.stringify(req.body, null, 2));
    console.log("🔥🔥🔥🔥🔥 req.user:", req.user);
    console.log("🔥🔥🔥🔥🔥 req.params:", req.params);
    
    try {
      const { vehiculoId } = req.params;
      const { id: created_by } = req.user;
      
      // 🔥 CREAR DIRECTAMENTE SIN VALIDACIONES
      const createData = {
        operativo_vehiculo_id: vehiculoId,
        cuadrante_id: req.body.cuadrante_id,
        hora_ingreso: req.body.hora_ingreso,
        observaciones: req.body.observaciones,
        incidentes_reportados: req.body.incidentes_reportados,
        created_by,
      };

      console.log("🔥🔥🔥🔥🔥 DATOS A CREAR:", JSON.stringify(createData, null, 2));

      const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create(createData);

      console.log("🔥🔥🔥🔥🔥 CUADRANTE CREADO:");
      console.log("🔥🔥🔥🔥🔥 ID:", newCuadranteAsignado.id);
      console.log("🔥🔥🔥🔥🔥 observaciones:", newCuadranteAsignado.observaciones);
      console.log("🔥🔥🔥🔥🔥 incidentes_reportados:", newCuadranteAsignado.incidentes_reportados);

      res.status(201).json({
        status: "success",
        message: "Cuadrante creado - RUTA DEBUG",
        data: newCuadranteAsignado,
      });
      
    } catch (error) {
      console.error("🔥🔥🔥🔥🔥 ERROR EN RUTA DEBUG:", error);
      res.status(500).json({
        status: "error",
        message: "Error en ruta debug",
        error: error.message,
      });
    }
  }
);

router.post(
  "/cuadrantes",
  verificarToken,
  (req, res, next) => {
    console.log("🚨🚨🚨 RUTA POST /cuadrantes EJECUTÁNDOSE 🚨🚨🚨");
    console.log("🚨 req.body en ruta:", JSON.stringify(req.body, null, 2));
    console.log("🚨🚨🚨 FORZANDO DETECCIÓN DE CAMBIOS - NUEVA VERSIÓN 🚨🚨🚨");
    return requireAnyPermission([permisos.create])(req, res, next);
  },
  [
    body("cuadrante_id")
      .isInt()
      .withMessage("El ID del cuadrante debe ser un número entero."),
    body("hora_ingreso")
      .isISO8601()
      .withMessage("La hora de ingreso debe ser una fecha y hora válida."),
    body("observaciones")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Las observaciones no deben exceder los 500 caracteres."),
    body("incidentes_reportados")
      .optional()
      .isString()
      .withMessage("Los incidentes reportados deben ser una cadena de texto."),
  ],
  handleValidationErrors,
  registrarAuditoria("Registro de cuadrante en vehículo operativo"),
  async (req, res) => {
    console.log("💥💥💥💥💥 FORZANDO ESTE LOG - SI NO APARECE, HAY UN PROBLEMA DE CACHE 💥💥💥💥💥");
    console.log("💥💥💥💥💥 req.body:", JSON.stringify(req.body, null, 2));
    console.log("💥💥💥💥💥 req.user:", req.user);
    console.log("💥💥💥💥💥 req.params:", req.params);
    
    // 💥 FORZAR UNA PAUSA PARA VER SI APARECE ESTE LOG
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("💥💥💥💥💥 DESPUÉS DE LA PAUSA - CONTINUANDO 💥💥💥💥💥");
    
    try {
      console.log("🎯🎯🎯 EJECUTANDO CONTROLLER DIRECTO EN RUTA 🎯🎯🎯");
      console.log("🎯🎯🎯 req.body COMPLETO:", JSON.stringify(req.body, null, 2));
      
      const { vehiculoId } = req.params;
      const { id: created_by } = req.user;
      
      // 🎯 SOLUCIÓN DIRECTA - Crear aquí mismo
      const createData = {
        operativo_vehiculo_id: vehiculoId,
        created_by,
      };

      // Campos obligatorios
      if (req.body.cuadrante_id) {
        createData.cuadrante_id = req.body.cuadrante_id;
      } else {
        return res.status(400).json({
          status: "error",
          message: "El campo cuadrante_id es obligatorio",
        });
      }

      if (req.body.hora_ingreso) {
        createData.hora_ingreso = req.body.hora_ingreso;
      } else {
        return res.status(400).json({
          status: "error",
          message: "El campo hora_ingreso es obligatorio",
        });
      }

      // 🎯 CAMPOS OPCIONALES - MANEJO EXPLÍCITO
      if (req.body.hasOwnProperty('observaciones')) {
        createData.observaciones = req.body.observaciones === '' ? null : req.body.observaciones;
        console.log("🎯🎯🎯 OBSERVACIONES PROCESADAS:", createData.observaciones);
      }

      if (req.body.hasOwnProperty('incidentes_reportados')) {
        createData.incidentes_reportados = req.body.incidentes_reportados === '' ? null : req.body.incidentes_reportados;
        console.log("🎯🎯🎯 INCIDENTES_REPORTADOS PROCESADOS:", createData.incidentes_reportados);
      }

      console.log("🎯🎯🎯 DATOS FINALES A CREAR:", JSON.stringify(createData, null, 2));

      const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create(createData);

      console.log("🎯🎯🎯 CUADRANTE CREADO EXITOSAMENTE:");
      console.log("🎯🎯🎯 ID:", newCuadranteAsignado.id);
      console.log("🎯🎯🎯 observaciones:", newCuadranteAsignado.observaciones);
      console.log("🎯🎯🎯 incidentes_reportados:", newCuadranteAsignado.incidentes_reportados);

      res.status(201).json({
        status: "success",
        message: "Cuadrante asignado al vehículo correctamente - SOLUCIÓN DIRECTA",
        data: newCuadranteAsignado,
      });
      
    } catch (error) {
      console.error("🎯🎯🎯 ERROR CAPTURADO EN RUTA:", error);
      console.error("🎯🎯🎯 Error message:", error.message);
      console.error("🎯🎯🎯 Error stack:", error.stack);
      
      return res.status(500).json({
        status: "error",
        message: "Error en la ruta de cuadrantes",
        error: error.message,
        debug: {
          stack: error.stack,
          body: req.body
        }
      });
    }
  }
);

router.put(
  "/cuadrantes/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.update])(req, res, next),
  [
    param("id")
      .isInt()
      .withMessage("El ID del cuadrante asignado debe ser un número entero."),
    body("cuadrante_id")
      .optional()
      .isInt()
      .withMessage("El ID del cuadrante debe ser un número entero."),
    body("hora_ingreso")
      .optional()
      .isISO8601()
      .withMessage("La hora de ingreso debe ser una fecha y hora válida."),
    body("hora_salida")
      .optional()
      .isISO8601()
      .withMessage("La hora de salida debe ser una fecha y hora válida."),
    body("observaciones")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Las observaciones no deben exceder los 500 caracteres."),
    body("incidentes_reportados")
      .optional()
      .isString()
      .withMessage("Los incidentes reportados deben ser una cadena de texto."),
    body("estado_registro")
      .optional()
      .isInt({ min: 0, max: 1 })
      .withMessage("El estado de registro debe ser 0 o 1."),
  ],
  handleValidationErrors,
  registrarAuditoria("Actualización de cuadrante en vehículo operativo"),
  updateCuadranteInVehiculo
);

router.delete(
  "/cuadrantes/:id",
  verificarToken,
  (req, res, next) => requireAnyPermission([permisos.delete])(req, res, next),
  [
    param("id")
      .isInt()
      .withMessage("El ID del cuadrante asignado debe ser un número entero."),
  ],
  handleValidationErrors,
  registrarAuditoria("Eliminación de cuadrante en vehículo operativo"),
  deleteCuadranteInVehiculo
);

export default router;