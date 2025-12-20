-- =====================================================
-- SEED: Ubigeos del Perú (INEI)
-- Tabla: ubigeo
-- Formato: ubigeo_code (6 dígitos), departamento, provincia, distrito
-- =====================================================

-- Limpiar tabla existente
DELETE FROM ubigeo;

-- =====================================================
-- LIMA (Código 15)
-- =====================================================

-- Lima Metropolitana (1501)
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
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

-- Callao (Provincia Constitucional - Código 07)
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('070101', 'CALLAO', 'CALLAO', 'CALLAO'),
('070102', 'CALLAO', 'CALLAO', 'BELLAVISTA'),
('070103', 'CALLAO', 'CALLAO', 'CARMEN DE LA LEGUA REYNOSO'),
('070104', 'CALLAO', 'CALLAO', 'LA PERLA'),
('070105', 'CALLAO', 'CALLAO', 'LA PUNTA'),
('070106', 'CALLAO', 'CALLAO', 'VENTANILLA'),
('070107', 'CALLAO', 'CALLAO', 'MI PERU');

-- =====================================================
-- AREQUIPA (Código 04)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
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
('040113', 'AREQUIPA', 'AREQUIPA', 'POCSI'),
('040114', 'AREQUIPA', 'AREQUIPA', 'POLOBAYA'),
('040115', 'AREQUIPA', 'AREQUIPA', 'QUEQUEÑA'),
('040116', 'AREQUIPA', 'AREQUIPA', 'SABANDIA'),
('040117', 'AREQUIPA', 'AREQUIPA', 'SACHACA'),
('040118', 'AREQUIPA', 'AREQUIPA', 'SAN JUAN DE SIGUAS'),
('040119', 'AREQUIPA', 'AREQUIPA', 'SAN JUAN DE TARUCANI'),
('040120', 'AREQUIPA', 'AREQUIPA', 'SANTA ISABEL DE SIGUAS'),
('040121', 'AREQUIPA', 'AREQUIPA', 'SANTA RITA DE SIGUAS'),
('040122', 'AREQUIPA', 'AREQUIPA', 'SOCABAYA'),
('040123', 'AREQUIPA', 'AREQUIPA', 'TIABAYA'),
('040124', 'AREQUIPA', 'AREQUIPA', 'UCHUMAYO'),
('040125', 'AREQUIPA', 'AREQUIPA', 'VITOR'),
('040126', 'AREQUIPA', 'AREQUIPA', 'YANAHUARA'),
('040127', 'AREQUIPA', 'AREQUIPA', 'YARABAMBA'),
('040128', 'AREQUIPA', 'AREQUIPA', 'YURA'),
('040129', 'AREQUIPA', 'AREQUIPA', 'JOSE LUIS BUSTAMANTE Y RIVERO');

-- =====================================================
-- CUSCO (Código 08)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('080101', 'CUSCO', 'CUSCO', 'CUSCO'),
('080102', 'CUSCO', 'CUSCO', 'CCORCA'),
('080103', 'CUSCO', 'CUSCO', 'POROY'),
('080104', 'CUSCO', 'CUSCO', 'SAN JERONIMO'),
('080105', 'CUSCO', 'CUSCO', 'SAN SEBASTIAN'),
('080106', 'CUSCO', 'CUSCO', 'SANTIAGO'),
('080107', 'CUSCO', 'CUSCO', 'SAYLLA'),
('080108', 'CUSCO', 'CUSCO', 'WANCHAQ');

-- =====================================================
-- LA LIBERTAD (Código 13)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('130101', 'LA LIBERTAD', 'TRUJILLO', 'TRUJILLO'),
('130102', 'LA LIBERTAD', 'TRUJILLO', 'EL PORVENIR'),
('130103', 'LA LIBERTAD', 'TRUJILLO', 'FLORENCIA DE MORA'),
('130104', 'LA LIBERTAD', 'TRUJILLO', 'HUANCHACO'),
('130105', 'LA LIBERTAD', 'TRUJILLO', 'LA ESPERANZA'),
('130106', 'LA LIBERTAD', 'TRUJILLO', 'LAREDO'),
('130107', 'LA LIBERTAD', 'TRUJILLO', 'MOCHE'),
('130108', 'LA LIBERTAD', 'TRUJILLO', 'POROTO'),
('130109', 'LA LIBERTAD', 'TRUJILLO', 'SALAVERRY'),
('130110', 'LA LIBERTAD', 'TRUJILLO', 'SIMBAL'),
('130111', 'LA LIBERTAD', 'TRUJILLO', 'VICTOR LARCO HERRERA');

