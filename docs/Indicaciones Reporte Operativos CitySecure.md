# Indicaciones para REPORTE DE OPERATIVOS DE PATRULLAJE

## Overview
Se entregan los querys de novedades atendidas por Patrullajes en Vehiculos y/o Personal a pie.

El objetivo es facilitar la correcta creacion de los endpoints necesarios para facilitar la consulta, resumenes y emision de los REPORTES DE OPERATIVOS DE PATRULLAJE (reportes, resúmenes y estadísticas por turnos, sectores, vehículos, personal a pie, cuadrantes de las novedades registradas y atendidas).



## 1. Query de Operativos de Patrullaje Vehicular 
(x) Correcciones a aplicar

-- -----------------------------------------------------------------------
-- Lista de Novedades atendidas por Operativos de Patrullaje con Vehiculos  
-- -----------------------------------------------------------------------

SELECT 
ot.id,
    ot.fecha fecha_turno,
    ht.nro_orden nro_orden_turno,
    ot.turno,
    ht.hora_inicio turno_horario_inicio,
    ht.hora_fin turno_horario_fin,
    ot.fecha_hora_inicio inicio_operativo_sector,
    ot.fecha_hora_fin fin_operativo_sector,
    ot.operador_id,
    CONCAT(ps_sis.nombres,
            ', ',
            ps_sis.apellido_paterno,
            ' ',
            ps_sis.apellido_materno) AS Usuario_Operador_Sistema,	-- (*) CORREGIDO
    carg_sis.nombre Cargo_Usuario_Operador,
    ot.sector_id,
    sec.sector_code,
    sec.nombre nombre_sector,
    ot.supervisor_id,
    CONCAT(ps1.nombres,
            ', ',
            ps1.apellido_paterno,
            ' ',
            ps1.apellido_materno) AS Supervisor_Sector,
    carg_sup.nombre Cargo_Supervisor,
    ot.observaciones observaciones_turno,
    ot.estado estado_operativo_sector,
    ot.updated_by as ID_Usuario_Actualizador_Turno,	-- (x) poner alias para evitar confusion
    CONCAT(usr4.username,
            ', ',
            usr4.nombres,
            ' ',
            usr4.apellidos) AS Usuario_Actualizador_Turno,
    carg_t.nombre Cargo_Usuario_Actualizador_Turno,
    ot.updated_at Fecha_Turno_Actualizado,
    ov.vehiculo_id,
    tv.nombre tipo_vehiculo,
    v.codigo_vehiculo,
    v.nombre nombre_vehiculo,
    v.placa placa_vehiculo,
    v.marca marca_vehiculo,
    v.soat soat_vehiculo,
    v.fec_soat vencimiento_soat,
    v.fec_manten proximo_mantenimiento_vehiculo,
    ov.conductor_id,
    CONCAT(ps2.nombres,
            ', ',
            ps2.apellido_paterno,
            ' ',
            ps2.apellido_materno) AS Nombres_conductor,   -- corregido
    carg_chof.nombre Cargo_Conductor,
    ov.copiloto_id,
    CONCAT(ps3.nombres,
            ', ',
            ps3.apellido_paterno,
            ' ',
            ps3.apellido_materno) AS Nombres_copiloto,
    carg_copi.nombre Cargo_Copiloto,
    ov.tipo_copiloto_id,
    tcp.descripcion tipo_copiloto,
    ov.radio_tetra_id,
    rt.radio_tetra_code,
    rt.descripcion Descripcion_Radio_Tetra,
    ov.estado_operativo_id ,
    Sts_Opr.descripcion estado_patrullaje_vehiculo,
    ov.kilometraje_inicio ,
    ov.hora_inicio,
    ov.nivel_combustible_inicio,
    ov.kilometraje_recarga,
    ov.hora_recarga,
    ov.combustible_litros,
    ov.importe_recarga,
    ov.nivel_combustible_recarga,
    ov.kilometraje_fin,
    ov.hora_fin,
    ov.nivel_combustible_fin,
    ov.kilometros_recorridos,
    ov.observaciones observaciones_operativo_vehicular,
    ov.estado_registro Estado_registro_Operativo_Vehicular,
    ov.updated_by as ID_Usuario_Actualiza_Operativo_Vehiculo,	-- (x) poner alias para evitar confusion
    CONCAT(usr3.username, ', ', usr3.nombres, ' ', usr3.apellidos) AS Usuario_Actualiza_Operativo_Vehiculo,
    carg_uov.nombre Cargo_Usuario_Actualiza_Operativo_Vehiculo, -- (y)
    ov.updated_at Actualizacion_Operativo_Vehiculo,
    ovc.cuadrante_id,
    cua.cuadrante_code,
    cua.nombre,
    cua.zona_code,
    ovc.hora_ingreso,
    ovc.hora_salida,
    ovc.tiempo_minutos,
    ovc.observaciones observaciones_operativo_cuadrante,
    ovc.incidentes_reportados incidentes_reportados_cuadrante,
    ovn.reportado,
    ovn.atendido,
    ovn.estado Estado_Operativo_Novedad,
    ovn.prioridad,
    ovn.observaciones Observaciones_Operativo_Novedad ,
    ovn.updated_by as ID_Usuario_Actualiza_Operativo_Novedad ,  -- (x) poner alias para evitar confusion
    CONCAT(usr2.username,
            ', ',
            usr2.nombres,
            ' ',
            usr2.apellidos) AS Usuario_Actualiza_Operativo_Novedad,
    carg.nombre cargo_Usuario_Actualiza_Operativo_Novedad,
    ovn.updated_at Operativo_Novedad_Actualizada,
    ovn.acciones_tomadas,
    ni.id novedad_id,
    ni.novedad_code,
    ni.fecha_hora_ocurrencia,
    tn.nombre AS tipo_novedad_nombre,
    ni.subtipo_novedad_id, stn.nombre, stn.prioridad Prioridad_Novedad,  
    ni.descripcion,
    ni.estado,
    ni.origen_llamada,
    ni.direccion_id,
    ni.localizacion,
    ni.referencia_ubicacion,
    ni.latitud,
    ni.longitud,
    ni.ajustado_en_mapa,
    ni.fecha_ajuste_mapa,
    -- ni.radio_tetra_id,  (z) ELIMINAR ESTA COLUMNA 
    ni.es_anonimo,
    ni.reportante_nombre,
    ni.reportante_telefono,
    ni.reportante_doc_identidad,
    ni.descripcion descripcion_novedad,
    ni.observaciones observaciones_novedad,
    ni.personal_cargo_id,
    CONCAT(ps_aCargo.nombres,
            ', ',
            ps_aCargo.apellido_paterno,
            ' ',
            ps_aCargo.apellido_materno) AS Nombres_Personal_a_Cargo,
    carg_aCargo.nombre Cargo_Personal,
    ni.fecha_despacho,
    ni.usuario_despacho,
    CONCAT(usr_desp.username,
            ', ',
            usr_desp.nombres,
            ' ',
            usr_desp.apellidos) AS nombre_usuario_despacho,
    carg_desp.nombre Cargo_Usuario_Despacho,
    ni.fecha_llegada,
    ni.fecha_cierre,
    ni.usuario_cierre,
    CONCAT(usr_cier.username,
            ', ',
            usr_cier.nombres,
            ' ',
            usr_cier.apellidos) AS nombre_usuario_cierre,
    carg_cier.nombre Cargo_Usuario_Cierre,
    ni.km_inicial,
    ni.km_final,
    stn.tiempo_respuesta_min Base_Tiempo_Minimo,
    ni.tiempo_respuesta_min,
    ni.tiempo_respuesta_min_operativo,
    ni.prioridad_actual,
    ni.requiere_seguimiento,
    ni.fecha_proxima_revision,
    ni.num_personas_afectadas,
    ni.perdidas_materiales_estimadas,
    ni.estado_novedad_id , en.nombre estado_novedad_actual
