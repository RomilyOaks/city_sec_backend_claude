/**
 * ===================================================
 * CONTROLLER: Operativos Combinados
 * ===================================================
 *
 * @author Codi Express
 * @version 1.0.0
 * @date 2026-03-16
 *
 * Descripcion:
 * Gestiona la consulta combinada de operativos de vehículos y personal
 * para una misma novedad, mostrando quién llenó qué campos.
 *
 * Endpoints:
 * - GET /novedades/:novedadId/combinadas: Obtener ambos operativos para una novedad
 */

import models from "../models/index.js";
const {
  OperativosVehiculosNovedades,
  OperativosPersonalNovedades,
  OperativosPersonalCuadrantes,
  OperativosVehiculosCuadrantes,
  OperativosVehiculos,
  OperativosPersonal,
  OperativosTurno,
  Novedad,
  TipoNovedad,
  SubtipoNovedad,
  Vehiculo,
  Cuadrante,
  PersonalSeguridad,
  Usuario,
  Sector,
  EstadoNovedad,
} = models;

/**
 * Obtener operativos combinados para una novedad específica
 * Muestra ambos operativos (vehículo y personal) si existen
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getOperativosCombinadosPorNovedad = async (req, res) => {
  const { novedadId } = req.params;

  try {
    
    // Validar que la novedad exista
    const novedad = await Novedad.findByPk(novedadId, {
      attributes: [
        "id", 
        "novedad_code", 
        "descripcion",
        "fecha_llegada",
        "num_personas_afectadas", 
        "perdidas_materiales_estimadas"
      ],
      include: [
        { model: EstadoNovedad, as: "novedadEstado", attributes: ["id", "nombre", "color_hex", "icono", "orden"] },
        { model: TipoNovedad, as: "novedadTipoNovedad", attributes: ["id", "nombre", "color_hex", "icono"] },
        { model: SubtipoNovedad, as: "novedadSubtipoNovedad", attributes: ["id", "nombre", "descripcion", "prioridad", "tiempo_respuesta_min"] },
        { model: Sector, as: "novedadSector", attributes: ["id", "nombre", "sector_code"] },
        { model: Cuadrante, as: "novedadCuadrante", attributes: ["id", "nombre", "cuadrante_code"] }
      ]
    });

    if (!novedad) {
      return res.status(404).json({
        status: "error",
        message: "Novedad no encontrada",
      });
    }

    // Buscar operativo de vehículo para esta novedad
    const operativoVehiculo = await OperativosVehiculosNovedades.findOne({
      where: { novedad_id: novedadId },
      include: [
        {
          model: OperativosVehiculosCuadrantes,
          as: "cuadranteOperativo",
          include: [
            {
              model: OperativosVehiculos,
              as: "operativoVehiculo",
              include: [
                { model: OperativosTurno, as: "turno", attributes: ["id", "turno", "fecha", "fecha_hora_inicio", "fecha_hora_fin"] },
                { model: Vehiculo, as: "vehiculo", attributes: ["id", "codigo_vehiculo", "placa", "marca", "modelo_vehiculo", "color_vehiculo"] },
                { model: PersonalSeguridad, as: "conductor", attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "codigo_acceso"] },
                { model: PersonalSeguridad, as: "copiloto", attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "codigo_acceso"] }
              ]
            },
            { model: Cuadrante, as: "cuadrante", attributes: ["id", "nombre", "cuadrante_code", "sector_id"] }
          ]
        },
        { model: Usuario, as: "creadorOperativosVehiculosNovedades", attributes: ["id", "username", "nombres", "apellidos"] },
        { model: Usuario, as: "actualizadorOperativosVehiculosNovedades", attributes: ["id", "username", "nombres", "apellidos"] }
      ]
    });

    // Buscar operativo de personal para esta novedad
    const operativoPersonal = await OperativosPersonalNovedades.findOne({
      where: { novedad_id: novedadId },
      include: [
        {
          model: OperativosPersonalCuadrantes,
          as: "cuadranteOperativo",
          include: [
            {
              model: OperativosPersonal,
              as: "operativoPersonal",
              include: [
                { model: OperativosTurno, as: "turno", attributes: ["id", "turno", "fecha", "fecha_hora_inicio", "fecha_hora_fin"] },
                { model: PersonalSeguridad, as: "personal", attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "codigo_acceso"] },
                { model: PersonalSeguridad, as: "sereno", attributes: ["id", "nombres", "apellido_paterno", "apellido_materno", "codigo_acceso"] }
              ]
            },
            { model: Cuadrante, as: "datosCuadrante", attributes: ["id", "nombre", "cuadrante_code", "sector_id"] }
          ]
        },
        { model: Usuario, as: "creadorOperativosPersonalNovedades", attributes: ["id", "username", "nombres", "apellidos"] },
        { model: Usuario, as: "actualizadorOperativosPersonalNovedades", attributes: ["id", "username", "nombres", "apellidos"] }
      ]
    });

    
    // Analizar quién llenó qué campos
    const analisisCampos = analizarCamposLlenados(operativoVehiculo, operativoPersonal);

    // Determinar estado general y orden de llegada
    const { estadoGeneral, primerOperativo, segundoOperativo } = determinarEstadoGeneral(operativoVehiculo, operativoPersonal);

    const respuesta = {
      status: "success",
      message: "Operativos combinados obtenidos exitosamente",
      data: {
        novedad: novedad,
        operativo_vehiculo: {
          existe: !!operativoVehiculo,
          datos: operativoVehiculo || null,
          campos_llenados: analisisCampos.vehiculo.campos,
          acciones_tomadas: operativoVehiculo?.acciones_tomadas || null,
          observaciones: operativoVehiculo?.observaciones || null,
          fecha_registro: operativoVehiculo?.created_at || null,
          registrado_por: operativoVehiculo?.creadorOperativosVehiculosNovedades || null
        },
        operativo_personal: {
          existe: !!operativoPersonal,
          datos: operativoPersonal || null,
          campos_llenados: analisisCampos.personal.campos,
          acciones_tomadas: operativoPersonal?.acciones_tomadas || null,
          observaciones: operativoPersonal?.observaciones || null,
          fecha_registro: operativoPersonal?.created_at || null,
          registrado_por: operativoPersonal?.creadorOperativosPersonalNovedades || null
        },
        estado_general: estadoGeneral,
        primer_operativo: primerOperativo,
        segundo_operativo: segundoOperativo,
        resumen: {
          total_operativos: (operativoVehiculo ? 1 : 0) + (operativoPersonal ? 1 : 0),
          campos_principales_completos: analisisCampos.resumen.camposPrincipalesCompletos,
          campos_secundarios_completos: analisisCampos.resumen.camposSecundariosCompletos,
          ambos_operativos_presentes: !!operativoVehiculo && !!operativoPersonal
        }
      }
    };

    res.status(200).json(respuesta);

  } catch (error) {
    console.error("Error en getOperativosCombinadosPorNovedad:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

/**
 * Analiza qué campos fueron llenados por cada operativo
 * @param {object} operativoVehiculo - Datos del operativo de vehículo
 * @param {object} operativoPersonal - Datos del operativo de personal
 * @returns {object} Análisis de campos por operativo
 */