-- =====================================================
-- PIURA (Código 20)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('200101', 'PIURA', 'PIURA', 'PIURA'),
('200104', 'PIURA', 'PIURA', 'CASTILLA'),
('200105', 'PIURA', 'PIURA', 'CATACAOS'),
('200107', 'PIURA', 'PIURA', 'CURA MORI'),
('200108', 'PIURA', 'PIURA', 'EL TALLAN'),
('200109', 'PIURA', 'PIURA', 'LA ARENA'),
('200110', 'PIURA', 'PIURA', 'LA UNION'),
('200111', 'PIURA', 'PIURA', 'LAS LOMAS'),
('200114', 'PIURA', 'PIURA', 'TAMBO GRANDE'),
('200115', 'PIURA', 'PIURA', 'VEINTISEIS DE OCTUBRE');

-- =====================================================
-- LAMBAYEQUE (Código 14)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('140101', 'LAMBAYEQUE', 'CHICLAYO', 'CHICLAYO'),
('140102', 'LAMBAYEQUE', 'CHICLAYO', 'CHONGOYAPE'),
('140103', 'LAMBAYEQUE', 'CHICLAYO', 'ETEN'),
('140104', 'LAMBAYEQUE', 'CHICLAYO', 'ETEN PUERTO'),
('140105', 'LAMBAYEQUE', 'CHICLAYO', 'JOSE LEONARDO ORTIZ'),
('140106', 'LAMBAYEQUE', 'CHICLAYO', 'LA VICTORIA'),
('140107', 'LAMBAYEQUE', 'CHICLAYO', 'LAGUNAS'),
('140108', 'LAMBAYEQUE', 'CHICLAYO', 'MONSEFU'),
('140109', 'LAMBAYEQUE', 'CHICLAYO', 'NUEVA ARICA'),
('140110', 'LAMBAYEQUE', 'CHICLAYO', 'OYOTUN'),
('140111', 'LAMBAYEQUE', 'CHICLAYO', 'PICSI'),
('140112', 'LAMBAYEQUE', 'CHICLAYO', 'PIMENTEL'),
('140113', 'LAMBAYEQUE', 'CHICLAYO', 'REQUE'),
('140114', 'LAMBAYEQUE', 'CHICLAYO', 'SANTA ROSA'),
('140115', 'LAMBAYEQUE', 'CHICLAYO', 'SAÑA'),
('140116', 'LAMBAYEQUE', 'CHICLAYO', 'CAYALTI'),
('140117', 'LAMBAYEQUE', 'CHICLAYO', 'PATAPO'),
('140118', 'LAMBAYEQUE', 'CHICLAYO', 'POMALCA'),
('140119', 'LAMBAYEQUE', 'CHICLAYO', 'PUCALA'),
('140120', 'LAMBAYEQUE', 'CHICLAYO', 'TUMAN');

-- =====================================================
-- ANCASH (Código 02)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('020101', 'ANCASH', 'HUARAZ', 'HUARAZ'),
('020102', 'ANCASH', 'HUARAZ', 'COCHABAMBA'),
('020103', 'ANCASH', 'HUARAZ', 'COLCABAMBA'),
('020104', 'ANCASH', 'HUARAZ', 'HUANCHAY'),
('020105', 'ANCASH', 'HUARAZ', 'INDEPENDENCIA'),
('020106', 'ANCASH', 'HUARAZ', 'JANGAS'),
('020107', 'ANCASH', 'HUARAZ', 'LA LIBERTAD'),
('020108', 'ANCASH', 'HUARAZ', 'OLLEROS'),
('020109', 'ANCASH', 'HUARAZ', 'PAMPAS GRANDE'),
('020110', 'ANCASH', 'HUARAZ', 'PARIACOTO'),
('020111', 'ANCASH', 'HUARAZ', 'PIRA'),
('020112', 'ANCASH', 'HUARAZ', 'TARICA');