FROM
    novedades_incidentes ni
        INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id
		LEFT JOIN subtipos_novedad stn on ni.subtipo_novedad_id = stn.id 
        INNER JOIN operativos_vehiculos_novedades ovn ON ni.id = ovn.novedad_id
        INNER JOIN operativos_vehiculos_cuadrantes ovc ON ovn.operativo_vehiculo_cuadrante_id = ovc.id
        INNER JOIN operativos_vehiculos ov ON ovc.operativo_vehiculo_id = ov.id
        INNER JOIN operativos_turno ot ON ov.operativo_turno_id = ot.id
        INNER JOIN horarios_turnos ht ON ot.turno = ht.turno
        INNER JOIN personal_seguridad ps_sis ON ot.operador_id = ps_sis.id		-- INNER JOIN usuarios usr ON ot.operador_id = usr.id  (*) CORREGIDO 
        --  INNER JOIN personal_seguridad ps_sis ON usr.personal_seguridad_id = ps_sis.id   (*) ELIMINAR LINEA
        LEFT JOIN cargos carg_sis ON ps_sis.cargo_id = carg_sis.id
        INNER JOIN SECTORES sec ON ot.sector_id = sec.id
        INNER JOIN personal_seguridad ps1 ON ot.supervisor_id = ps1.id
        LEFT JOIN cargos carg_sup ON ps1.cargo_id = carg_sup.id
        INNER JOIN vehiculos v ON ov.vehiculo_id = v.id
        INNER JOIN tipos_vehiculo tv ON v.tipo_id = tv.id
        LEFT JOIN personal_seguridad ps2 ON ov.conductor_id = ps2.id
        LEFT JOIN cargos carg_chof ON ps2.cargo_id = carg_chof.id
        LEFT JOIN personal_seguridad ps3 ON ov.copiloto_id = ps3.id
        LEFT JOIN cargos carg_copi ON ps3.cargo_id = carg_copi.id
        LEFT JOIN tipos_copiloto tcp ON ov.tipo_copiloto_id = tcp.id
        LEFT JOIN radios_tetra rt ON ov.radio_tetra_id = rt.id
        INNER JOIN cuadrantes cua ON ovc.cuadrante_id = cua.id
        LEFT JOIN usuarios usr2 ON ovn.updated_by = usr2.id
        LEFT JOIN personal_seguridad ps4 ON usr2.personal_seguridad_id = ps4.id
        LEFT JOIN cargos carg ON ps4.cargo_id = carg.id
        LEFT JOIN usuarios usr3 ON ov.updated_by = usr3.id  -- (y)
        LEFT JOIN personal_seguridad ps_uov ON usr3.personal_seguridad_id = ps_uov.id -- (y)
        LEFT JOIN cargos carg_uov ON ps_uov.cargo_id = carg_uov.id   -- (y) CORREGIR
        LEFT JOIN usuarios usr4 ON ot.updated_by = usr4.id
        LEFT JOIN personal_seguridad ps_t ON usr4.personal_seguridad_id = ps_t.id
        LEFT JOIN cargos carg_t ON ps_t.cargo_id = carg_t.id
        LEFT JOIN personal_seguridad ps_aCa ON ni.personal_cargo_id = ps_aCa.id
        LEFT JOIN cargos carg_aCa ON ps_aCa.cargo_id = carg_aCa.id
        LEFT JOIN usuarios usr_desp ON ni.usuario_despacho = usr_desp.id
        LEFT JOIN personal_seguridad ps_desp ON usr_desp.personal_seguridad_id = ps_desp.id
        LEFT JOIN cargos carg_desp ON ps_desp.cargo_id = carg_desp.id
        LEFT JOIN usuarios usr_cier ON ni.usuario_cierre = usr_cier.id
        LEFT JOIN personal_seguridad ps_cier ON usr_cier.personal_seguridad_id = ps_cier.id
        LEFT JOIN cargos carg_cier ON ps_cier.cargo_id = carg_cier.id
 
