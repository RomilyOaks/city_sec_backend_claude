/**
 * Ruta: src/routes/ubigeoRoutes.js
 * Descripción: Rutas para gestión de ubigeos
 */

import express from "express";
import {
  getUbigeos,
  getUbigeoByCode,
} from "../controllers/ubigeoController.js";
////import { authenticateToken } from "../middlewares/authMiddleware.js";
import { verificarToken, verificarRolesOPermisos } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas protegidas
router.get("/", verificarToken, verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.ubigeo.read"]), getUbigeos);
router.get("/:code", verificarToken, verificarRolesOPermisos(["super_admin", "admin", "supervisor", "operador", "consulta"], ["catalogos.ubigeo.read"]), getUbigeoByCode);

export default router;
