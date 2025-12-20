-- =====================================================
-- SEED: Ubigeos del Perú (INEI) - Para Railway MySQL
-- Ejecutar en MySQL Workbench conectado a Railway
-- =====================================================

-- LIMA Metropolitana (43 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('150101', 'LIMA', 'LIMA', 'LIMA'),
('150102', 'LIMA', 'LIMA', 'ANCON'),
('150103', 'LIMA', 'LIMA', 'ATE'),
('150104', 'LIMA', 'LIMA', 'BARRANCO'),
('150105', 'LIMA', 'LIMA', 'BREÑA'),
('150106', 'LIMA', 'LIMA', 'CARABAYLLO'),
('150107', 'LIMA', 'LIMA', 'CHACLACAYO'),
('150108', 'LIMA', 'LIMA', 'CHORRILLOS'),
('150109', 'LIMA', 'LIMA', 'CIENEGUILLA'),
('150110', 'LIMA', 'LIMA', 'COMAS'),
('150111', 'LIMA', 'LIMA', 'EL AGUSTINO'),
('150112', 'LIMA', 'LIMA', 'INDEPENDENCIA'),
('150113', 'LIMA', 'LIMA', 'JESUS MARIA'),
('150114', 'LIMA', 'LIMA', 'LA MOLINA'),
('150115', 'LIMA', 'LIMA', 'LA VICTORIA'),
('150116', 'LIMA', 'LIMA', 'LINCE'),
('150117', 'LIMA', 'LIMA', 'LOS OLIVOS'),
('150118', 'LIMA', 'LIMA', 'LURIGANCHO'),
('150119', 'LIMA', 'LIMA', 'LURIN'),
('150120', 'LIMA', 'LIMA', 'MAGDALENA DEL MAR'),
('150121', 'LIMA', 'LIMA', 'PUEBLO LIBRE'),
('150122', 'LIMA', 'LIMA', 'MIRAFLORES'),
('150123', 'LIMA', 'LIMA', 'PACHACAMAC'),
('150124', 'LIMA', 'LIMA', 'PUCUSANA'),
('150125', 'LIMA', 'LIMA', 'PUENTE PIEDRA'),
('150126', 'LIMA', 'LIMA', 'PUNTA HERMOSA'),
('150127', 'LIMA', 'LIMA', 'PUNTA NEGRA'),
('150128', 'LIMA', 'LIMA', 'RIMAC'),
('150129', 'LIMA', 'LIMA', 'SAN BARTOLO'),
('150130', 'LIMA', 'LIMA', 'SAN BORJA'),
('150131', 'LIMA', 'LIMA', 'SAN ISIDRO'),
('150132', 'LIMA', 'LIMA', 'SAN JUAN DE LURIGANCHO'),
('150133', 'LIMA', 'LIMA', 'SAN JUAN DE MIRAFLORES'),
('150134', 'LIMA', 'LIMA', 'SAN LUIS'),
('150135', 'LIMA', 'LIMA', 'SAN MARTIN DE PORRES'),
('150136', 'LIMA', 'LIMA', 'SAN MIGUEL'),
('150137', 'LIMA', 'LIMA', 'SANTA ANITA'),
('150138', 'LIMA', 'LIMA', 'SANTA MARIA DEL MAR'),
('150139', 'LIMA', 'LIMA', 'SANTA ROSA'),
('150140', 'LIMA', 'LIMA', 'SANTIAGO DE SURCO'),
('150141', 'LIMA', 'LIMA', 'SURQUILLO'),
('150142', 'LIMA', 'LIMA', 'VILLA EL SALVADOR'),
('150143', 'LIMA', 'LIMA', 'VILLA MARIA DEL TRIUNFO');

-- CALLAO (7 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('070101', 'CALLAO', 'CALLAO', 'CALLAO'),
('070102', 'CALLAO', 'CALLAO', 'BELLAVISTA'),
('070103', 'CALLAO', 'CALLAO', 'CARMEN DE LA LEGUA REYNOSO'),
('070104', 'CALLAO', 'CALLAO', 'LA PERLA'),
('070105', 'CALLAO', 'CALLAO', 'LA PUNTA'),
('070106', 'CALLAO', 'CALLAO', 'VENTANILLA'),
('070107', 'CALLAO', 'CALLAO', 'MI PERU');

-- AREQUIPA (17 distritos principales)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('040101', 'AREQUIPA', 'AREQUIPA', 'AREQUIPA'),
('040102', 'AREQUIPA', 'AREQUIPA', 'ALTO SELVA ALEGRE'),
('040103', 'AREQUIPA', 'AREQUIPA', 'CAYMA'),
('040104', 'AREQUIPA', 'AREQUIPA', 'CERRO COLORADO'),
('040105', 'AREQUIPA', 'AREQUIPA', 'CHARACATO'),
('040106', 'AREQUIPA', 'AREQUIPA', 'CHIGUATA'),
('040107', 'AREQUIPA', 'AREQUIPA', 'JACOBO HUNTER'),
('040108', 'AREQUIPA', 'AREQUIPA', 'LA JOYA'),
('040109', 'AREQUIPA', 'AREQUIPA', 'MARIANO MELGAR'),
('040110', 'AREQUIPA', 'AREQUIPA', 'MIRAFLORES'),
('040111', 'AREQUIPA', 'AREQUIPA', 'MOLLEBAYA'),
('040112', 'AREQUIPA', 'AREQUIPA', 'PAUCARPATA'),
('040122', 'AREQUIPA', 'AREQUIPA', 'SOCABAYA'),
('040123', 'AREQUIPA', 'AREQUIPA', 'TIABAYA'),
('040124', 'AREQUIPA', 'AREQUIPA', 'UCHUMAYO'),
('040126', 'AREQUIPA', 'AREQUIPA', 'YANAHUARA'),
('040129', 'AREQUIPA', 'AREQUIPA', 'JOSE LUIS BUSTAMANTE Y RIVERO');

-- CUSCO (8 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('080101', 'CUSCO', 'CUSCO', 'CUSCO'),
('080102', 'CUSCO', 'CUSCO', 'CCORCA'),
('080103', 'CUSCO', 'CUSCO', 'POROY'),
('080104', 'CUSCO', 'CUSCO', 'SAN JERONIMO'),
('080105', 'CUSCO', 'CUSCO', 'SAN SEBASTIAN'),
('080106', 'CUSCO', 'CUSCO', 'SANTIAGO'),
('080107', 'CUSCO', 'CUSCO', 'SAYLLA'),
('080108', 'CUSCO', 'CUSCO', 'WANCHAQ');

-- LA LIBERTAD - TRUJILLO (9 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('130101', 'LA LIBERTAD', 'TRUJILLO', 'TRUJILLO'),
('130102', 'LA LIBERTAD', 'TRUJILLO', 'EL PORVENIR'),
('130103', 'LA LIBERTAD', 'TRUJILLO', 'FLORENCIA DE MORA'),
('130104', 'LA LIBERTAD', 'TRUJILLO', 'HUANCHACO'),
('130105', 'LA LIBERTAD', 'TRUJILLO', 'LA ESPERANZA'),
('130106', 'LA LIBERTAD', 'TRUJILLO', 'LAREDO'),
('130107', 'LA LIBERTAD', 'TRUJILLO', 'MOCHE'),
('130109', 'LA LIBERTAD', 'TRUJILLO', 'SALAVERRY'),
('130111', 'LA LIBERTAD', 'TRUJILLO', 'VICTOR LARCO HERRERA');

-- PIURA (4 distritos principales)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('200101', 'PIURA', 'PIURA', 'PIURA'),
('200104', 'PIURA', 'PIURA', 'CASTILLA'),
('200105', 'PIURA', 'PIURA', 'CATACAOS'),
('200115', 'PIURA', 'PIURA', 'VEINTISEIS DE OCTUBRE');

-- LAMBAYEQUE - CHICLAYO (4 distritos principales)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('140101', 'LAMBAYEQUE', 'CHICLAYO', 'CHICLAYO'),
('140105', 'LAMBAYEQUE', 'CHICLAYO', 'JOSE LEONARDO ORTIZ'),
('140106', 'LAMBAYEQUE', 'CHICLAYO', 'LA VICTORIA'),
('140112', 'LAMBAYEQUE', 'CHICLAYO', 'PIMENTEL');

-- ANCASH - HUARAZ y CHIMBOTE (4 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('020101', 'ANCASH', 'HUARAZ', 'HUARAZ'),
('020105', 'ANCASH', 'HUARAZ', 'INDEPENDENCIA'),
('021801', 'ANCASH', 'SANTA', 'CHIMBOTE'),
('021809', 'ANCASH', 'SANTA', 'NUEVO CHIMBOTE');

-- JUNIN - HUANCAYO (4 distritos principales)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('120101', 'JUNIN', 'HUANCAYO', 'HUANCAYO'),
('120107', 'JUNIN', 'HUANCAYO', 'CHILCA'),
('120114', 'JUNIN', 'HUANCAYO', 'EL TAMBO'),
('120125', 'JUNIN', 'HUANCAYO', 'PILCOMAYO');

-- ICA (6 distritos principales)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('110101', 'ICA', 'ICA', 'ICA'),
('110102', 'ICA', 'ICA', 'LA TINGUIÑA'),
('110106', 'ICA', 'ICA', 'PARCONA'),
('110110', 'ICA', 'ICA', 'SAN JUAN BAUTISTA'),
('110111', 'ICA', 'ICA', 'SANTIAGO'),
('110112', 'ICA', 'ICA', 'SUBTANJALLA');

-- TACNA (5 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('230101', 'TACNA', 'TACNA', 'TACNA'),
('230102', 'TACNA', 'TACNA', 'ALTO DE LA ALIANZA'),
('230104', 'TACNA', 'TACNA', 'CIUDAD NUEVA'),
('230108', 'TACNA', 'TACNA', 'POCOLLAY'),
('230110', 'TACNA', 'TACNA', 'CORONEL GREGORIO ALBARRACIN LANCHIPA');

-- PUNO (2 distritos principales)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('210101', 'PUNO', 'PUNO', 'PUNO'),
('211101', 'PUNO', 'SAN ROMAN', 'JULIACA');

-- LORETO - IQUITOS (4 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('160101', 'LORETO', 'MAYNAS', 'IQUITOS'),
('160108', 'LORETO', 'MAYNAS', 'PUNCHANA'),
('160112', 'LORETO', 'MAYNAS', 'BELEN'),
('160113', 'LORETO', 'MAYNAS', 'SAN JUAN BAUTISTA');

-- SAN MARTIN - TARAPOTO (3 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('220901', 'SAN MARTIN', 'SAN MARTIN', 'TARAPOTO'),
('220909', 'SAN MARTIN', 'SAN MARTIN', 'LA BANDA DE SHILCAYO'),
('220910', 'SAN MARTIN', 'SAN MARTIN', 'MORALES');

-- UCAYALI - PUCALLPA (3 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('250101', 'UCAYALI', 'CORONEL PORTILLO', 'CALLERIA'),
('250105', 'UCAYALI', 'CORONEL PORTILLO', 'YARINACOCHA'),
('250107', 'UCAYALI', 'CORONEL PORTILLO', 'MANANTAY');

-- CAJAMARCA (2 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('060101', 'CAJAMARCA', 'CAJAMARCA', 'CAJAMARCA'),
('060108', 'CAJAMARCA', 'CAJAMARCA', 'LOS BAÑOS DEL INCA');

-- AYACUCHO (4 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('050101', 'AYACUCHO', 'HUAMANGA', 'AYACUCHO'),
('050104', 'AYACUCHO', 'HUAMANGA', 'CARMEN ALTO'),
('050110', 'AYACUCHO', 'HUAMANGA', 'SAN JUAN BAUTISTA'),
('050115', 'AYACUCHO', 'HUAMANGA', 'JESUS NAZARENO');

-- HUANUCO (3 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('100101', 'HUANUCO', 'HUANUCO', 'HUANUCO'),
('100102', 'HUANUCO', 'HUANUCO', 'AMARILIS'),
('100111', 'HUANUCO', 'HUANUCO', 'PILLCO MARCA');

-- MADRE DE DIOS (1 distrito)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('170101', 'MADRE DE DIOS', 'TAMBOPATA', 'TAMBOPATA');

-- MOQUEGUA (2 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('180101', 'MOQUEGUA', 'MARISCAL NIETO', 'MOQUEGUA'),
('180104', 'MOQUEGUA', 'MARISCAL NIETO', 'SAMEGUA');

-- AMAZONAS (1 distrito)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('010101', 'AMAZONAS', 'CHACHAPOYAS', 'CHACHAPOYAS');

-- APURIMAC (2 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('030101', 'APURIMAC', 'ABANCAY', 'ABANCAY'),
('030109', 'APURIMAC', 'ABANCAY', 'TAMBURCO');

-- HUANCAVELICA (2 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('090101', 'HUANCAVELICA', 'HUANCAVELICA', 'HUANCAVELICA'),
('090118', 'HUANCAVELICA', 'HUANCAVELICA', 'ASCENSION');

-- PASCO (2 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('190101', 'PASCO', 'PASCO', 'CHAUPIMARCA'),
('190113', 'PASCO', 'PASCO', 'YANACANCHA');

-- TUMBES (2 distritos)
INSERT IGNORE INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('240101', 'TUMBES', 'TUMBES', 'TUMBES'),
('240102', 'TUMBES', 'TUMBES', 'CORRALES');

-- Verificar total insertado
SELECT COUNT(*) as total_ubigeos FROM ubigeo;