LEFT JOIN personal_seguridad ps_aCargo ON ni.personal_cargo_id = ps_aCargo.id 	-- Nombres_Personal a Cargo
LEFT JOIN cargos carg_aCargo ON ps_aCargo.cargo_id = carg_aCargo.id 			-- Cargo_Personal a Cargo
    
LEFT JOIN estados_operativo_recurso Sts_Opr ON ov.estado_operativo_id = Sts_Opr.id

LEFT JOIN estados_novedad en ON ni.estado_novedad_id = en.id 	

WHERE
    DATE(ni.fecha_hora_ocurrencia) BETWEEN '2026-04-22' AND '2026-04-29'
        AND ni.estado = 1
        AND ni.deleted_at IS NULL

ORDER BY ot.fecha , ht.nro_orden , ot.fecha_hora_inicio;



## 2. Query de Operativos de Patrullaje a Pie

-- -----------------------------------------------------------------
-- Lista de Novedades atendidas por Operativos de Patrullaje a Pie  
-- -----------------------------------------------------------------

SELECT 
ot.fecha fecha_turno,
ht.nro_orden nro_orden_turno,
ot.turno, 
ht.hora_inicio turno_horario_inicio,
ht.hora_fin turno_horario_fin,
ot.fecha_hora_inicio inicio_operativo_sector,
ot.fecha_hora_fin fin_operativo_sector,
ot.operador_id,
-- CONCAT(usr.username,', ',usr.nombres,' ',usr.apellidos) as Operador_Sistema, (*) LINEA ANTERIOR
CONCAT(ps_sis.nombres,
            ', ',
            ps_sis.apellido_paterno,
            ' ',
            ps_sis.apellido_materno) AS Usuario_Operador_Sistema,	-- (*) NUEVA LINEA CORREGIDA
