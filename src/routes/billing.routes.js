import express from "express";
import { verificarToken, verificarRolesOPermisos } from "../middlewares/authMiddleware.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";
import {
  getSuscripcion,
  getMetricasActual,
  getMetricasPeriodo,
  getFacturas,
  getFactura,
  getFacturaPdf,
  generarFactura,
  registrarPago,
  getDatosFacturacion,
  updateDatosFacturacion,
  getPlanes,
  cambiarPlan,
} from "../controllers/billingController.js";
import {
  validarPeriodoParam,
  validarGenerarFactura,
  validarRegistrarPago,
  validarDatosFacturacion,
  validarCambiarPlan,
  validarFiltrosFacturas,
} from "../validators/billingValidator.js";

const router = express.Router();

const soloSuperAdmin = verificarRolesOPermisos(["super_admin"], []);

// Suscripción
router.get("/suscripcion", verificarToken, soloSuperAdmin, getSuscripcion);

// Planes
router.get("/planes", verificarToken, soloSuperAdmin, getPlanes);
router.put(
  "/suscripcion/plan",
  verificarToken,
  soloSuperAdmin,
  validarCambiarPlan,
  handleValidationErrors,
  cambiarPlan
);

// Métricas
router.get("/metricas/actual", verificarToken, soloSuperAdmin, getMetricasActual);
router.get(
  "/metricas/:periodo",
  verificarToken,
  soloSuperAdmin,
  validarPeriodoParam,
  handleValidationErrors,
  getMetricasPeriodo
);

// Facturas — rutas más específicas antes que /:id
router.post(
  "/facturas/generar",
  verificarToken,
  soloSuperAdmin,
  validarGenerarFactura,
  handleValidationErrors,
  generarFactura
);
router.get(
  "/facturas",
  verificarToken,
  soloSuperAdmin,
  validarFiltrosFacturas,
  handleValidationErrors,
  getFacturas
);
router.get("/facturas/:id/pdf", verificarToken, soloSuperAdmin, getFacturaPdf);
router.get("/facturas/:id", verificarToken, soloSuperAdmin, getFactura);
router.post(
  "/facturas/:id/pagar",
  verificarToken,
  soloSuperAdmin,
  validarRegistrarPago,
  handleValidationErrors,
  registrarPago
);

// Datos de facturación
router.get("/datos-facturacion", verificarToken, soloSuperAdmin, getDatosFacturacion);
router.put(
  "/datos-facturacion",
  verificarToken,
  soloSuperAdmin,
  validarDatosFacturacion,
  handleValidationErrors,
  updateDatosFacturacion
);

export default router;
