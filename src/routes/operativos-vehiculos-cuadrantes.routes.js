/**
 * ===================================================
 * RUTAS: OperativosVehiculosCuadrantes - ARCHIVO NUEVO
 * ===================================================
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

// 🔥 LOG DIRECTO EN EL NIVEL SUPERIOR PARA VER SI SE EJECUTA
console.log("🔥🔥🔥 LOG DIRECTO EN NIVEL SUPERIOR - ANTES DE CUALQUIER RUTA 🔥🔥🔥");

const permisos = {
  read: "operativos.vehiculos.cuadrantes.read",
  create: "operativos.vehiculos.cuadrantes.create",
  update: "operativos.vehiculos.cuadrantes.update",
  delete: "operativos.vehiculos.cuadrantes.delete",
};

// 🔥 RUTA DE PRUEBA MÍNIMA - SOLO LOG
router.post("/test", (req, res) => {
  console.log("🔥🔥🔥 RUTA /test EJECUTÁNDOSE 🔥🔥🔥");
  res.json({ message: "TEST FUNCIONA" });
});

// 🔥 RUTA PRINCIPAL - VERSIÓN SIN MIDDLEWARES PARA DEBUG
router.post(
  "/cuadrantes",
  async (req, res) => {
    console.log("🆕🆕🆕 RUTA POST /cuadrantes - VERSIÓN SIN MIDDLEWARES 🆕🆕🆕");
    console.log("🆕🆕🆕 req.body en ruta SIN MIDDLEWARES:", JSON.stringify(req.body, null, 2));
    console.log("🆕🆕🆕 ESTE DEBERÍA EJECUTARSE SIN BLOQUEOS 🆕🆕🆕");
    
    try {
      const { vehiculoId } = req.params;
      
      // 🆕 SIMULACIÓN MANUAL - Crear directamente aquí
      const createData = {
        operativo_vehiculo_id: vehiculoId,
        cuadrante_id: req.body.cuadrante_id,
        hora_ingreso: req.body.hora_ingreso,
        observaciones: req.body.observaciones,
        incidentes_reportados: req.body.incidentes_reportados,
        created_by: 13, // Hardcodeado para prueba
      };

      console.log("🆕🆕🆕🆕🆕 DATOS FINALES A CREAR SIN MIDDLEWARES:", JSON.stringify(createData, null, 2));

      const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create(createData);

      console.log("🆕🆕🆕🆕🆕 CUADRANTE CREADO SIN MIDDLEWARES:");
      console.log("🆕🆕🆕🆕🆕 ID:", newCuadranteAsignado.id);
      console.log("🆕🆕🆕🆕🆕 observaciones:", newCuadranteAsignado.observaciones);
      console.log("🆕🆕🆕🆕🆕 incidentes_reportados:", newCuadranteAsignado.incidentes_reportados);

      res.status(201).json({
        status: "success",
        message: "Cuadrante asignado correctamente - VERSIÓN SIN MIDDLEWARES",
        data: newCuadranteAsignado,
      });
      
    } catch (error) {
      console.error("🆕🆕🆕🆕🆕 ERROR SIN MIDDLEWARES:", error);
      res.status(500).json({
        status: "error",
        message: "Error - VERSIÓN SIN MIDDLEWARES",
        error: error.message,
      });
    }
  }
);

console.log("🔥🔥🔥 LOG FINAL - ANTES DE EXPORTAR ROUTER 🔥🔥🔥");

export default router;