carg_sis.nombre Cargo_Usuario_Operador,            
ot.sector_id, sec.sector_code, sec.nombre nombre_sector,
ot.supervisor_id,
CONCAT(ps1.nombres,', ',ps1.apellido_paterno,' ',ps1.apellido_materno) as Supervisor_Sector,
CargSup.nombre Cargo_Supervisor,
ot.observaciones observaciones_turno,
ot.estado estado_operativo_sector,
ot.updated_by,
CONCAT(usr4.username,', ',usr4.nombres,' ',usr4.apellidos) as Usuario_Actualizador_Turno,
carg_t.nombre Cargo_Actualizador_Turno, ot.updated_at Fecha_Actualizador_Turno ,
ps2.doc_tipo, ps2.doc_numero,
CONCAT(ps2.nombres,', ',ps2.apellido_paterno,' ',ps2.apellido_materno) as Personal_asignado,
ps2.cargo_id, carg2.nombre Cargo_Personal_Asignado,
ps2.nacionalidad, ps2.status estado_personal_asignado, ps2.regimen,
op.sereno_id Personal_Auxiliar,
CONCAT(ps3.nombres,', ',ps3.apellido_paterno,' ',ps3.apellido_materno) as Nombres_Personal_Auxiliar,
carg_ser.nombre Cargo_Personal_Auxiliar,
op.radio_tetra_id,
rt.radio_tetra_code, rt.descripcion Descripcion_Radio_Tetra,
op.estado_operativo_id, 
Sts_Opr.descripcion estado_patrullaje_Pie,
op.tipo_patrullaje, op.chaleco_balistico, op.porra_policial, op.esposas, op.linterna, op.kit_primeros_auxilios,
op.hora_inicio hora_inicio_operativo, op.hora_fin hora_fin_operativo, 
op.observaciones observaciones_operativo_pie, 
op.estado_registro estado_operativo_pie,
op.updated_by,
CONCAT(usr3.username,', ',usr3.nombres,' ',usr3.apellidos) as Usuario_Actualizador_Patrullaje_Pie,
ps5.cargo_id,
carg5.nombre Cargo_Actualizador_Patrullaje_Pie,
op.updated_at Fecha_Actualizado_Patrullaje_Pie,
opc.cuadrante_id, cua.cuadrante_code, 
cua.nombre nombre_cuadrante, 
cua.zona_code,
opc.hora_ingreso, opc.hora_salida, opc.tiempo_minutos, 
opc.observaciones observaciones_operativo_cuadrante , opc.incidentes_reportados,
opn.reportado, opn.atendido, opn.resultado, opn.prioridad, 
opn.observaciones observaciones_operativo_novedad,
opn.updated_by,
CONCAT(usr2.username,', ',usr2.nombres,' ',usr2.apellidos) as Usuario_Actualizador_Novedad,
carg_n.nombre Cargo_Actualizador_Novedad, opn.updated_at Fecha_Actualizador_Novedad  ,
opn.acciones_tomadas, 
ni.id novedad_id, ni.novedad_code, ni.fecha_hora_ocurrencia, 
tn.nombre as tipo_novedad_nombre,
ni.subtipo_novedad_id, stn.nombre sub_tipo_novedad_nombre, stn.prioridad,  
ni.descripcion descripcion_novedad, 
ni.estado estado_novedad, ni.origen_llamada, ni.direccion_id, ni.localizacion, ni.referencia_ubicacion,
ni.latitud, ni.longitud, ni.ajustado_en_mapa, ni.fecha_ajuste_mapa, ni.radio_tetra_id, ni.es_anonimo,
ni.reportante_nombre, ni.reportante_telefono, ni.reportante_doc_identidad, 
ni.descripcion descripcion_novedad,
ni.observaciones observaciones_novedad, 
ni.personal_cargo_id, 
CONCAT(ps_aCargo.nombres,', ',ps_aCargo.apellido_paterno,' ',ps_aCargo.apellido_materno) as Nombres_Personal_a_Cargo,
carg_aCargo.nombre Cargo_Personal,
ni.fecha_despacho, ni.usuario_despacho,
CONCAT(usr_desp.username,', ',usr_desp.nombres,' ',usr_desp.apellidos) as nombre_usuario_despacho,
carg_desp.nombre Cargo_Despachador,
ni.fecha_llegada, ni.fecha_cierre,
ni.usuario_cierre,
CONCAT(usr_cier.username,', ',usr_cier.nombres,' ',usr_cier.apellidos) as nombre_usuario_cierre,
carg_cier.nombre Cargo_Usuario_Cierre,
ni.km_inicial, ni.km_final, 
stn.tiempo_respuesta_min Base_Tiempo_Minimo, ni.tiempo_respuesta_min, ni.tiempo_respuesta_min_operativo,
ni.prioridad_actual, ni.requiere_seguimiento, ni.fecha_proxima_revision, ni.num_personas_afectadas,
ni.perdidas_materiales_estimadas, 
ni.estado_novedad_id , en.nombre estado_novedad_actual 
FROM novedades_incidentes ni
INNER JOIN tipos_novedad tn ON ni.tipo_novedad_id = tn.id 
LEFT JOIN subtipos_novedad stn on ni.subtipo_novedad_id = stn.id 
INNER JOIN operativos_personal_novedades opn ON ni.id = opn.novedad_id 
INNER JOIN operativos_personal_cuadrantes opc ON opn.operativo_personal_cuadrante_id = opc.id 
INNER JOIN operativos_personal op ON opc.operativo_personal_id = op.id 
INNER JOIN operativos_turno ot ON op.operativo_turno_id = ot.id 
INNER JOIN horarios_turnos ht ON ot.turno = ht.turno 
--  INNER JOIN usuarios usr ON ot.operador_id = usr.id    (*) ELIMINAR LINEA
INNER JOIN personal_seguridad ps_sis ON ot.operador_id = ps_sis.id
LEFT JOIN cargos carg_sis ON ps_sis.cargo_id = carg_sis.id  -- (*) NUEVA LINEA AGREGADA
INNER JOIN SECTORES sec ON ot.sector_id = sec.id  
INNER JOIN personal_seguridad ps1 ON ot.supervisor_id = ps1.id   -- Supervisor Sector
LEFT JOIN cargos CargSup ON ps1.cargo_id = CargSup.id 