-- Chimbote
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('021801', 'ANCASH', 'SANTA', 'CHIMBOTE'),
('021802', 'ANCASH', 'SANTA', 'CACERES DEL PERU'),
('021803', 'ANCASH', 'SANTA', 'COISHCO'),
('021804', 'ANCASH', 'SANTA', 'MACATE'),
('021805', 'ANCASH', 'SANTA', 'MORO'),
('021806', 'ANCASH', 'SANTA', 'NEPEÑA'),
('021807', 'ANCASH', 'SANTA', 'SAMANCO'),
('021808', 'ANCASH', 'SANTA', 'SANTA'),
('021809', 'ANCASH', 'SANTA', 'NUEVO CHIMBOTE');

-- =====================================================
-- JUNIN (Código 12)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('120101', 'JUNIN', 'HUANCAYO', 'HUANCAYO'),
('120104', 'JUNIN', 'HUANCAYO', 'CARHUACALLANGA'),
('120105', 'JUNIN', 'HUANCAYO', 'CHACAPAMPA'),
('120106', 'JUNIN', 'HUANCAYO', 'CHICCHE'),
('120107', 'JUNIN', 'HUANCAYO', 'CHILCA'),
('120108', 'JUNIN', 'HUANCAYO', 'CHONGOS ALTO'),
('120111', 'JUNIN', 'HUANCAYO', 'CHUPURO'),
('120112', 'JUNIN', 'HUANCAYO', 'COLCA'),
('120113', 'JUNIN', 'HUANCAYO', 'CULLHUAS'),
('120114', 'JUNIN', 'HUANCAYO', 'EL TAMBO'),
('120116', 'JUNIN', 'HUANCAYO', 'HUACRAPUQUIO'),
('120117', 'JUNIN', 'HUANCAYO', 'HUALHUAS'),
('120119', 'JUNIN', 'HUANCAYO', 'HUANCAN'),
('120120', 'JUNIN', 'HUANCAYO', 'HUASICANCHA'),
('120121', 'JUNIN', 'HUANCAYO', 'HUAYUCACHI'),
('120122', 'JUNIN', 'HUANCAYO', 'INGENIO'),
('120124', 'JUNIN', 'HUANCAYO', 'PARIAHUANCA'),
('120125', 'JUNIN', 'HUANCAYO', 'PILCOMAYO'),
('120126', 'JUNIN', 'HUANCAYO', 'PUCARA'),
('120127', 'JUNIN', 'HUANCAYO', 'QUICHUAY'),
('120128', 'JUNIN', 'HUANCAYO', 'QUILCAS'),
('120129', 'JUNIN', 'HUANCAYO', 'SAN AGUSTIN'),
('120130', 'JUNIN', 'HUANCAYO', 'SAN JERONIMO DE TUNAN'),
('120132', 'JUNIN', 'HUANCAYO', 'SAÑO'),
('120133', 'JUNIN', 'HUANCAYO', 'SAPALLANGA'),
('120134', 'JUNIN', 'HUANCAYO', 'SICAYA'),
('120135', 'JUNIN', 'HUANCAYO', 'SANTO DOMINGO DE ACOBAMBA'),
('120136', 'JUNIN', 'HUANCAYO', 'VIQUES');

-- =====================================================
-- ICA (Código 11)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('110101', 'ICA', 'ICA', 'ICA'),
('110102', 'ICA', 'ICA', 'LA TINGUIÑA'),
('110103', 'ICA', 'ICA', 'LOS AQUIJES'),
('110104', 'ICA', 'ICA', 'OCUCAJE'),
('110105', 'ICA', 'ICA', 'PACHACUTEC'),
('110106', 'ICA', 'ICA', 'PARCONA'),
('110107', 'ICA', 'ICA', 'PUEBLO NUEVO'),
('110108', 'ICA', 'ICA', 'SALAS'),
('110109', 'ICA', 'ICA', 'SAN JOSE DE LOS MOLINOS'),
('110110', 'ICA', 'ICA', 'SAN JUAN BAUTISTA'),
('110111', 'ICA', 'ICA', 'SANTIAGO'),
('110112', 'ICA', 'ICA', 'SUBTANJALLA'),
('110113', 'ICA', 'ICA', 'TATE'),
('110114', 'ICA', 'ICA', 'YAUCA DEL ROSARIO');

