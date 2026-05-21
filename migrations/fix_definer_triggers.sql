USE citizen_security;

DROP TRIGGER IF EXISTS trg_actualizar_dias_inoperativos;
DROP TRIGGER IF EXISTS trg_calcular_tiempo_respuesta;
DROP TRIGGER IF EXISTS trg_calcular_tiempo_respuesta_operativo;
DROP TRIGGER IF EXISTS trg_direcciones_completa_insert;
DROP TRIGGER IF EXISTS trg_direcciones_completa_update;
DROP TRIGGER IF EXISTS trg_historial_estado_novedades_calcular_lapso_minutos;
DROP TRIGGER IF EXISTS trg_mantenimiento_correctivo_insert;
DROP TRIGGER IF EXISTS trg_mantenimiento_finalizado;

DELIMITER $$

CREATE TRIGGER trg_historial_estado_novedades_calcular_lapso_minutos
BEFORE INSERT ON historial_estado_novedades
FOR EACH ROW
BEGIN
  DECLARE fecha_anterior DATETIME;
  SELECT MAX(fecha_cambio) INTO fecha_anterior
  FROM historial_estado_novedades
  WHERE novedad_id = NEW.novedad_id;
  IF fecha_anterior IS NOT NULL THEN
    SET NEW.tiempo_en_estado_min = TIMESTAMPDIFF(MINUTE,
      DATE_FORMAT(fecha_anterior,'%Y-%m-%d %H:%i:00'),
      DATE_FORMAT(NEW.fecha_cambio,'%Y-%m-%d %H:%i:00'));
  ELSE
    SET NEW.tiempo_en_estado_min = NULL;
  END IF;
END$$

CREATE TRIGGER trg_calcular_tiempo_respuesta
BEFORE UPDATE ON novedades_incidentes
FOR EACH ROW
BEGIN
  IF NEW.fecha_llegada IS NOT NULL AND OLD.fecha_llegada IS NULL AND NEW.fecha_hora_ocurrencia IS NOT NULL THEN
    SET NEW.tiempo_respuesta_min = TIMESTAMPDIFF(MINUTE,
      DATE_FORMAT(NEW.fecha_hora_ocurrencia,'%Y-%m-%d %H:%i:00'),
      DATE_FORMAT(NEW.fecha_llegada,'%Y-%m-%d %H:%i:00'));
  END IF;
END$$

CREATE TRIGGER trg_calcular_tiempo_respuesta_operativo
BEFORE UPDATE ON novedades_incidentes
FOR EACH ROW
BEGIN
  IF NEW.fecha_llegada IS NOT NULL AND OLD.fecha_llegada IS NULL AND NEW.fecha_despacho IS NOT NULL THEN
    SET NEW.tiempo_respuesta_min_operativo = TIMESTAMPDIFF(MINUTE,
      DATE_FORMAT(NEW.fecha_despacho,'%Y-%m-%d %H:%i:00'),
      DATE_FORMAT(NEW.fecha_llegada,'%Y-%m-%d %H:%i:00'));
  END IF;
END$$

CREATE TRIGGER trg_direcciones_completa_insert
BEFORE INSERT ON direcciones
FOR EACH ROW
BEGIN
  DECLARE v_nombre_calle VARCHAR(250);
  SELECT nombre_completo INTO v_nombre_calle FROM calles WHERE id = NEW.calle_id;
  SET NEW.direccion_completa = CONCAT(
    v_nombre_calle,
    IFNULL(CONCAT(' N° ', NEW.numero_municipal), ''),
    IFNULL(CONCAT(' Mz. ', NEW.manzana), ''),
    IFNULL(CONCAT(' Lt. ', NEW.lote), ''),
    IFNULL(CONCAT(' - ', NEW.urbanizacion), ''),
    IF(NEW.tipo_complemento IS NOT NULL AND NEW.numero_complemento IS NOT NULL,
       CONCAT(' ', NEW.tipo_complemento, '. ', NEW.numero_complemento), '')
  );
END$$