INNER JOIN personal_seguridad ps2 ON op.personal_id = ps2.id     -- Personal Asignado
LEFT JOIN cargos carg2 ON ps2.cargo_id = carg2.id 

LEFT JOIN personal_seguridad ps3 ON op.sereno_id = ps3.id        -- Sereno acompañante (opcional)
LEFT JOIN cargos carg_ser ON ps3.cargo_id = carg_ser.id 

LEFT JOIN citizen_security_v2.radios_tetra rt ON op.radio_tetra_id = rt.id 
INNER JOIN citizen_security_v2.cuadrantes cua ON opc.cuadrante_id = cua.id  

LEFT JOIN usuarios usr2 ON opn.updated_by = usr2.id  					-- Usuario_Actualizador_Novedad
LEFT JOIN personal_seguridad ps4 ON usr2.personal_seguridad_id = ps4.id -- Nombres_Usuario_Actualizador_Novedad
LEFT JOIN cargos carg_n ON ps4.cargo_id = carg_n.id 					-- Cargo_Usuario_Actualizador_Novedad

LEFT JOIN usuarios usr3 ON op.updated_by = usr3.id  						-- Usuario_Actualizador_Personal
LEFT JOIN personal_seguridad ps5 ON usr3.personal_seguridad_id = ps5.id 	-- Nombres_Usuario_Actualizador_Personal
LEFT JOIN cargos carg5 ON ps5.cargo_id = carg5.id 							-- Cargo_Usuario_Actualizador_Personal