-- =====================================================
-- TACNA (Código 23)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('230101', 'TACNA', 'TACNA', 'TACNA'),
('230102', 'TACNA', 'TACNA', 'ALTO DE LA ALIANZA'),
('230103', 'TACNA', 'TACNA', 'CALANA'),
('230104', 'TACNA', 'TACNA', 'CIUDAD NUEVA'),
('230105', 'TACNA', 'TACNA', 'INCLAN'),
('230106', 'TACNA', 'TACNA', 'PACHIA'),
('230107', 'TACNA', 'TACNA', 'PALCA'),
('230108', 'TACNA', 'TACNA', 'POCOLLAY'),
('230109', 'TACNA', 'TACNA', 'SAMA'),
('230110', 'TACNA', 'TACNA', 'CORONEL GREGORIO ALBARRACIN LANCHIPA');

-- =====================================================
-- PUNO (Código 21)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('210101', 'PUNO', 'PUNO', 'PUNO'),
('210102', 'PUNO', 'PUNO', 'ACORA'),
('210103', 'PUNO', 'PUNO', 'AMANTANI'),
('210104', 'PUNO', 'PUNO', 'ATUNCOLLA'),
('210105', 'PUNO', 'PUNO', 'CAPACHICA'),
('210106', 'PUNO', 'PUNO', 'CHUCUITO'),
('210107', 'PUNO', 'PUNO', 'COATA'),
('210108', 'PUNO', 'PUNO', 'HUATA'),
('210109', 'PUNO', 'PUNO', 'MAÑAZO'),
('210110', 'PUNO', 'PUNO', 'PAUCARCOLLA'),
('210111', 'PUNO', 'PUNO', 'PICHACANI'),
('210112', 'PUNO', 'PUNO', 'PLATERIA'),
('210113', 'PUNO', 'PUNO', 'SAN ANTONIO'),
('210114', 'PUNO', 'PUNO', 'TIQUILLACA'),
('210115', 'PUNO', 'PUNO', 'VILQUE');

-- Juliaca
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('211101', 'PUNO', 'SAN ROMAN', 'JULIACA'),
('211102', 'PUNO', 'SAN ROMAN', 'CABANA'),
('211103', 'PUNO', 'SAN ROMAN', 'CABANILLAS'),
('211104', 'PUNO', 'SAN ROMAN', 'CARACOTO'),
('211105', 'PUNO', 'SAN ROMAN', 'SAN MIGUEL');

-- =====================================================
-- LORETO (Código 16)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('160101', 'LORETO', 'MAYNAS', 'IQUITOS'),
('160102', 'LORETO', 'MAYNAS', 'ALTO NANAY'),
('160103', 'LORETO', 'MAYNAS', 'FERNANDO LORES'),
('160104', 'LORETO', 'MAYNAS', 'INDIANA'),
('160105', 'LORETO', 'MAYNAS', 'LAS AMAZONAS'),
('160106', 'LORETO', 'MAYNAS', 'MAZAN'),
('160107', 'LORETO', 'MAYNAS', 'NAPO'),
('160108', 'LORETO', 'MAYNAS', 'PUNCHANA'),
('160109', 'LORETO', 'MAYNAS', 'PUTUMAYO'),
('160110', 'LORETO', 'MAYNAS', 'TORRES CAUSANA'),
('160112', 'LORETO', 'MAYNAS', 'BELEN'),
('160113', 'LORETO', 'MAYNAS', 'SAN JUAN BAUTISTA');

-- =====================================================
-- SAN MARTIN (Código 22)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('220901', 'SAN MARTIN', 'SAN MARTIN', 'TARAPOTO'),
('220902', 'SAN MARTIN', 'SAN MARTIN', 'ALBERTO LEVEAU'),
('220903', 'SAN MARTIN', 'SAN MARTIN', 'CACATACHI'),
('220904', 'SAN MARTIN', 'SAN MARTIN', 'CHAZUTA'),
('220905', 'SAN MARTIN', 'SAN MARTIN', 'CHIPURANA'),
('220906', 'SAN MARTIN', 'SAN MARTIN', 'EL PORVENIR'),
('220907', 'SAN MARTIN', 'SAN MARTIN', 'HUIMBAYOC'),
('220908', 'SAN MARTIN', 'SAN MARTIN', 'JUAN GUERRA'),
('220909', 'SAN MARTIN', 'SAN MARTIN', 'LA BANDA DE SHILCAYO'),
('220910', 'SAN MARTIN', 'SAN MARTIN', 'MORALES'),
('220911', 'SAN MARTIN', 'SAN MARTIN', 'PAPAPLAYA'),
('220912', 'SAN MARTIN', 'SAN MARTIN', 'SAN ANTONIO'),
('220913', 'SAN MARTIN', 'SAN MARTIN', 'SAUCE'),
('220914', 'SAN MARTIN', 'SAN MARTIN', 'SHAPAJA');

