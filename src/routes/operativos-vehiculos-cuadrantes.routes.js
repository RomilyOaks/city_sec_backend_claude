/**
 * ===================================================
 * RUTAS: OperativosVehiculosCuadrantes - VERSIÓN MÍNIMA
 * ===================================================
 */

import { Router } from "express";
console.log("🆕🆕🆕 ARCHIVO NUEVO - operativos-vehiculos-cuadrantes.routes.js CARGADO 🆕🆕🆕");

// 🎯 Importar modelo directamente para solución
import OperativosVehiculosCuadrantes from "../models/OperativosVehiculosCuadrantes.js";

const router = Router();

// 🔥 LOG DIRECTO EN EL NIVEL SUPERIOR PARA VER SI SE EJECUTA
console.log("🔥🔥🔥 LOG DIRECTO EN NIVEL SUPERIOR - ANTES DE CUALQUIER RUTA 🔥🔥🔥");

// 🔥 RUTA DE PRUEBA MÍNIMA - SOLO LOG
router.post("/test", (req, res) => {
  console.log("🔥🔥🔥 RUTA /test EJECUTÁNDOSE 🔥🔥🔥");
  res.json({ message: "TEST FUNCIONA" });
});

// 🔥 RUTA PRINCIPAL - VERSIÓN MÍNIMA ABSOLUTA
router.post("/cuadrantes", async (req, res) => {
  console.log("🆕🆕🆕 RUTA POST /cuadrantes - VERSIÓN MÍNIMA ABSOLUTA 🆕🆕🆕");
  console.log("🆕🆕🆕 req.body en ruta MÍNIMA:", JSON.stringify(req.body, null, 2));
  
  try {
    const { vehiculoId } = req.params;
    
    // 🆕 CREACIÓN DIRECTA SIN NADA MÁS
    const createData = {
      operativo_vehiculo_id: vehiculoId,
      cuadrante_id: req.body.cuadrante_id,
      hora_ingreso: req.body.hora_ingreso,
      observaciones: req.body.observaciones,
      incidentes_reportados: req.body.incidentes_reportados,
      created_by: 13,
    };

    console.log("🆕🆕🆕🆕🆕 DATOS A CREAR MÍNIMA:", JSON.stringify(createData, null, 2));

    const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create(createData);

    console.log("🆕🆕🆕🆕🆕 CUADRANTE CREADO MÍNIMA:");
    console.log("🆕🆕🆕🆕🆕 observaciones:", newCuadranteAsignado.observaciones);

    res.status(201).json({
      status: "success",
      message: "Cuadrante creado - VERSIÓN MÍNIMA ABSOLUTA",
      data: newCuadranteAsignado,
    });
    
  } catch (error) {
    console.error("🆕🆕🆕🆕🆕 ERROR MÍNIMA:", error);
    res.status(500).json({
      status: "error",
      message: "Error - VERSIÓN MÍNIMA ABSOLUTA",
      error: error.message,
    });
  }
});

console.log("🔥🔥🔥 LOG FINAL - ANTES DE EXPORTAR ROUTER 🔥🔥🔥");
console.log("🔥🔥🔥 ROUTER TIENE ESTAS RUTAS REGISTRADAS:", router.stack.map(layer => layer.route?.path).filter(Boolean));

export default router;
