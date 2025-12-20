/**
 * Script para poblar la tabla ubigeo con datos reales del Perú
 * Ejecutar: node scripts/seedUbigeo.js
 */

import sequelize from '../src/config/database.js';
import Ubigeo from '../src/models/Ubigeo.js';

const ubigeos = [
  // LIMA Metropolitana
  { ubigeo_code: '150101', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LIMA' },
  { ubigeo_code: '150102', departamento: 'LIMA', provincia: 'LIMA', distrito: 'ANCON' },
  { ubigeo_code: '150103', departamento: 'LIMA', provincia: 'LIMA', distrito: 'ATE' },
  { ubigeo_code: '150104', departamento: 'LIMA', provincia: 'LIMA', distrito: 'BARRANCO' },
  { ubigeo_code: '150105', departamento: 'LIMA', provincia: 'LIMA', distrito: 'BREÑA' },
  { ubigeo_code: '150106', departamento: 'LIMA', provincia: 'LIMA', distrito: 'CARABAYLLO' },
  { ubigeo_code: '150107', departamento: 'LIMA', provincia: 'LIMA', distrito: 'CHACLACAYO' },
  { ubigeo_code: '150108', departamento: 'LIMA', provincia: 'LIMA', distrito: 'CHORRILLOS' },
  { ubigeo_code: '150109', departamento: 'LIMA', provincia: 'LIMA', distrito: 'CIENEGUILLA' },
  { ubigeo_code: '150110', departamento: 'LIMA', provincia: 'LIMA', distrito: 'COMAS' },
  { ubigeo_code: '150111', departamento: 'LIMA', provincia: 'LIMA', distrito: 'EL AGUSTINO' },
  { ubigeo_code: '150112', departamento: 'LIMA', provincia: 'LIMA', distrito: 'INDEPENDENCIA' },
  { ubigeo_code: '150113', departamento: 'LIMA', provincia: 'LIMA', distrito: 'JESUS MARIA' },
  { ubigeo_code: '150114', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LA MOLINA' },
  { ubigeo_code: '150115', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LA VICTORIA' },
  { ubigeo_code: '150116', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LINCE' },
  { ubigeo_code: '150117', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LOS OLIVOS' },
  { ubigeo_code: '150118', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LURIGANCHO' },
  { ubigeo_code: '150119', departamento: 'LIMA', provincia: 'LIMA', distrito: 'LURIN' },
  { ubigeo_code: '150120', departamento: 'LIMA', provincia: 'LIMA', distrito: 'MAGDALENA DEL MAR' },
  { ubigeo_code: '150121', departamento: 'LIMA', provincia: 'LIMA', distrito: 'PUEBLO LIBRE' },
  { ubigeo_code: '150122', departamento: 'LIMA', provincia: 'LIMA', distrito: 'MIRAFLORES' },
  { ubigeo_code: '150123', departamento: 'LIMA', provincia: 'LIMA', distrito: 'PACHACAMAC' },
  { ubigeo_code: '150124', departamento: 'LIMA', provincia: 'LIMA', distrito: 'PUCUSANA' },
  { ubigeo_code: '150125', departamento: 'LIMA', provincia: 'LIMA', distrito: 'PUENTE PIEDRA' },
  { ubigeo_code: '150126', departamento: 'LIMA', provincia: 'LIMA', distrito: 'PUNTA HERMOSA' },
  { ubigeo_code: '150127', departamento: 'LIMA', provincia: 'LIMA', distrito: 'PUNTA NEGRA' },
  { ubigeo_code: '150128', departamento: 'LIMA', provincia: 'LIMA', distrito: 'RIMAC' },
  { ubigeo_code: '150129', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN BARTOLO' },
  { ubigeo_code: '150130', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN BORJA' },
  { ubigeo_code: '150131', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN ISIDRO' },
  { ubigeo_code: '150132', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN JUAN DE LURIGANCHO' },
  { ubigeo_code: '150133', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN JUAN DE MIRAFLORES' },
  { ubigeo_code: '150134', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN LUIS' },
  { ubigeo_code: '150135', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN MARTIN DE PORRES' },
  { ubigeo_code: '150136', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SAN MIGUEL' },
  { ubigeo_code: '150137', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SANTA ANITA' },
  { ubigeo_code: '150138', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SANTA MARIA DEL MAR' },
  { ubigeo_code: '150139', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SANTA ROSA' },
  { ubigeo_code: '150140', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SANTIAGO DE SURCO' },
  { ubigeo_code: '150141', departamento: 'LIMA', provincia: 'LIMA', distrito: 'SURQUILLO' },
  { ubigeo_code: '150142', departamento: 'LIMA', provincia: 'LIMA', distrito: 'VILLA EL SALVADOR' },
  { ubigeo_code: '150143', departamento: 'LIMA', provincia: 'LIMA', distrito: 'VILLA MARIA DEL TRIUNFO' },

  // CALLAO
  { ubigeo_code: '070101', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'CALLAO' },
  { ubigeo_code: '070102', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'BELLAVISTA' },
  { ubigeo_code: '070103', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'CARMEN DE LA LEGUA REYNOSO' },
  { ubigeo_code: '070104', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'LA PERLA' },
  { ubigeo_code: '070105', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'LA PUNTA' },
  { ubigeo_code: '070106', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'VENTANILLA' },
  { ubigeo_code: '070107', departamento: 'CALLAO', provincia: 'CALLAO', distrito: 'MI PERU' },

  // AREQUIPA
  { ubigeo_code: '040101', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'AREQUIPA' },
  { ubigeo_code: '040102', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'ALTO SELVA ALEGRE' },
  { ubigeo_code: '040103', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'CAYMA' },
  { ubigeo_code: '040104', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'CERRO COLORADO' },
  { ubigeo_code: '040105', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'CHARACATO' },
  { ubigeo_code: '040106', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'CHIGUATA' },
  { ubigeo_code: '040107', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'JACOBO HUNTER' },
  { ubigeo_code: '040108', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'LA JOYA' },
  { ubigeo_code: '040109', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'MARIANO MELGAR' },
  { ubigeo_code: '040110', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'MIRAFLORES' },
  { ubigeo_code: '040111', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'MOLLEBAYA' },
  { ubigeo_code: '040112', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'PAUCARPATA' },
  { ubigeo_code: '040122', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'SOCABAYA' },
  { ubigeo_code: '040123', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'TIABAYA' },
  { ubigeo_code: '040124', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'UCHUMAYO' },
  { ubigeo_code: '040126', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'YANAHUARA' },
  { ubigeo_code: '040129', departamento: 'AREQUIPA', provincia: 'AREQUIPA', distrito: 'JOSE LUIS BUSTAMANTE Y RIVERO' },

  // CUSCO
  { ubigeo_code: '080101', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'CUSCO' },
  { ubigeo_code: '080102', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'CCORCA' },
  { ubigeo_code: '080103', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'POROY' },
  { ubigeo_code: '080104', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'SAN JERONIMO' },
  { ubigeo_code: '080105', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'SAN SEBASTIAN' },
  { ubigeo_code: '080106', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'SANTIAGO' },
  { ubigeo_code: '080107', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'SAYLLA' },
  { ubigeo_code: '080108', departamento: 'CUSCO', provincia: 'CUSCO', distrito: 'WANCHAQ' },

  // LA LIBERTAD - TRUJILLO
  { ubigeo_code: '130101', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'TRUJILLO' },
  { ubigeo_code: '130102', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'EL PORVENIR' },
  { ubigeo_code: '130103', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'FLORENCIA DE MORA' },
  { ubigeo_code: '130104', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'HUANCHACO' },
  { ubigeo_code: '130105', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'LA ESPERANZA' },
  { ubigeo_code: '130106', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'LAREDO' },
  { ubigeo_code: '130107', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'MOCHE' },
  { ubigeo_code: '130109', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'SALAVERRY' },
  { ubigeo_code: '130111', departamento: 'LA LIBERTAD', provincia: 'TRUJILLO', distrito: 'VICTOR LARCO HERRERA' },

  // PIURA
  { ubigeo_code: '200101', departamento: 'PIURA', provincia: 'PIURA', distrito: 'PIURA' },
  { ubigeo_code: '200104', departamento: 'PIURA', provincia: 'PIURA', distrito: 'CASTILLA' },
  { ubigeo_code: '200105', departamento: 'PIURA', provincia: 'PIURA', distrito: 'CATACAOS' },
  { ubigeo_code: '200115', departamento: 'PIURA', provincia: 'PIURA', distrito: 'VEINTISEIS DE OCTUBRE' },

  // LAMBAYEQUE - CHICLAYO
  { ubigeo_code: '140101', departamento: 'LAMBAYEQUE', provincia: 'CHICLAYO', distrito: 'CHICLAYO' },
  { ubigeo_code: '140105', departamento: 'LAMBAYEQUE', provincia: 'CHICLAYO', distrito: 'JOSE LEONARDO ORTIZ' },
  { ubigeo_code: '140106', departamento: 'LAMBAYEQUE', provincia: 'CHICLAYO', distrito: 'LA VICTORIA' },
  { ubigeo_code: '140112', departamento: 'LAMBAYEQUE', provincia: 'CHICLAYO', distrito: 'PIMENTEL' },

  // ANCASH - HUARAZ
  { ubigeo_code: '020101', departamento: 'ANCASH', provincia: 'HUARAZ', distrito: 'HUARAZ' },
  { ubigeo_code: '020105', departamento: 'ANCASH', provincia: 'HUARAZ', distrito: 'INDEPENDENCIA' },
  { ubigeo_code: '021801', departamento: 'ANCASH', provincia: 'SANTA', distrito: 'CHIMBOTE' },
  { ubigeo_code: '021809', departamento: 'ANCASH', provincia: 'SANTA', distrito: 'NUEVO CHIMBOTE' },

  // JUNIN - HUANCAYO
  { ubigeo_code: '120101', departamento: 'JUNIN', provincia: 'HUANCAYO', distrito: 'HUANCAYO' },
  { ubigeo_code: '120107', departamento: 'JUNIN', provincia: 'HUANCAYO', distrito: 'CHILCA' },
  { ubigeo_code: '120114', departamento: 'JUNIN', provincia: 'HUANCAYO', distrito: 'EL TAMBO' },
  { ubigeo_code: '120125', departamento: 'JUNIN', provincia: 'HUANCAYO', distrito: 'PILCOMAYO' },

  // ICA
  { ubigeo_code: '110101', departamento: 'ICA', provincia: 'ICA', distrito: 'ICA' },
  { ubigeo_code: '110102', departamento: 'ICA', provincia: 'ICA', distrito: 'LA TINGUIÑA' },
  { ubigeo_code: '110106', departamento: 'ICA', provincia: 'ICA', distrito: 'PARCONA' },
  { ubigeo_code: '110110', departamento: 'ICA', provincia: 'ICA', distrito: 'SAN JUAN BAUTISTA' },
  { ubigeo_code: '110111', departamento: 'ICA', provincia: 'ICA', distrito: 'SANTIAGO' },
  { ubigeo_code: '110112', departamento: 'ICA', provincia: 'ICA', distrito: 'SUBTANJALLA' },

  // TACNA
  { ubigeo_code: '230101', departamento: 'TACNA', provincia: 'TACNA', distrito: 'TACNA' },
  { ubigeo_code: '230102', departamento: 'TACNA', provincia: 'TACNA', distrito: 'ALTO DE LA ALIANZA' },
  { ubigeo_code: '230104', departamento: 'TACNA', provincia: 'TACNA', distrito: 'CIUDAD NUEVA' },
  { ubigeo_code: '230108', departamento: 'TACNA', provincia: 'TACNA', distrito: 'POCOLLAY' },
  { ubigeo_code: '230110', departamento: 'TACNA', provincia: 'TACNA', distrito: 'CORONEL GREGORIO ALBARRACIN LANCHIPA' },

  // PUNO
  { ubigeo_code: '210101', departamento: 'PUNO', provincia: 'PUNO', distrito: 'PUNO' },
  { ubigeo_code: '211101', departamento: 'PUNO', provincia: 'SAN ROMAN', distrito: 'JULIACA' },

  // LORETO - IQUITOS
  { ubigeo_code: '160101', departamento: 'LORETO', provincia: 'MAYNAS', distrito: 'IQUITOS' },
  { ubigeo_code: '160108', departamento: 'LORETO', provincia: 'MAYNAS', distrito: 'PUNCHANA' },
  { ubigeo_code: '160112', departamento: 'LORETO', provincia: 'MAYNAS', distrito: 'BELEN' },
  { ubigeo_code: '160113', departamento: 'LORETO', provincia: 'MAYNAS', distrito: 'SAN JUAN BAUTISTA' },

  // SAN MARTIN - TARAPOTO
  { ubigeo_code: '220901', departamento: 'SAN MARTIN', provincia: 'SAN MARTIN', distrito: 'TARAPOTO' },
  { ubigeo_code: '220909', departamento: 'SAN MARTIN', provincia: 'SAN MARTIN', distrito: 'LA BANDA DE SHILCAYO' },
  { ubigeo_code: '220910', departamento: 'SAN MARTIN', provincia: 'SAN MARTIN', distrito: 'MORALES' },

  // UCAYALI - PUCALLPA
  { ubigeo_code: '250101', departamento: 'UCAYALI', provincia: 'CORONEL PORTILLO', distrito: 'CALLERIA' },
  { ubigeo_code: '250105', departamento: 'UCAYALI', provincia: 'CORONEL PORTILLO', distrito: 'YARINACOCHA' },
  { ubigeo_code: '250107', departamento: 'UCAYALI', provincia: 'CORONEL PORTILLO', distrito: 'MANANTAY' },

  // CAJAMARCA
  { ubigeo_code: '060101', departamento: 'CAJAMARCA', provincia: 'CAJAMARCA', distrito: 'CAJAMARCA' },
  { ubigeo_code: '060108', departamento: 'CAJAMARCA', provincia: 'CAJAMARCA', distrito: 'LOS BAÑOS DEL INCA' },

  // AYACUCHO
  { ubigeo_code: '050101', departamento: 'AYACUCHO', provincia: 'HUAMANGA', distrito: 'AYACUCHO' },
  { ubigeo_code: '050104', departamento: 'AYACUCHO', provincia: 'HUAMANGA', distrito: 'CARMEN ALTO' },
  { ubigeo_code: '050110', departamento: 'AYACUCHO', provincia: 'HUAMANGA', distrito: 'SAN JUAN BAUTISTA' },
  { ubigeo_code: '050115', departamento: 'AYACUCHO', provincia: 'HUAMANGA', distrito: 'JESUS NAZARENO' },

  // HUANUCO
  { ubigeo_code: '100101', departamento: 'HUANUCO', provincia: 'HUANUCO', distrito: 'HUANUCO' },
  { ubigeo_code: '100102', departamento: 'HUANUCO', provincia: 'HUANUCO', distrito: 'AMARILIS' },
  { ubigeo_code: '100111', departamento: 'HUANUCO', provincia: 'HUANUCO', distrito: 'PILLCO MARCA' },

  // MADRE DE DIOS
  { ubigeo_code: '170101', departamento: 'MADRE DE DIOS', provincia: 'TAMBOPATA', distrito: 'TAMBOPATA' },

  // MOQUEGUA
  { ubigeo_code: '180101', departamento: 'MOQUEGUA', provincia: 'MARISCAL NIETO', distrito: 'MOQUEGUA' },
  { ubigeo_code: '180104', departamento: 'MOQUEGUA', provincia: 'MARISCAL NIETO', distrito: 'SAMEGUA' },

  // AMAZONAS
  { ubigeo_code: '010101', departamento: 'AMAZONAS', provincia: 'CHACHAPOYAS', distrito: 'CHACHAPOYAS' },

  // APURIMAC
  { ubigeo_code: '030101', departamento: 'APURIMAC', provincia: 'ABANCAY', distrito: 'ABANCAY' },
  { ubigeo_code: '030109', departamento: 'APURIMAC', provincia: 'ABANCAY', distrito: 'TAMBURCO' },

  // HUANCAVELICA
  { ubigeo_code: '090101', departamento: 'HUANCAVELICA', provincia: 'HUANCAVELICA', distrito: 'HUANCAVELICA' },
  { ubigeo_code: '090118', departamento: 'HUANCAVELICA', provincia: 'HUANCAVELICA', distrito: 'ASCENSION' },

  // PASCO
  { ubigeo_code: '190101', departamento: 'PASCO', provincia: 'PASCO', distrito: 'CHAUPIMARCA' },
  { ubigeo_code: '190113', departamento: 'PASCO', provincia: 'PASCO', distrito: 'YANACANCHA' },

  // TUMBES
  { ubigeo_code: '240101', departamento: 'TUMBES', provincia: 'TUMBES', distrito: 'TUMBES' },
  { ubigeo_code: '240102', departamento: 'TUMBES', provincia: 'TUMBES', distrito: 'CORRALES' },
];

async function seedUbigeo() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    console.log('Insertando ubigeos (ignorando duplicados)...');

    console.log(`Insertando ${ubigeos.length} registros de ubigeo...`);
    await Ubigeo.bulkCreate(ubigeos, { ignoreDuplicates: true });

    const count = await Ubigeo.count();
    console.log(`✅ Seed completado. Total de ubigeos: ${count}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedUbigeo();