-- =====================================================
-- UCAYALI (Código 25)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('250101', 'UCAYALI', 'CORONEL PORTILLO', 'CALLERIA'),
('250102', 'UCAYALI', 'CORONEL PORTILLO', 'CAMPOVERDE'),
('250103', 'UCAYALI', 'CORONEL PORTILLO', 'IPARIA'),
('250104', 'UCAYALI', 'CORONEL PORTILLO', 'MASISEA'),
('250105', 'UCAYALI', 'CORONEL PORTILLO', 'YARINACOCHA'),
('250106', 'UCAYALI', 'CORONEL PORTILLO', 'NUEVA REQUENA'),
('250107', 'UCAYALI', 'CORONEL PORTILLO', 'MANANTAY');

-- =====================================================
-- CAJAMARCA (Código 06)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('060101', 'CAJAMARCA', 'CAJAMARCA', 'CAJAMARCA'),
('060102', 'CAJAMARCA', 'CAJAMARCA', 'ASUNCION'),
('060103', 'CAJAMARCA', 'CAJAMARCA', 'CHETILLA'),
('060104', 'CAJAMARCA', 'CAJAMARCA', 'COSPAN'),
('060105', 'CAJAMARCA', 'CAJAMARCA', 'ENCAÑADA'),
('060106', 'CAJAMARCA', 'CAJAMARCA', 'JESUS'),
('060107', 'CAJAMARCA', 'CAJAMARCA', 'LLACANORA'),
('060108', 'CAJAMARCA', 'CAJAMARCA', 'LOS BAÑOS DEL INCA'),
('060109', 'CAJAMARCA', 'CAJAMARCA', 'MAGDALENA'),
('060110', 'CAJAMARCA', 'CAJAMARCA', 'MATARA'),
('060111', 'CAJAMARCA', 'CAJAMARCA', 'NAMORA'),
('060112', 'CAJAMARCA', 'CAJAMARCA', 'SAN JUAN');

-- =====================================================
-- AYACUCHO (Código 05)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('050101', 'AYACUCHO', 'HUAMANGA', 'AYACUCHO'),
('050102', 'AYACUCHO', 'HUAMANGA', 'ACOCRO'),
('050103', 'AYACUCHO', 'HUAMANGA', 'ACOS VINCHOS'),
('050104', 'AYACUCHO', 'HUAMANGA', 'CARMEN ALTO'),
('050105', 'AYACUCHO', 'HUAMANGA', 'CHIARA'),
('050106', 'AYACUCHO', 'HUAMANGA', 'OCROS'),
('050107', 'AYACUCHO', 'HUAMANGA', 'PACAYCASA'),
('050108', 'AYACUCHO', 'HUAMANGA', 'QUINUA'),
('050109', 'AYACUCHO', 'HUAMANGA', 'SAN JOSE DE TICLLAS'),
('050110', 'AYACUCHO', 'HUAMANGA', 'SAN JUAN BAUTISTA'),
('050111', 'AYACUCHO', 'HUAMANGA', 'SANTIAGO DE PISCHA'),
('050112', 'AYACUCHO', 'HUAMANGA', 'SOCOS'),
('050113', 'AYACUCHO', 'HUAMANGA', 'TAMBILLO'),
('050114', 'AYACUCHO', 'HUAMANGA', 'VINCHOS'),
('050115', 'AYACUCHO', 'HUAMANGA', 'JESUS NAZARENO'),
('050116', 'AYACUCHO', 'HUAMANGA', 'ANDRES AVELINO CACERES DORREGARAY');

