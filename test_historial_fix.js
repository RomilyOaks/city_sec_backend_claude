/**
 * ===================================================
 * SCRIPT DE PRUEBA - FIX HISTORIAL ESTADOS NOVEDAD
 * ===================================================
 * 
 * Este script simula la llamada del frontend para verificar
 * que el historial de estados se guarde correctamente
 */

import axios from 'axios';

// Configuración
const BASE_URL = 'http://localhost:3000/api/v1';
const NOVEDAD_ID = 1; // ID de una novedad de prueba
const TOKEN = 'tu_token_de_autenticacion'; // Reemplazar con token real

// Datos de prueba - Simula lo que envía el frontend
const payloadAsignarRecursos = {
  unidad_oficina_id: 1,
  vehiculo_id: 26,
  personal_cargo_id: 20,
  personal_seguridad2_id: "",
  personal_seguridad3_id: "",
  personal_seguridad4_id: "",
  km_inicial: "",
  km_final: "",
  fecha_despacho: "2026-03-20T03:05",
  fecha_llegada: "2026-03-20T03:06",
  turno: "NOCHE",
  observaciones: "Unidad despachada al lugar",
  estado_novedad_id: 7, // CERRADA
  requiere_seguimiento: true,
  fecha_cierre: "2026-03-22T22:27",
  fecha_proxima_revision: "",
  perdidas_materiales_estimadas: "232.00",
  // NO enviar historial aquí para que el backend no actualice el estado
  historial: null 
};

// Datos para crear historial - Simula la llamada separada del frontend
const payloadCrearHistorial = {
  estado_nuevo_id: 7, // CERRADA
  estado_anterior_id: 6, // RESUELTA - ESTE ES EL CAMPO CLAVE
  observaciones: "aaaaaaa bbbbbbb ccccccccc",
  fecha_cambio: "2026-03-22T22:27:00"
};

async function testHistorialFix() {
  try {
    console.log('🔍 INICIANDO PRUEBA DE FIX HISTORIAL ESTADOS\n');

    // 1. Asignar recursos (sin actualizar estado)
    console.log('📋 Paso 1: Asignando recursos...');
    const responseAsignar = await axios.put(
      `${BASE_URL}/novedades/${NOVEDAD_ID}/asignar`,
      payloadAsignarRecursos,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Recursos asignados exitosamente');
    console.log('📊 Estado de la novedad después de asignar recursos:', 
      responseAsignar.data.data.novedadEstado.nombre);

    // 2. Crear historial con estado anterior correcto
    console.log('\n📋 Paso 2: Creando historial de estados...');
    const responseHistorial = await axios.post(
      `${BASE_URL}/novedades/${NOVEDAD_ID}/historial`,
      payloadCrearHistorial,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Historial creado exitosamente');
    console.log('📊 Datos del historial creado:');
    console.log('  - Estado Anterior:', responseHistorial.data.data.estadoAnterior.nombre);
    console.log('  - Estado Nuevo:', responseHistorial.data.data.estadoNuevo.nombre);
    console.log('  - Observaciones:', responseHistorial.data.data.observaciones);

    // 3. Verificar historial completo
    console.log('\n📋 Paso 3: Verificando historial completo...');
    const responseHistorialCompleto = await axios.get(
      `${BASE_URL}/novedades/${NOVEDAD_ID}/historial`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );

    console.log('📊 Historial completo de la novedad:');
    responseHistorialCompleto.data.data.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.estadoAnterior?.nombre || 'INICIO'} → ${item.estadoNuevo.nombre}`);
      console.log(`     ${item.observaciones}`);
    });

    // 4. Verificar resultado esperado
    const ultimoHistorial = responseHistorialCompleto.data.data[0];
    const transicionCorrecta = ultimoHistorial.estadoAnterior.nombre === 'RESUELTA' && 
                              ultimoHistorial.estadoNuevo.nombre === 'CERRADA';

    if (transicionCorrecta) {
      console.log('\n🎉 ✅ PRUEBA EXITOSA - El fix funciona correctamente!');
      console.log('📈 Transición correcta: RESUELTA → CERRADA');
    } else {
      console.log('\n❌ PRUEBA FALLIDA - El fix no funciona');
      console.log(`📈 Transición incorrecta: ${ultimoHistorial.estadoAnterior?.nombre} → ${ultimoHistorial.estadoNuevo.nombre}`);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

// Ejecutar prueba
testHistorialFix();