LEFT JOIN usuarios usr4 ON ot.updated_by = usr4.id  						-- Usuario_Actualizador_Turno
LEFT JOIN personal_seguridad ps_t ON usr4.personal_seguridad_id = ps_t.id  	-- Nombres_Usuario_Actualizador_Turno
LEFT JOIN cargos carg_t ON ps_t.cargo_id = carg_t.id 						-- Cargo_Usuario_Actualizador_Turno 

LEFT JOIN usuarios usr_desp ON ni.usuario_despacho = usr_desp.id  					-- Usuario_Despacho
LEFT JOIN personal_seguridad ps_desp ON usr_desp.personal_seguridad_id = ps_desp.id -- Nombres_Usuario_Despacho
LEFT JOIN cargos carg_desp ON ps_desp.cargo_id = carg_desp.id 						-- Cargo_Usuario_Despacho

LEFT JOIN usuarios usr_cier ON ni.usuario_cierre = usr_cier.id  					-- Usuario_Cierre
LEFT JOIN personal_seguridad ps_cier ON usr_cier.personal_seguridad_id = ps_cier.id -- Nombres_Usuario_Cierre
LEFT JOIN cargos carg_cier ON ps_cier.cargo_id = carg_cier.id 						-- Cargo_Usuario_Cierre

LEFT JOIN personal_seguridad ps_aCargo ON ni.personal_cargo_id = ps_aCargo.id 	-- Nombres_Personal a Cargo
LEFT JOIN cargos carg_aCargo ON ps_aCargo.cargo_id = carg_aCargo.id 			-- Cargo_Personal a Cargo

LEFT JOIN estados_operativo_recurso Sts_Opr ON op.estado_operativo_id = Sts_Opr.id

LEFT JOIN estados_novedad en ON ni.estado_novedad_id = en.id 	

WHERE 
 DATE(ni.fecha_hora_ocurrencia) BETWEEN '2026-04-19' AND '2026-04-26'  AND 
 
ni.estado = 1 AND ni.deleted_at IS NULL 
ORDER BY ot.fecha, ht.nro_orden, ot.fecha_hora_inicio;




## 3. Query de Novedades no atendidas

-- -------------------------
-- Novedades no atendidas
-- -------------------------
SELECT * FROM novedades_incidentes ni
WHERE NOT exists( SELECT opn.novedad_id from operativos_personal_novedades opn WHERE ni.id = opn.novedad_id )
and DATE(ni.fecha_hora_ocurrencia) BETWEEN '2026-04-23' AND '2026-04-24' 
AND ni.estado = 1 AND ni.deleted_at IS NULL 
union 
SELECT * FROM novedades_incidentes ni
WHERE NOT exists( SELECT ovn.novedad_id from operativos_vehiculos_novedades ovn WHERE ni.id = ovn.novedad_id )
and DATE(ni.fecha_hora_ocurrencia) BETWEEN '2026-04-23' AND '2026-04-24' 
AND ni.estado = 1 AND ni.deleted_at IS NULL ;



## 4. Creacion de Endpoints 

En base a los querys proporcionados, crear en la carpeta "docs", un plan de trabajo con la implementacion de los endpoints que permitan contar con dicha informacion para reportes, consultas y estadisticos.