-- =====================================================
-- HUANUCO (Código 10)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('100101', 'HUANUCO', 'HUANUCO', 'HUANUCO'),
('100102', 'HUANUCO', 'HUANUCO', 'AMARILIS'),
('100103', 'HUANUCO', 'HUANUCO', 'CHINCHAO'),
('100104', 'HUANUCO', 'HUANUCO', 'CHURUBAMBA'),
('100105', 'HUANUCO', 'HUANUCO', 'MARGOS'),
('100106', 'HUANUCO', 'HUANUCO', 'QUISQUI'),
('100107', 'HUANUCO', 'HUANUCO', 'SAN FRANCISCO DE CAYRAN'),
('100108', 'HUANUCO', 'HUANUCO', 'SAN PEDRO DE CHAULAN'),
('100109', 'HUANUCO', 'HUANUCO', 'SANTA MARIA DEL VALLE'),
('100110', 'HUANUCO', 'HUANUCO', 'YARUMAYO'),
('100111', 'HUANUCO', 'HUANUCO', 'PILLCO MARCA'),
('100112', 'HUANUCO', 'HUANUCO', 'YACUS'),
('100113', 'HUANUCO', 'HUANUCO', 'SAN PABLO DE PILLAO');

-- =====================================================
-- MADRE DE DIOS (Código 17)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('170101', 'MADRE DE DIOS', 'TAMBOPATA', 'TAMBOPATA'),
('170102', 'MADRE DE DIOS', 'TAMBOPATA', 'INAMBARI'),
('170103', 'MADRE DE DIOS', 'TAMBOPATA', 'LAS PIEDRAS'),
('170104', 'MADRE DE DIOS', 'TAMBOPATA', 'LABERINTO');

-- =====================================================
-- MOQUEGUA (Código 18)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('180101', 'MOQUEGUA', 'MARISCAL NIETO', 'MOQUEGUA'),
('180102', 'MOQUEGUA', 'MARISCAL NIETO', 'CARUMAS'),
('180103', 'MOQUEGUA', 'MARISCAL NIETO', 'CUCHUMBAYA'),
('180104', 'MOQUEGUA', 'MARISCAL NIETO', 'SAMEGUA'),
('180105', 'MOQUEGUA', 'MARISCAL NIETO', 'SAN CRISTOBAL'),
('180106', 'MOQUEGUA', 'MARISCAL NIETO', 'TORATA');

-- =====================================================
-- AMAZONAS (Código 01)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('010101', 'AMAZONAS', 'CHACHAPOYAS', 'CHACHAPOYAS'),
('010102', 'AMAZONAS', 'CHACHAPOYAS', 'ASUNCION'),
('010103', 'AMAZONAS', 'CHACHAPOYAS', 'BALSAS'),
('010104', 'AMAZONAS', 'CHACHAPOYAS', 'CHETO'),
('010105', 'AMAZONAS', 'CHACHAPOYAS', 'CHILIQUIN'),
('010106', 'AMAZONAS', 'CHACHAPOYAS', 'CHUQUIBAMBA'),
('010107', 'AMAZONAS', 'CHACHAPOYAS', 'GRANADA'),
('010108', 'AMAZONAS', 'CHACHAPOYAS', 'HUANCAS'),
('010109', 'AMAZONAS', 'CHACHAPOYAS', 'LA JALCA'),
('010110', 'AMAZONAS', 'CHACHAPOYAS', 'LEIMEBAMBA'),
('010111', 'AMAZONAS', 'CHACHAPOYAS', 'LEVANTO'),
('010112', 'AMAZONAS', 'CHACHAPOYAS', 'MAGDALENA'),
('010113', 'AMAZONAS', 'CHACHAPOYAS', 'MARISCAL CASTILLA'),
('010114', 'AMAZONAS', 'CHACHAPOYAS', 'MOLINOPAMPA'),
('010115', 'AMAZONAS', 'CHACHAPOYAS', 'MONTEVIDEO'),
('010116', 'AMAZONAS', 'CHACHAPOYAS', 'OLLEROS'),
('010117', 'AMAZONAS', 'CHACHAPOYAS', 'QUINJALCA'),
('010118', 'AMAZONAS', 'CHACHAPOYAS', 'SAN FRANCISCO DE DAGUAS'),
('010119', 'AMAZONAS', 'CHACHAPOYAS', 'SAN ISIDRO DE MAINO'),
('010120', 'AMAZONAS', 'CHACHAPOYAS', 'SOLOCO'),
('010121', 'AMAZONAS', 'CHACHAPOYAS', 'SONCHE');

