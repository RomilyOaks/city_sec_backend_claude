/**
 * ===================================================
 * CONTROLADOR: PersonalSeguridad - Búsqueda Optimizada
 * ===================================================
 *
 * Ruta: src/controllers/personalController.js
 *
 * NUEVA FUNCIÓN: buscarParaDropdown()
 * 
 * Propósito: Búsqueda optimizada de personal para dropdowns grandes
 * - Búsqueda por apellidos con prefijo (más eficiente que LIKE %term%)
 * - Límite de resultados para evitar sobrecarga
 * - Campos optimizados para display en dropdowns
 * - Ordenamiento por apellidos para mejor UX
 */

// Agregar esta función al final del archivo personalController.js

/**
 * =====================================================
 * GET /api/personal/buscar-para-dropdown
 * =====================================================
 * Búsqueda optimizada de personal para dropdowns
 * 
 * Query params:
 * - q: término de búsqueda (mínimo 3 caracteres)
 * - limit: número de resultados (default 20, max 50)
 * 
 * Campos devueltos:
 * - id, nombres, apellido_paterno, apellido_materno
 * - doc_tipo, doc_numero, codigo_acceso
 * 
 * @access Requiere permiso de lectura de personal
 */
export const buscarPersonalParaDropdown = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    // Validaciones
    if (!q || q.length < 3) {
      return res.status(400).json({
        success: false,
        message: "El término de búsqueda debe tener al menos 3 caracteres",
        code: "INVALID_SEARCH_TERM"
      });
    }

    const limitNum = Math.min(parseInt(limit), 50);

    // Construir condición de búsqueda optimizada
    const searchConditions = [];
    const searchTerms = q.trim().split(/\s+/);

    if (searchTerms.length === 1) {
      // Búsqueda simple por un término
      searchConditions.push(
        { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
        { apellido_materno: { [Op.like]: `${searchTerms[0]}%` } },
        { nombres: { [Op.like]: `${searchTerms[0]}%` } }
      );
    } else if (searchTerms.length === 2) {
      // Búsqueda por dos términos (probablemente apellido paterno + materno)
      searchConditions.push(
        {
          [Op.and]: [
            { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
            { apellido_materno: { [Op.like]: `${searchTerms[1]}%` } }
          ]
        },
        {
          [Op.and]: [
            { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
            { nombres: { [Op.like]: `${searchTerms[1]}%` } }
          ]
        }
      );
    } else {
      // Búsqueda por más de dos términos
      searchConditions.push(
        {
          [Op.and]: [
            { apellido_paterno: { [Op.like]: `${searchTerms[0]}%` } },
            { apellido_materno: { [Op.like]: `${searchTerms[1]}%` } },
            { nombres: { [Op.like]: `${searchTerms.slice(2).join(' ')}%` } }
          ]
        }
      );
    }

    const personal = await PersonalSeguridad.findAll({
      where: {
        [Op.or]: searchConditions,
        estado: 'Activo',
        deleted_at: null
      },
      attributes: [
        'id',
        'nombres',
        'apellido_paterno',
        'apellido_materno',
        'doc_tipo',
        'doc_numero',
        'codigo_acceso'
      ],
      limit: limitNum,
      order: [
        ['apellido_paterno', 'ASC'],
        ['apellido_materno', 'ASC'],
        ['nombres', 'ASC']
      ]
    });

    // Formatear resultados para mejor UX
    const resultadosFormateados = personal.map(p => ({
      ...p.toJSON(),
      nombre_completo: `${p.apellido_paterno} ${p.apellido_materno}, ${p.nombres}`,
      documento: `${p.doc_tipo}-${p.doc_numero}`,
      display_text: `${p.apellido_paterno} ${p.apellido_materno}, ${p.nombres} (${p.doc_numero})`
    }));

    res.status(200).json({
      success: true,
      data: resultadosFormateados,
      meta: {
        query: q,
        count: resultadosFormateados.length,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error("❌ Error en buscarPersonalParaDropdown:", error);
    
    res.status(500).json({
      success: false,
      message: "Error al buscar personal para dropdown",
      error: error.message
    });
  }
};
