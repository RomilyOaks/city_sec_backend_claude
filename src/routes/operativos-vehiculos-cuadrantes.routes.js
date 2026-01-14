/**
 * ===================================================
 * RUTAS: OperativosVehiculosCuadrantes - ARCHIVO NUEVO
 * ===================================================
 *
 * @author Codi Express
 * @version 2.0.0 - NUEVA VERSIÓN
 * @date 2026-01-14
 *
 * Descripcion:
 * Define las rutas para la gestión de cuadrantes asignados a vehículos operativos.
 * VERSIÓN COMPLETAMENTE NUEVA PARA RESOLVER PROBLEMA DE CACHE.
 */

import { Router } from "express";
import { body, param } from "express-validator";
console.log("🆕🆕🆕 ARCHIVO NUEVO - operativos-vehiculos-cuadrantes.routes.js CARGADO 🆕🆕🆕");

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
  async (req, res) => {
    res.status(200).json({
      status: "success",
      message: "GET cuadrantes - ARCHIVO NUEVO",
    });
  }
);

// 🔥 RUTA PRINCIPAL - VERSIÓN NUEVA DEFINITIVA
router.post(
  "/cuadrantes",
  verificarToken,
  (req, res, next) => {
    console.log("🆕🆕🆕 RUTA POST /cuadrantes - ARCHIVO NUEVO EJECUTÁNDOSE 🆕🆕🆕");
    console.log("🆕🆕🆕 req.body en ruta NUEVA:", JSON.stringify(req.body, null, 2));
    console.log("🆕🆕🆕 ESTE ES EL ARCHIVO NUEVO - DEBE FUNCIONAR 🆕🆕🆕");
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
    console.log("🆕🆕🆕🆕🆕 ARCHIVO NUEVO - EJECUTANDO LÓGICA NUEVA 🆕🆕🆕🆕🆕");
    console.log("🆕🆕🆕🆕🆕 req.body NUEVO:", JSON.stringify(req.body, null, 2));
    console.log("🆕🆕🆕🆕🆕 req.user NUEVO:", req.user);
    console.log("🆕🆕🆕🆕🆕 req.params NUEVO:", req.params);
    
    try {
      const { vehiculoId } = req.params;
      const { id: created_by } = req.user;
      
      // 🆕 SOLUCIÓN NUEVA DEFINITIVA - Crear directamente aquí
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

      // 🆕 CAMPOS OPCIONALES - MANEJO EXPLÍCITO NUEVO
      if (req.body.hasOwnProperty('observaciones')) {
        createData.observaciones = req.body.observaciones === '' ? null : req.body.observaciones;
        console.log("🆕🆕🆕🆕🆕 OBSERVACIONES PROCESADAS NUEVO:", createData.observaciones);
      }

      if (req.body.hasOwnProperty('incidentes_reportados')) {
        createData.incidentes_reportados = req.body.incidentes_reportados === '' ? null : req.body.incidentes_reportados;
        console.log("🆕🆕🆕🆕🆕 INCIDENTES_REPORTADOS PROCESADOS NUEVO:", createData.incidentes_reportados);
      }

      console.log("🆕🆕🆕🆕🆕 DATOS FINALES A CREAR NUEVO:", JSON.stringify(createData, null, 2));

      const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create(createData);

      console.log("🆕🆕🆕🆕🆕 CUADRANTE CREADO EXITOSAMENTE NUEVO:");
      console.log("🆕🆕🆕🆕🆕 ID NUEVO:", newCuadranteAsignado.id);
      console.log("🆕🆕🆕🆕🆕 observaciones NUEVO:", newCuadranteAsignado.observaciones);
      console.log("🆕🆕🆕🆕🆕 incidentes_reportados NUEVO:", newCuadranteAsignado.incidentes_reportados);

      res.status(201).json({
        status: "success",
        message: "Cuadrante asignado al vehículo correctamente - ARCHIVO NUEVO",
        data: newCuadranteAsignado,
      });
      
    } catch (error) {
      console.error("🆕🆕🆕🆕🆕 ERROR CAPTURADO NUEVO:", error);
      console.error("🆕🆕🆕🆕🆕 Error message NUEVO:", error.message);
      console.error("🆕🆕🆕🆕🆕 Error stack NUEVO:", error.stack);
      
      return res.status(500).json({
        status: "error",
        message: "Error en la ruta de cuadrantes - ARCHIVO NUEVO",
        error: error.message,
        debug: {
          stack: error.stack,
          body: req.body
        }
      });
    }
  }
);

export default router;