function analizarCamposLlenados(operativoVehiculo, operativoPersonal) {
  const analisis = {
    vehiculo: { campos: [] },
    personal: { campos: [] },
    resumen: {
      camposPrincipalesCompletos: [],
      camposSecundariosCompletos: []
    }
  };

  // Campos principales (solo el primero puede llenarlos)
  const camposPrincipales = ["resultado", "hora_llegada", "personas_afectadas", "perdidas_materiales"];

  if (operativoVehiculo) {
    camposPrincipales.forEach(campo => {
      if (operativoVehiculo[campo] !== null && operativoVehiculo[campo] !== undefined && operativoVehiculo[campo] !== "") {
        analisis.vehiculo.campos.push(campo);
        analisis.resumen.camposPrincipalesCompletos.push(campo);
      }
    });

    // Campos secundarios (ambos pueden llenarlos)
    if (operativoVehiculo.acciones_tomadas) analisis.vehiculo.campos.push("acciones_tomadas");
    if (operativoVehiculo.observaciones) analisis.vehiculo.campos.push("observaciones");
  }

  if (operativoPersonal) {
    // Campos secundarios (ambos pueden llenarlos)
    if (operativoPersonal.acciones_tomadas) analisis.personal.campos.push("acciones_tomadas");
    if (operativoPersonal.observaciones) analisis.personal.campos.push("observaciones");

    // Contar campos secundarios completos
    if (operativoPersonal.acciones_tomadas) analisis.resumen.camposSecundariosCompletos.push("acciones_tomadas_personal");
    if (operativoPersonal.observaciones) analisis.resumen.camposSecundariosCompletos.push("observaciones_personal");
  }

  // Agregar campos secundarios del vehículo al resumen
  if (operativoVehiculo?.acciones_tomadas) analisis.resumen.camposSecundariosCompletos.push("acciones_tomadas_vehiculo");
  if (operativoVehiculo?.observaciones) analisis.resumen.camposSecundariosCompletos.push("observaciones_vehiculo");

  return analisis;
}

/**
 * Determina el estado general y el orden de llegada de los operativos
 * @param {object} operativoVehiculo - Datos del operativo de vehículo
 * @param {object} operativoPersonal - Datos del operativo de personal
 * @returns {object} Estado general y orden de llegada
 */
function determinarEstadoGeneral(operativoVehiculo, operativoPersonal) {
  let estadoGeneral = "PENDIENTE";
  let primerOperativo = null;
  let segundoOperativo = null;

  // Determinar orden por fecha de creación
  if (operativoVehiculo && operativoPersonal) {
    if (new Date(operativoVehiculo.created_at) < new Date(operativoPersonal.created_at)) {
      primerOperativo = "vehiculo";
      segundoOperativo = "personal";
    } else {
      primerOperativo = "personal";
      segundoOperativo = "vehiculo";
    }
  } else if (operativoVehiculo) {
    primerOperativo = "vehiculo";
  } else if (operativoPersonal) {
    primerOperativo = "personal";
  }

  // Determinar estado general basado en los resultados
  const resultados = [];
  if (operativoVehiculo?.resultado) resultados.push(operativoVehiculo.resultado);
  if (operativoPersonal?.resultado) resultados.push(operativoPersonal.resultado);

  if (resultados.includes("RESUELTO")) {
    estadoGeneral = "RESUELTO";
  } else if (resultados.includes("ESCALADO")) {
    estadoGeneral = "ESCALADO";
  } else if (resultados.includes("CANCELADO")) {
    estadoGeneral = "CANCELADO";
  } else if (operativoVehiculo || operativoPersonal) {
    estadoGeneral = "EN_PROCESO";
  }

  return { estadoGeneral, primerOperativo, segundoOperativo };
}
