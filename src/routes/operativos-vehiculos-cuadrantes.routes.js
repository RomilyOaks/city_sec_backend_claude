/**
 * ===================================================
 * RUTAS: OperativosVehiculosCuadrantes
 * ===================================================
 */

import { Router } from "express";
import OperativosVehiculosCuadrantes from "../models/OperativosVehiculosCuadrantes.js";

const router = Router();

/**
 * Asignar cuadrante a vehículo operativo
 */
router.post("/cuadrantes", async (req, res) => {
  try {
    const { vehiculoId } = req.params;
    
    const createData = {
      operativo_vehiculo_id: vehiculoId,
      cuadrante_id: req.body.cuadrante_id,
      hora_ingreso: req.body.hora_ingreso,
      observaciones: req.body.observaciones,
      incidentes_reportados: req.body.incidentes_reportados,
      created_by: req.user?.id || 1,
    };

    const newCuadranteAsignado = await OperativosVehiculosCuadrantes.create(createData);

    res.status(201).json({
      success: true,
      message: "Cuadrante asignado exitosamente",
      data: newCuadranteAsignado,
    });
    
  } catch (error) {
    console.error("Error asignando cuadrante:", error);
    res.status(500).json({
      success: false,
      message: "Error al asignar cuadrante",
      error: error.message,
    });
  }
});

export default router;