-- =====================================================
-- APURIMAC (Código 03)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('030101', 'APURIMAC', 'ABANCAY', 'ABANCAY'),
('030102', 'APURIMAC', 'ABANCAY', 'CHACOCHE'),
('030103', 'APURIMAC', 'ABANCAY', 'CIRCA'),
('030104', 'APURIMAC', 'ABANCAY', 'CURAHUASI'),
('030105', 'APURIMAC', 'ABANCAY', 'HUANIPACA'),
('030106', 'APURIMAC', 'ABANCAY', 'LAMBRAMA'),
('030107', 'APURIMAC', 'ABANCAY', 'PICHIRHUA'),
('030108', 'APURIMAC', 'ABANCAY', 'SAN PEDRO DE CACHORA'),
('030109', 'APURIMAC', 'ABANCAY', 'TAMBURCO');

-- =====================================================
-- HUANCAVELICA (Código 09)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('090101', 'HUANCAVELICA', 'HUANCAVELICA', 'HUANCAVELICA'),
('090102', 'HUANCAVELICA', 'HUANCAVELICA', 'ACOBAMBILLA'),
('090103', 'HUANCAVELICA', 'HUANCAVELICA', 'ACORIA'),
('090104', 'HUANCAVELICA', 'HUANCAVELICA', 'CONAYCA'),
('090105', 'HUANCAVELICA', 'HUANCAVELICA', 'CUENCA'),
('090106', 'HUANCAVELICA', 'HUANCAVELICA', 'HUACHOCOLPA'),
('090107', 'HUANCAVELICA', 'HUANCAVELICA', 'HUAYLLAHUARA'),
('090108', 'HUANCAVELICA', 'HUANCAVELICA', 'IZCUCHACA'),
('090109', 'HUANCAVELICA', 'HUANCAVELICA', 'LARIA'),
('090110', 'HUANCAVELICA', 'HUANCAVELICA', 'MANTA'),
('090111', 'HUANCAVELICA', 'HUANCAVELICA', 'MARISCAL CACERES'),
('090112', 'HUANCAVELICA', 'HUANCAVELICA', 'MOYA'),
('090113', 'HUANCAVELICA', 'HUANCAVELICA', 'NUEVO OCCORO'),
('090114', 'HUANCAVELICA', 'HUANCAVELICA', 'PALCA'),
('090115', 'HUANCAVELICA', 'HUANCAVELICA', 'PILCHACA'),
('090116', 'HUANCAVELICA', 'HUANCAVELICA', 'VILCA'),
('090117', 'HUANCAVELICA', 'HUANCAVELICA', 'YAULI'),
('090118', 'HUANCAVELICA', 'HUANCAVELICA', 'ASCENSION'),
('090119', 'HUANCAVELICA', 'HUANCAVELICA', 'HUANDO');

-- =====================================================
-- PASCO (Código 19)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('190101', 'PASCO', 'PASCO', 'CHAUPIMARCA'),
('190102', 'PASCO', 'PASCO', 'HUACHON'),
('190103', 'PASCO', 'PASCO', 'HUARIACA'),
('190104', 'PASCO', 'PASCO', 'HUAYLLAY'),
('190105', 'PASCO', 'PASCO', 'NINACACA'),
('190106', 'PASCO', 'PASCO', 'PALLANCHACRA'),
('190107', 'PASCO', 'PASCO', 'PAUCARTAMBO'),
('190108', 'PASCO', 'PASCO', 'SAN FRANCISCO DE ASIS DE YARUSYACAN'),
('190109', 'PASCO', 'PASCO', 'SIMON BOLIVAR'),
('190110', 'PASCO', 'PASCO', 'TICLACAYAN'),
('190111', 'PASCO', 'PASCO', 'TINYAHUARCO'),
('190112', 'PASCO', 'PASCO', 'VICCO'),
('190113', 'PASCO', 'PASCO', 'YANACANCHA');

-- =====================================================
-- TUMBES (Código 24)
-- =====================================================
INSERT INTO ubigeo (ubigeo_code, departamento, provincia, distrito) VALUES
('240101', 'TUMBES', 'TUMBES', 'TUMBES'),
('240102', 'TUMBES', 'TUMBES', 'CORRALES'),
('240103', 'TUMBES', 'TUMBES', 'LA CRUZ'),
('240104', 'TUMBES', 'TUMBES', 'PAMPAS DE HOSPITAL'),
('240105', 'TUMBES', 'TUMBES', 'SAN JACINTO'),
('240106', 'TUMBES', 'TUMBES', 'SAN JUAN DE LA VIRGEN');

-- Verificar total de registros insertados
SELECT COUNT(*) as total_ubigeos FROM ubigeo;