CREATE TRIGGER trg_direcciones_completa_update
BEFORE UPDATE ON direcciones
FOR EACH ROW
BEGIN
  DECLARE v_nombre_calle VARCHAR(250);
  IF NEW.calle_id != OLD.calle_id
     OR IFNULL(NEW.numero_municipal,'') != IFNULL(OLD.numero_municipal,'')
     OR IFNULL(NEW.manzana,'') != IFNULL(OLD.manzana,'')
     OR IFNULL(NEW.lote,'') != IFNULL(OLD.lote,'')
     OR IFNULL(NEW.urbanizacion,'') != IFNULL(OLD.urbanizacion,'')
     OR IFNULL(NEW.tipo_complemento,'') != IFNULL(OLD.tipo_complemento,'')
     OR IFNULL(NEW.numero_complemento,'') != IFNULL(OLD.numero_complemento,'') THEN
    SELECT nombre_completo INTO v_nombre_calle FROM calles WHERE id = NEW.calle_id;
    SET NEW.direccion_completa = CONCAT(
      v_nombre_calle,
      IFNULL(CONCAT(' N° ', NEW.numero_municipal), ''),
      IFNULL(CONCAT(' Mz. ', NEW.manzana), ''),
      IFNULL(CONCAT(' Lt. ', NEW.lote), ''),
      IFNULL(CONCAT(' - ', NEW.urbanizacion), ''),
      IF(NEW.tipo_complemento IS NOT NULL AND NEW.numero_complemento IS NOT NULL,
         CONCAT(' ', NEW.tipo_complemento, '. ', NEW.numero_complemento), '')
    );
  END IF;
END$$

CREATE TRIGGER trg_actualizar_dias_inoperativos
AFTER UPDATE ON historial_desperfectos_vehiculo
FOR EACH ROW
BEGIN
  IF NEW.estado = 'RESUELTO' AND OLD.estado != 'RESUELTO' THEN
    SET @dias_inoperativo = DATEDIFF(COALESCE(NEW.fecha_resolucion, NOW()), NEW.fecha_reporte);
    UPDATE vehiculos
    SET dias_inoperativo_acumulado = dias_inoperativo_acumulado + GREATEST(@dias_inoperativo, 1),
        updated_at = NOW()
    WHERE id = NEW.vehiculo_id;
  END IF;
END$$

CREATE TRIGGER trg_mantenimiento_correctivo_insert
AFTER INSERT ON mantenimiento_vehiculos
FOR EACH ROW
BEGIN
  IF NEW.tipo_mantenimiento = 'CORRECTIVO' AND NEW.desperfecto_id IS NOT NULL THEN
    UPDATE vehiculos
    SET estado_operativo = 'REPARACION', fecha_ultimo_desperfecto = CURDATE(), updated_at = NOW()
    WHERE id = NEW.vehiculo_id;
    INSERT INTO historial_desperfectos_vehiculo (vehiculo_id, desperfecto_id, mantenimiento_id, estado, prioridad_reparacion)
    VALUES (NEW.vehiculo_id, NEW.desperfecto_id, NEW.id, 'EN_REPARACION', NEW.prioridad);
  END IF;
END$$

CREATE TRIGGER trg_mantenimiento_finalizado
AFTER UPDATE ON mantenimiento_vehiculos
FOR EACH ROW
BEGIN
  IF NEW.estado_mantenimiento = 'FINALIZADO' AND OLD.estado_mantenimiento != 'FINALIZADO' AND NEW.tipo_mantenimiento = 'CORRECTIVO' THEN
    UPDATE historial_desperfectos_vehiculo
    SET estado = 'RESUELTO', fecha_resolucion = NOW(), updated_at = NOW()
    WHERE mantenimiento_id = NEW.id;
    SET @desperfectos_pendientes = (
      SELECT COUNT(*) FROM historial_desperfectos_vehiculo
      WHERE vehiculo_id = NEW.vehiculo_id AND estado IN ('REPORTADO','EN_REPARACION')
    );
    IF @desperfectos_pendientes = 0 THEN
      UPDATE vehiculos
      SET estado_operativo = 'DISPONIBLE', fecha_proximo_mantenimiento = DATE_ADD(CURDATE(), INTERVAL 30 DAY), updated_at = NOW()
      WHERE id = NEW.vehiculo_id;
    ELSE
      UPDATE vehiculos SET estado_operativo = 'CON_DESPERFECTO', updated_at = NOW() WHERE id = NEW.vehiculo_id;
    END IF;
  END IF;
END$$

DELIMITER ;

SELECT TRIGGER_NAME, DEFINER, EVENT_OBJECT_TABLE, ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'citizen_security'
ORDER BY TRIGGER_NAME;
